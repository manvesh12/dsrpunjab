import { Prisma, type Invitation } from "@prisma/client";
import { passwordService, type PasswordService } from "./security/password.service.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { logger } from "../common/logging/logger.js";
import { canAdmin } from "../authorization/role.policy.js";
import { sendInvitationOtpEmail, sendWelcomeEmail } from "../email/email.service.js";
import { MAX_INVITE_OTP_RESENDS, MAX_OTP_ATTEMPTS, OTP_TTL_MINUTES, OTP_TTL_MS, RESEND_COOLDOWN_MS } from "./auth.constants.js";
import { authRepository, type AuthRepositoryContract } from "./auth.repository.js";
import type { AuditRecorder } from "./auth.types.js";
import { otpService, type OtpService } from "./otp.service.js";
import { sessionService, type SessionService } from "./session.service.js";

type InvitationOtpMailer = typeof sendInvitationOtpEmail;
type WelcomeMailer = typeof sendWelcomeEmail;

export class InvitedRegistrationService {
  constructor(
    private readonly repository: AuthRepositoryContract,
    private readonly otp: OtpService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly sendOtp: InvitationOtpMailer,
    private readonly sendWelcome: WelcomeMailer
  ) {}

  async details(token: string) {
    const invitation = await this.validInvitation(token);
    return {
      email: invitation.email, role: invitation.role, fullName: invitation.fullName,
      department: invitation.department, designation: invitation.designation, state: invitation.state,
      district: invitation.district, mobileNumber: invitation.mobileNumber
    };
  }

  async verifyLegacyRegistration(email: string, otpValue: string) {
    const record = await this.repository.findOtp(email, ["REGISTER"]);
    if (!record || record.expiresAt < new Date()) throw new ApiError(400, "REGISTER_OTP_INVALID", "Invalid or expired OTP.");
    if (record.attemptCount >= MAX_OTP_ATTEMPTS) {
      throw new ApiError(429, "REGISTER_OTP_ATTEMPTS_EXCEEDED", "Too many attempts. Please request a new OTP by registering again.");
    }
    if (!(await this.otp.verify(otpValue, record.otpHash))) {
      await this.repository.incrementOtpAttempts(record.id);
      throw new ApiError(400, "REGISTER_OTP_INVALID", "Invalid OTP");
    }
    await this.repository.markOtpUsed(record.id);
    await this.repository.activateUser(email);
    return { success: true, message: "Registration verified successfully. You can now login." };
  }

