import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { apiClient } from "../api/client";
import type { AuthState, User, LoginResponse } from "./auth.types";

interface AuthContextType extends AuthState {
  login: (data: LoginResponse) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "dsr:auth_token";
const USER_KEY = "dsr:auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const user: User = JSON.parse(storedUser);
        setState({
          isAuthenticated: true,
          user,
          token: storedToken,
          loading: false,
        });
        // Attach token to API client immediately
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch {
        _clearSession();
      }
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const _clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete apiClient.defaults.headers.common["Authorization"];
    setState({ isAuthenticated: false, user: null, token: null, loading: false });
  };

  const login = useCallback((data: LoginResponse) => {
    // Normalise: build User from LoginResponse
    const user: User = {
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      uiRole: data.uiRole,
      permissions: data.permissions ?? [],
      scope: data.scope ?? { districtId: null, blockName: null, sectionName: null },
      accessLabel: data.accessLabel ?? data.uiRole,
    };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

    setState({
      isAuthenticated: true,
      user,
      token: data.token,
      loading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if server-side logout fails, clear local session
    }
    _clearSession();
    toast.success("You have been logged out successfully.");
    window.location.href = "/auth/login";
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const newUser = { ...prev.user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return { ...prev, user: newUser };
    });
  }, []);

  /** Check if current user has a specific backend permission string */
  const hasPermission = useCallback((permission: string): boolean => {
    return state.user?.permissions.includes(permission) ?? false;
  }, [state.user]);

  /** Check if current user has at least one of the given permissions */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some((p) => state.user?.permissions.includes(p)) ?? false;
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
