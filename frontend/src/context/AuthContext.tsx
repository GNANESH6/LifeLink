/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, DonorType, AvailabilityStatus } from "../types.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  googleSignInAction: (googlePayload: {
    email: string;
    name: string;
    googleId?: string;
    phone?: string;
    bloodGroup?: string;
    donorType?: DonorType;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<boolean>;
  register: (form: {
    name: string;
    email: string;
    password?: string;
    phone: string;
    age?: number;
    gender?: string;
    bloodGroup: string;
    donorType: DonorType;
    address: string;
    latitude: number;
    longitude: number;
  }) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updates: {
    name?: string;
    phone?: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    donorType?: DonorType;
    address?: string;
    latitude?: number;
    longitude?: number;
    availability?: AvailabilityStatus;
  }) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt load token and profile on mount
    const savedToken = localStorage.getItem("lifelink_token");
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUserProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUserProfile = async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const u = await res.json();
        setUser(u);
      } else {
        // Stale or expired token
        localStorage.removeItem("lifelink_token");
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error("Auth status refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("lifelink_token", data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || "Unauthorized");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const googleSignInAction = async (payload: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Google single-sign-on callback failed");
      }

      localStorage.setItem("lifelink_token", data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || "Google SSO authentication failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (form: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("lifelink_token", data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || "Registration error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: any): Promise<boolean> => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to edit user profile params");
      }

      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update profile details");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("lifelink_token");
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        googleSignInAction,
        register,
        logout,
        updateUserProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be invoked within an AuthProvider context");
  }
  return context;
}
