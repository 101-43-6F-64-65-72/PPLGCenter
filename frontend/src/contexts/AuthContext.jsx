"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import authService from "@/services/authService";
import profileService from "@/services/profileService";
import { getStoredToken, setStoredToken } from "@/lib/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch authenticated user profile using stored JWT token
   */
  const fetchProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await profileService.getProfile();
      if (res?.success && res?.data) {
        setUser(res.data);
        setRole(res.data.role || "Student");
      } else if (res?.user) {
        setUser(res.user);
        setRole(res.user.role || "Student");
      } else {
        setUser(null);
        setRole(null);
        setStoredToken(null);
      }
    } catch (error) {
      setUser(null);
      setRole(null);
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session on initial mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Log in user
   * @param {Object} credentials - { identifier, password }
   */
  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);

      if (res?.success || res?.token) {
        const token = res.data?.token || res.token;
        const userData = res.data?.user || res.user;

        if (token) {
          setStoredToken(token);
        }

        if (userData) {
          setUser(userData);
          setRole(userData.role || "Student");
        } else {
          await fetchProfile();
        }
      }
      return res;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Log out user
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      setStoredToken(null);
      setUser(null);
      setRole(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