  async start(input: {
    token: string; fullName: string; mobileNumber: string; password: string;
    employeeId?: string; gender?: string; acceptedTerms?: boolean;
  }, audit: AuditRecorder) {
    try {
      const invitation = await this.validInvitation(input.token);
      if (!canAdmin(invitation.role) && !String(invitation.district || "").trim()) {
        throw new ApiError(400, "INVITATION_DISTRICT_MISSING", "This invitation has no district assignment. Please ask the administrator to send a new district-specific invitation.");
      }
      if (await this.repository.findUserByEmail(invitation.email)) {
        throw new ApiError(409, "INVITED_EMAIL_REGISTERED", "This invited email is already registered.");
      }
      if (await this.repository.findOtherUserByMobile(input.mobileNumber, invitation.email)) {
        throw new ApiError(400, "MOBILE_REGISTERED", "Mobile number is already registered to another account");
      }
      const latest = await this.repository.findOtp(invitation.email, ["INVITE_REGISTER"]);
      if (latest && latest.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_MS) {
        throw new ApiError(429, "INVITE_OTP_COOLDOWN", "Please wait 60 seconds before requesting another OTP.");
      }
      const otp = this.otp.generate();
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);
      const pendingProfile = {
        fullName: input.fullName,
        mobileNumber: input.mobileNumber,
        employeeId: input.employeeId || null,
        gender: input.gender || null,
        acceptedTermsAt: new Date().toISOString()
      } satisfies Prisma.InputJsonObject;
      await this.repository.expireOtps(invitation.email, "INVITE_REGISTER");
      await this.repository.createOtp(invitation.email, "INVITE_REGISTER", await this.otp.hash(otp, 12), expiresAt);
      await this.repository.updateInvitation(invitation.id, {
        status: "OTP_SENT",
        pendingProfile,
        pendingPasswordHash: await this.passwords.hash(input.password, 12),
        otpLastSentAt: new Date(),
        otpResendCount: invitation.otpResendCount
      });
      await this.sendOtp(invitation.email, input.fullName, otp);
      audit("INVITE_OTP_SENT", { invitationId: invitation.id, email: invitation.email }, 200);
      return {
        success: true, requiresOtp: true, message: "OTP sent to your invited email address.",
        expiresInSeconds: OTP_TTL_MINUTES * 60, resendCooldownSeconds: 60, attemptsRemaining: MAX_OTP_ATTEMPTS
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : String(error.meta?.target || "");
        if (target.includes("mobileNumber")) throw new ApiError(400, "MOBILE_REGISTERED", "Mobile number is already registered");
        if (target.includes("email")) throw new ApiError(400, "EMAIL_REGISTERED", "Email address is already registered");
        throw new ApiError(400, "UNIQUE_CONSTRAINT_FAILED", `Unique constraint failed on field: ${target}`);
      }
      logger.error("invited_registration_failed", { error: error instanceof Error ? error.message : String(error) });
      throw new ApiError(500, "INVITED_REGISTRATION_FAILED", error instanceof Error ? error.message : "Internal server error during registration");
    }
  }

  async verify(token: string, otpValue: string, audit: AuditRecorder) {
    const invitation = await this.validInvitation(token);
    if (!invitation.pendingProfile || !invitation.pendingPasswordHash) {
      throw new ApiError(400, "INVITED_PROFILE_REQUIRED", "Please complete the registration form first.");
    }
    // `REGISTER` is included for compatibility with records created by older deployments.
    const record = await this.repository.findOtp(invitation.email, ["INVITE_REGISTER", "REGISTER"]);
    if (!record || record.expiresAt < new Date()) throw new ApiError(400, "INVITED_OTP_INVALID", "Invalid or expired OTP.");
    if (record.attemptCount >= MAX_OTP_ATTEMPTS) {
      throw new ApiError(429, "INVITED_OTP_ATTEMPTS_EXCEEDED", "Too many attempts. Please request a new OTP.");
    }
    if (!(await this.otp.verify(otpValue, record.otpHash))) {
      await this.repository.incrementOtpAttempts(record.id);
      throw new ApiError(400, "INVITED_OTP_INVALID", "Invalid OTP");
    }
    const user = await this.repository.completeInvitation(invitation, record.id, invitation.pendingProfile as Record<string, any>);
    this.sendWelcome(user.email, user.fullName)
      .catch(error => logger.error("welcome_email_failed", { email: user.email, error: error instanceof Error ? error.message : String(error) }));
    const session = await this.sessions.create(user);
    audit("AUTH_REGISTER_INVITED_SUCCESS", { username: user.username, role: user.role }, 200);
    return {
      session,
      response: { success: true, message: "Registration completed successfully", ...session.response }
    };
  }

  async resend(token: string, audit: AuditRecorder) {
    const invitation = await this.validInvitation(token);
    if (!invitation.pendingProfile) throw new ApiError(400, "INVITED_PROFILE_REQUIRED", "Please complete the registration form first.");
    if (invitation.otpResendCount >= MAX_INVITE_OTP_RESENDS) {
      throw new ApiError(429, "INVITE_OTP_RESEND_LIMIT", "Maximum OTP resend limit reached.");
    }
    if (invitation.otpLastSentAt && invitation.otpLastSentAt.getTime() > Date.now() - RESEND_COOLDOWN_MS) {
      throw new ApiError(429, "INVITE_OTP_COOLDOWN", "Please wait 60 seconds before requesting another OTP.");
    }
    const profile = invitation.pendingProfile as Record<string, any>;
    const otp = this.otp.generate();
    await this.repository.expireOtps(invitation.email, "INVITE_REGISTER");
    await this.repository.createOtp(invitation.email, "INVITE_REGISTER", await this.otp.hash(otp, 12), new Date(Date.now() + OTP_TTL_MS));
    await this.repository.updateInvitation(invitation.id, {
      status: "OTP_SENT", otpLastSentAt: new Date(), otpResendCount: { increment: 1 }
    });
    await this.sendOtp(invitation.email, String(profile.fullName || invitation.fullName || invitation.email), otp);
    audit("INVITE_OTP_RESENT", { invitationId: invitation.id, email: invitation.email }, 200);
    return { success: true, message: "OTP resent to your invited email address.", expiresInSeconds: 600, resendCooldownSeconds: 60 };
  }

  private async validInvitation(token: string): Promise<Invitation> {
    const invitation = await this.repository.findInvitation(token);
    if (!invitation || invitation.status === "CANCELLED" || invitation.status === "REGISTERED") {
      throw new ApiError(400, "INVITATION_INVALID", "Invalid or expired invitation link");
    }
    if (invitation.expiresAt < new Date()) {
      await this.repository.updateInvitation(invitation.id, { status: "EXPIRED" }).catch(() => undefined);
      throw new ApiError(400, "INVITATION_EXPIRED", "Invitation expired");
    }
    return invitation;
  }
}

export const invitedRegistrationService = new InvitedRegistrationService(
  authRepository, otpService, passwordService, sessionService, sendInvitationOtpEmail, sendWelcomeEmail
);
