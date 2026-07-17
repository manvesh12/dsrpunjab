import { apiClient } from "./client";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface BackendUser {
  username: string;
  email: string;
  fullName: string;
  role: string;        // "ROLE_SUPER_ADMIN" etc.
  uiRole: string;      // "Super Admin" etc.
  permissions: string[];
  scope: {
    districtId: number | null;
    blockName: string | null;
    sectionName: string | null;
  };
  accessLabel: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  uiRole: string;
  permissions: string[];
  scope: {
    districtId: number | null;
    blockName: string | null;
    sectionName: string | null;
  };
  accessLabel: string;
}

export interface ForgotPasswordPayload {
  identifier: string; // email or username
}

export interface VerifyOtpPayload {
  identifier: string;
  otp: string;
}

export interface ResetPasswordPayload {
  identifier: string;
  otp: string;
  newPassword: string;
}

export const authApi = {
  /** Login with username + password */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
    return data;
  },

  /** Logout — clears httpOnly cookie server-side */
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  /** Request a password reset OTP via email/username */
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/auth/forgot-password", payload);
    return data;
  },

  /** Verify the OTP received by email for password reset */
  verifyResetOtp: async (payload: VerifyOtpPayload): Promise<{ valid: boolean; resetToken?: string }> => {
    const { data } = await apiClient.post("/auth/verify-reset-otp", payload);
    return data;
  },

  /** Set a new password after OTP verification */
  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/auth/reset-password", payload);
    return data;
  },

  /** Get details of an invitation by token */
  getInvitationDetails: async (token: string) => {
    const { data } = await apiClient.get(`/auth/invitation/${token}`);
    return data;
  },

  /** Register via invitation link */
  registerInvited: async (payload: { token: string; password: string; fullName?: string }) => {
    const { data } = await apiClient.post("/auth/register-invited", payload);
    return data;
  },

  /** Verify OTP for invited registration — returns session */
  verifyInvitedOtp: async (payload: { token: string; otp: string }): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>("/auth/verify-invited-otp", payload);
    return data;
  },

  /** Resend OTP for invited registration */
  resendInvitedOtp: async (token: string) => {
    const { data } = await apiClient.post("/auth/resend-invited-otp", { token });
    return data;
  },
};
