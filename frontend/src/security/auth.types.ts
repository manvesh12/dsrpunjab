import type { Role } from "./permissions";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  district?: string;
  department?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}
