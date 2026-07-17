import crypto from "node:crypto";

import { ApiError } from "../common/exceptions/api-error.js";
import { logger } from "../common/logging/logger.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { sendInvitationEmail } from "../email/email.service.js";
import { INVITATION_TTL_MS, PHONE_INVITATION_DOMAIN } from "./users.constants.js";
import { usersRepository, type UsersRepositoryContract } from "./users.repository.js";
import { normalizeRole, normalizedBulkRole, requiredDistrict, requiresDistrict, rowValue } from "./users.validator.js";
import { userSpreadsheetService, type UserSpreadsheetService } from "./user-spreadsheet.service.js";

type InvitationMailer = (email: string, token: string, role: string) => Promise<unknown>;

export class InvitationService {
  constructor(
    private readonly repository: UsersRepositoryContract,
    private readonly spreadsheets: UserSpreadsheetService,
    private readonly sendInvitation: InvitationMailer
  ) {}

  async invite(body: any, user: AuthUser) {
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) throw new ApiError(400, "INVITATION_EMAIL_REQUIRED", "Email is required");
    const role = normalizeRole(body?.role);
    let districtId = null;
    const rawDistrict = String(body?.district || "").trim();
    if (rawDistrict && rawDistrict.toUpperCase() !== "ALL") {
      const d = await this.repository.findDistrictByName(rawDistrict);
      districtId = d ? d.id.toString() : null;
      if (!districtId) throw new ApiError(400, "INVALID_DISTRICT", `District '${rawDistrict}' not found`);
    } else if (requiresDistrict(role)) {
      throw new ApiError(400, "DISTRICT_REQUIRED", "District is required for every non-admin account.");
    }
    
