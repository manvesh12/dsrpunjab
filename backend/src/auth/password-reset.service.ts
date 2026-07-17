import { passwordService, type PasswordService } from "./security/password.service.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { sendPasswordChangedEmail, sendPasswordResetOtpEmail } from "../email/email.service.js";
import { MAX_OTP_ATTEMPTS, MAX_RESET_RESENDS, OTP_TTL_MINUTES, OTP_TTL_MS, RESEND_COOLDOWN_MS } from "./auth.constants.js";
import { authRepository, type AuthRepositoryContract } from "./auth.repository.js";
import type { AuditRecorder, ClientSecurityContext } from "./auth.types.js";
import { normalizeIdentifier } from "./auth.validator.js";
import { otpService, type OtpService } from "./otp.service.js";

type ResetOtpMailer = typeof sendPasswordResetOtpEmail;
type PasswordChangedMailer = typeof sendPasswordChangedEmail;

export class PasswordResetService {
  constructor(
    private readonly repository: AuthRepositoryContract,
    private readonly otp: OtpService,
    private readonly passwords: PasswordService,
    private readonly sendOtp: ResetOtpMailer,
    private readonly sendChanged: PasswordChangedMailer
  ) {}

  async request(identifierValue: string, audit: AuditRecorder) {
    const identifier = normalizeIdentifier(identifierValue);
    const user = await this.repository.findUserByIdentifier(identifier);
    if (!user || !user.active) {
      audit("PASSWORD_RESET_ACCOUNT_NOT_FOUND", { identifier }, 404);
      throw new ApiError(404, "PASSWORD_RESET_ACCOUNT_NOT_FOUND", "No account found with this email.");
    }
    const latest = await this.repository.findLatestReset(user.email);
    if (latest && latest.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_MS) {
      throw new ApiError(429, "PASSWORD_RESET_COOLDOWN", "Please wait 60 seconds before requesting another OTP.");
    }
    if (await this.repository.countRecentResets(user.email, new Date(Date.now() - 24 * 60 * 60 * 1000)) >= MAX_RESET_RESENDS) {
      throw new ApiError(429, "PASSWORD_RESET_LIMIT", "Resend limit exceeded. Please try again later.");
    }
    const otp = this.otp.generate();
    await this.repository.expireUserResets(user.id);
    await this.repository.createReset(user.id, user.email, await this.otp.hash(otp), new Date(Date.now() + OTP_TTL_MS));
    try {
      await this.sendOtp(user.email, user.fullName, otp, OTP_TTL_MINUTES);
    } catch {
      await this.repository.expireUserResets(user.id);
      audit("PASSWORD_RESET_EMAIL_FAILED", { userId: user.id, identifier: user.email }, 502);
      throw new ApiError(502, "PASSWORD_RESET_EMAIL_FAILED", "Could not send OTP email. Please try again later.");
    }
    audit("PASSWORD_RESET_REQUESTED", { userId: user.id, identifier: user.email }, 200);
    return {
      success: true,
      message: "OTP sent to your registered email.",
      identifier: user.email,
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      resendCooldownSeconds: 60
    };
  }

  async verify(identifierValue: string, otpValue: string, audit: AuditRecorder) {
    const reset = await this.repository.findLatestReset(normalizeIdentifier(identifierValue));
    if (!reset) throw new ApiError(400, "RESET_OTP_INVALID", "Invalid or expired OTP");
    if (reset.expiresAt < new Date()) throw new ApiError(400, "RESET_OTP_EXPIRED", "OTP expired");
    if (reset.attemptCount >= MAX_OTP_ATTEMPTS) {
      throw new ApiError(429, "RESET_OTP_ATTEMPTS_EXCEEDED", "Too many attempts, please request a new OTP.");
    }
    if (!(await this.otp.verify(otpValue, reset.otpHash))) {
      await this.repository.incrementResetAttempts(reset.id);
      throw new ApiError(400, "RESET_OTP_INVALID", "Invalid OTP");
    }
    audit("PASSWORD_RESET_OTP_VERIFIED", { userId: reset.userId }, 200);
    return { success: true, message: "OTP verified" };
  }

  async reset(identifierValue: string, otpValue: string, newPassword: string, context: ClientSecurityContext, audit: AuditRecorder) {
    const reset = await this.repository.findLatestReset(normalizeIdentifier(identifierValue));
    if (!reset || reset.expiresAt < new Date() || reset.attemptCount >= MAX_OTP_ATTEMPTS) {
      throw new ApiError(400, "PASSWORD_RESET_SESSION_INVALID", "Invalid or expired session. Please request a new OTP.");
    }
    if (!(await this.otp.verify(otpValue, reset.otpHash))) throw new ApiError(400, "RESET_OTP_INVALID", "Invalid OTP");
    const changedAt = new Date();
    const user = await this.repository.updateUserPassword(reset.userId, await this.passwords.hash(newPassword));
    await this.repository.markResetUsed(reset.id);
    await this.repository.revokeUserRefreshTokens(reset.userId);
    audit("PASSWORD_RESET_SUCCESS", { userId: reset.userId }, 200);
    await this.sendChanged(user.email, user.fullName, { changedAt, ip: context.ip, userAgent: context.userAgent });
    return { success: true, message: "Password reset successful" };
  }
}

export const passwordResetService = new PasswordResetService(
  authRepository, otpService, passwordService, sendPasswordResetOtpEmail, sendPasswordChangedEmail
);
