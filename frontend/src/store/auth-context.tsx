"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthResponseData, AuthUserDTO, LoginInput, RegisterInput } from "@careerpilot/shared";
import { apiRequest, refreshAccessToken, setAccessToken } from "@/lib/api";

interface AuthContextValue {
  user: AuthUserDTO | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUserDirect: (user: AuthUserDTO) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function bootstrapSession() {
      try {
        const refreshed = await refreshAccessToken();
        if (active && refreshed) {
          setAccessToken(refreshed.accessToken);
          setUser(refreshed.user);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void bootstrapSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await apiRequest<AuthResponseData>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await apiRequest<AuthResponseData>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest<{ loggedOut: boolean }>("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Clear local session regardless
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const profileUser = await apiRequest<AuthUserDTO>("/profile", { method: "GET" });
    setUser(profileUser);
  }, []);

  const setUserDirect = useCallback((nextUser: AuthUserDTO) => {
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshProfile, setUserDirect }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