    const profile = {
      fullName: String(body?.fullName || "").trim() || null,
      department: String(body?.department || "").trim() || null,
      designation: String(body?.designation || "").trim() || null,
      state: String(body?.state || "Punjab").trim() || "Punjab",
      district: districtId,
      mobileNumber: String(body?.mobileNumber || "").trim() || null
    };
    if (await this.repository.findByEmail(email)) throw new ApiError(400, "USER_EMAIL_EXISTS", "User with this email already exists");
    this.ensureInvitationAvailable(await this.repository.findInvitation(email), "An active invitation already exists for this email");
    const token = this.token();
    const expiresAt = this.expiresAt();
    const invitation = await this.repository.upsertInvitation(
      email,
      { email, token, role, ...profile, expiresAt, status: "INVITED", createdBy: user.id },
      {
        token, role, ...profile, expiresAt, status: "INVITED", createdBy: user.id,
        pendingProfile: undefined, pendingPasswordHash: null, otpResendCount: 0,
        otpLastSentAt: null, registeredAt: null
      }
    );
    try {
      await this.sendInvitation(email, token, role);
      await this.repository.updateInvitation(invitation.id, { status: "EMAIL_SENT" });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      // If SMTP not configured (dev mode), log the link and continue
      const isEmailNotConfigured = errMsg.includes("SMTP_USER") || errMsg.includes("not configured") ||
        errMsg.includes("smtpUser") || errMsg.includes("Missing credentials") || errMsg.includes("EAUTH") ||
        errMsg.includes("BREVO_API_KEY");
      if (isEmailNotConfigured) {
        const registrationUrl = `${process.env.PUBLIC_APP_URL || "http://localhost:8081/legacy"}/login.html?invite=${token}`;
        logger.warn("invitation_email_skipped_no_smtp", {
          email,
          role,
          registrationUrl,
          message: "Email not configured. Share this registration link manually with the invitee."
        });
        await this.repository.updateInvitation(invitation.id, { status: "EMAIL_SENT" });
        return { success: true, message: `Invitation created. Email not configured — share this link: ${registrationUrl}` };
      }
      logger.error("invitation_email_failed", { email, error: errMsg });
      throw new ApiError(500, "INVITATION_EMAIL_FAILED", `Failed to send email: ${errMsg}`);
    }
    return { success: true, message: "Invitation sent successfully" };
  }

  async bulk(buffer: Buffer, user: AuthUser) {
    const rows = this.spreadsheets.invitationRows(buffer);
    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; email: string; reason: string }> = [];
    const validRoles = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "DISTRICT_OFFICER", "GEOLOGIST", "SURVEY_OFFICER", "REVIEWER", "DATA_ENTRY_OPERATOR", "REPORT_GENERATOR", "PUBLIC_USER"];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const email = rowValue(row, "email").toLowerCase();
      const phone = rowValue(row, "phone") || rowValue(row, "mobile") || rowValue(row, "mobilenumber");
      const rawRole = rowValue(row, "role");
      const display = email || phone;
      if (!email && !phone && !rawRole) continue;
      const failure = (reason: string, label = display) => { failedCount++; errors.push({ row: index + 2, email: label, reason }); };
      if (!email && !phone) { failure("Email or Phone is required", ""); continue; }

      let targetEmail = email;
      let isPhoneInvite = false;
      let cleanPhone = "";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { failure("Invalid email format", email); continue; }
      if (!email) {
        cleanPhone = phone.replace(/[^0-9]/g, "");
        if (cleanPhone.length < 10) { failure("Invalid phone format (must be at least 10 digits)", `Phone: ${phone}`); continue; }
        targetEmail = `phone-${cleanPhone}@${PHONE_INVITATION_DOMAIN}`;
        isPhoneInvite = true;
      }

      const normalizedRole = normalizedBulkRole(rawRole);
      if (!validRoles.includes(normalizedRole)) { failure(`Invalid role: ${rawRole}`); continue; }
      const role = normalizedRole;
      const district = rowValue(row, "district").trim() || null;
      if (requiresDistrict(role) && !district) { failure("District is required for every non-admin account"); continue; }

      const existingUser = isPhoneInvite
        ? await this.repository.findByMobile(cleanPhone)
        : await this.repository.findByEmail(email);
      if (existingUser) { failure(isPhoneInvite ? "User with this mobile number already exists" : "User with this email already exists"); continue; }

      try {
        this.ensureInvitationAvailable(await this.repository.findInvitation(targetEmail), "Active invitation already exists");
        const token = this.token();
        const expiresAt = this.expiresAt();
        const profile = {
          fullName: rowValue(row, "fullname") || rowValue(row, "name") || null,
          department: rowValue(row, "department") || null,
          designation: rowValue(row, "designation") || null,
          state: rowValue(row, "state") || "Punjab",
          district,
          mobileNumber: phone || null
        };
        const invitation = await this.repository.upsertInvitation(
          targetEmail,
          { email: targetEmail, token, role, ...profile, expiresAt, status: "INVITED", createdBy: user.id },
          { token, role, ...profile, expiresAt, status: "INVITED", createdBy: user.id, otpResendCount: 0, otpLastSentAt: null, registeredAt: null }
        );
        if (isPhoneInvite) {
          logger.info("mock_invitation_sms", { mobileNumber: cleanPhone, registrationUrl: `http://localhost:8081/register.html?token=${token}` });
        } else {
          this.sendInvitation(targetEmail, token, role)
            .then(() => this.repository.updateInvitation(invitation.id, { status: "EMAIL_SENT" }))
            .catch(error => logger.error("background_invitation_email_failed", { email: targetEmail, error: error instanceof Error ? error.message : String(error) }));
        }
        successCount++;
      } catch (error) {
        failure(error instanceof Error ? error.message : "Failed to create invitation");
      }
    }
    return { success: true, successCount, failedCount, errors };
  }

  private ensureInvitationAvailable(invitation: Awaited<ReturnType<UsersRepositoryContract["findInvitation"]>>, message: string) {
    if (invitation && !["CANCELLED", "EXPIRED", "REGISTERED"].includes(invitation.status) && invitation.expiresAt >= new Date()) {
      throw new ApiError(409, "INVITATION_ACTIVE", message);
    }
  }

  private token() { return crypto.randomBytes(32).toString("hex"); }
  private expiresAt() { return new Date(Date.now() + INVITATION_TTL_MS); }
}

export const invitationService = new InvitationService(usersRepository, userSpreadsheetService, sendInvitationEmail);
