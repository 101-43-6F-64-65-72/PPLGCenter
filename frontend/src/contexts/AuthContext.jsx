"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import authService from "@/services/authService";
import profileService from "@/services/profileService";
import { extracurricularService } from "@/services/extracurricularService";
import { getStoredToken, setStoredToken } from "@/lib/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [advisorFor, setAdvisorFor] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Restore memberships / advisorFor / permissions from localStorage on initial load
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedM = localStorage.getItem("sc_memberships");
        if (storedM) setMemberships(JSON.parse(storedM));
        const storedA = localStorage.getItem("sc_advisor_for");
        if (storedA) setAdvisorFor(JSON.parse(storedA));
        const storedP = localStorage.getItem("sc_permissions");
        if (storedP) setPermissions(JSON.parse(storedP));
        const storedCG = localStorage.getItem("sc_community_groups");
        if (storedCG) setCommunityGroups(JSON.parse(storedCG));
      } catch (e) {}
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const hasPermission = useCallback((cap) => {
    if (!cap || !Array.isArray(permissions)) return false;
    return permissions.some((p) => p.toLowerCase() === cap.toLowerCase());
  }, [permissions]);

  const hasRole = useCallback((targetRole) => {
    if (!role) return false;
    const rUpper = role.toString().toUpperCase();
    if (Array.isArray(targetRole)) {
      return targetRole.some((r) => r.toUpperCase() === rUpper);
    }
    return rUpper === targetRole.toString().toUpperCase();
  }, [role]);

  /**
   * Fetch authenticated user profile using stored JWT token from database
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
      let userData = null;
      if (res?.success && res?.data) {
        userData = res.data;
      } else if (res?.user) {
        userData = res.user;
      } else if (res?.data) {
        userData = res.data;
      }

      if (userData) {
        setUser(userData);
        const userRole = userData.role || "Student";
        setRole(userRole);

        if (typeof window !== "undefined") {
          if (userData.emailNotif) {
            localStorage.setItem("sc_cached_email_notif", userData.emailNotif);
            localStorage.setItem("sc_cached_email_notif_verified", (userData.isEmailNotifVerified || userData.emailVerifiedAt) ? "true" : "false");
          } else if (userData.emailNotif === null) {
            localStorage.removeItem("sc_cached_email_notif");
            localStorage.removeItem("sc_cached_email_notif_verified");
          }
        }

        // Fetch live supervised extracurriculars from PostgreSQL (for Teachers/Admin)
        if (userRole === "Teacher" || userRole === "Admin" || userData.role === 1) {
          try {
            const supRes = await extracurricularService.getSupervisedByMe();
            if (supRes?.data) {
              setAdvisorFor(supRes.data);
              if (typeof window !== "undefined") {
                localStorage.setItem("sc_advisor_for", JSON.stringify(supRes.data));
              }
            }
          } catch (e) {
            console.error("Failed to fetch supervised extracurriculars in fetchProfile:", e);
          }
        }

        // Fetch live joined extracurricular memberships from PostgreSQL (for Students)
        if (userRole === "Student" || userData.role === 2) {
          try {
            const myRes = await extracurricularService.getMyExtracurriculars();
            const items = myRes?.data?.items || myRes?.items || [];
            const mappedMemberships = items.map((e) => ({
              extracurricularId: e.id,
              name: e.name,
              category: e.category,
              status: "Active",
            }));
            setMemberships(mappedMemberships);
            if (typeof window !== "undefined") {
              localStorage.setItem("sc_memberships", JSON.stringify(mappedMemberships));
            }
          } catch (e) {
            console.error("Failed to fetch student memberships in fetchProfile:", e);
          }
        }
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
    let isMounted = true;
    queueMicrotask(async () => {
      if (isMounted) {
        await fetchProfile();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  /**
   * Log in user
   * @param {Object} credentials - { loginType, fullName, identifier, password }
   */
  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);

      if (res?.success || res?.token || res?.data?.token) {
        const data = res.data || res;
        const token = data.token;
        const userData = data.user || (data.email ? data : null);

        if (token) {
          setStoredToken(token);
        }

        const effectiveRole = data.userType || data.role || userData?.role || "Student";
        setRole(effectiveRole);

        if (data.memberships) {
          setMemberships(data.memberships);
          if (typeof window !== "undefined") {
            localStorage.setItem("sc_memberships", JSON.stringify(data.memberships));
          }
        }

        if (data.advisorFor) {
          setAdvisorFor(data.advisorFor);
          if (typeof window !== "undefined") {
            localStorage.setItem("sc_advisor_for", JSON.stringify(data.advisorFor));
          }
        }

        if (userData) {
          setUser(userData);
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
      setMemberships([]);
      setAdvisorFor([]);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("pplgcenter:pinned-proposals");
          localStorage.removeItem("sc_memberships");
          localStorage.removeItem("sc_advisor_for");
        } catch (e) {}
        window.location.href = "/";
      }
    }
  };

  const value = {
    user,
    role,
    memberships,
    advisorFor,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
