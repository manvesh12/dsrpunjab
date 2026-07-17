// ─── Types that mirror the backend session.service.ts userResponse() ──────────

export interface UserScope {
  districtId: number | null;
  blockName: string | null;
  sectionName: string | null;
}

export interface User {
  id?: string;
  username: string;
  fullName: string;
  email: string;
  /** raw backend role, e.g. "ROLE_SUPER_ADMIN" */
  role: string;
  /** human-readable role, e.g. "Super Admin" */
  uiRole: string;
  /** Array of backend permission strings e.g. ["USER_VIEW", "USER_CREATE"] */
  permissions: string[];
  scope: UserScope;
  accessLabel: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  uiRole: string;
  permissions: string[];
  scope: UserScope;
  accessLabel: string;
}
