import { z } from "zod";
import { ApiError } from "../common/exceptions/api-error.js";

const loginSchema = z.object({ username: z.string().trim().min(3).max(254), password: z.string().min(1).max(256) });
const identifierSchema = z.object({ identifier: z.string().trim().min(1).max(254) });
const verifyOtpSchema = z.object({ identifier: z.string().min(1), otp: z.string().length(6) });
const resetPasswordSchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6),
  newPassword: z.string().min(10).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/)
});
const verifyRegisterSchema = z.object({ email: z.string().email(), otp: z.string().length(6) });
const registerInvitedSchema = z.object({
  token: z.string().min(1), fullName: z.string().min(1).max(160), mobileNumber: z.string().min(10),
  password: z.string().min(12).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  employeeId: z.string().max(80).optional(), gender: z.string().max(40).optional(), acceptedTerms: z.boolean().optional()
});
const invitedOtpSchema = z.object({ token: z.string().min(1), otp: z.string().length(6) });
const invitationTokenSchema = z.object({ token: z.string().min(1) });

export function loginInput(body: unknown) {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "LOGIN_INPUT_INVALID", "Username and password are required");
  return parsed.data;
}
export function identifierInput(body: unknown) {
  const parsed = identifierSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "IDENTIFIER_REQUIRED", "Identifier is required");
  return parsed.data;
}
export function resetOtpInput(body: unknown) {
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "OTP_INPUT_INVALID", "Invalid payload");
  return parsed.data;
}
export function resetPasswordInput(body: unknown) {
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "PASSWORD_RESET_INPUT_INVALID", "Invalid payload or password doesn't meet criteria");
  return parsed.data;
}
export function verifyRegisterInput(body: unknown) {
  const parsed = verifyRegisterSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "REGISTER_OTP_INPUT_INVALID", "Invalid payload. Need valid email and 6-digit OTP.");
  return parsed.data;
}
export function registerInvitedInput(body: unknown) {
  const parsed = registerInvitedSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(", ");
    throw new ApiError(400, "INVITED_REGISTRATION_INPUT_INVALID", `Validation error: ${message}`);
  }
  if (parsed.data.acceptedTerms !== true) throw new ApiError(400, "TERMS_REQUIRED", "Please accept the terms and conditions to continue.");
  return parsed.data;
}
export function invitedOtpInput(body: unknown) {
  const parsed = invitedOtpSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "INVITED_OTP_INPUT_INVALID", "Invalid payload. Need valid token and 6-digit OTP.");
  return parsed.data;
}
export function invitationTokenInput(body: unknown) {
  const parsed = invitationTokenSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "INVITATION_TOKEN_INVALID", "Invalid invitation token");
  return parsed.data;
}

export function normalizeIdentifier(identifier: string) { return identifier.trim().toLowerCase(); }
