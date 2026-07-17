import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { AuthState, User, LoginResponse } from "./auth.types";

import { apiClient } from "../api/client";

interface AuthContextType extends AuthState {
  login: (data: LoginResponse) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
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
        const user = JSON.parse(storedUser);
        setState({
          isAuthenticated: true,
          user,
          token: storedToken,
          loading: false,
        });
        
        // Attach token to the api client immediately
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch (err) {
        // If parsing fails, clear bad data
        logout();
      }
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const login = (data: LoginResponse) => {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    // Set axios header
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;

    setState({
      isAuthenticated: true,
      user: data.user,
      token: data.accessToken,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Remove axios header
    delete apiClient.defaults.headers.common["Authorization"];

    setState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });
  };

  const updateUser = (updates: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const newUser = { ...prev.user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return { ...prev, user: newUser };
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
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
