import { environment } from "../config/environment.js";

export const OTP_TTL_MINUTES = 10;
export const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;
export const MAX_RESET_RESENDS = 5;
export const MAX_INVITE_OTP_RESENDS = 3;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: environment.isProduction,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 15 * 60 * 1000
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: environment.isProduction,
  sameSite: "strict" as const,
  path: "/api/auth/refresh",
  maxAge: REFRESH_TOKEN_TTL_MS
};
