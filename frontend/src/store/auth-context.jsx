"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest, refreshAccessToken, setAccessToken } from "@/lib/api";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
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
            }
            finally {
                if (active)
                    setIsLoading(false);
            }
        }
        void bootstrapSession();
        return () => {
            active = false;
        };
    }, []);
    const login = useCallback(async (input) => {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(input),
            skipAuth: true,
        });
        setAccessToken(data.accessToken);
        setUser(data.user);
    }, []);
    const register = useCallback(async (input) => {
        const data = await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(input),
            skipAuth: true,
        });
        setAccessToken(data.accessToken);
        setUser(data.user);
    }, []);
    const logout = useCallback(async () => {
        try {
            await apiRequest("/auth/logout", {
                method: "POST",
            });
        }
        catch {
            // Clear local session regardless
        }
        finally {
            setAccessToken(null);
            setUser(null);
        }
    }, []);
    const refreshProfile = useCallback(async () => {
        const profileUser = await apiRequest("/profile", { method: "GET" });
        setUser(profileUser);
    }, []);
    const setUserDirect = useCallback((nextUser) => {
        setUser(nextUser);
    }, []);
    return (<AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshProfile, setUserDirect }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
}
