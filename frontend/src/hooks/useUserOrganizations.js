"use client";

import { useState, useEffect, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import { extracurricularService } from "@/services/extracurricularService";

/**
 * Custom hook to load & cache extracurriculars joined by the currently authenticated user
 * Database relationship: Users -> ExtracurricularMembers -> Extracurriculars
 */
export function useUserOrganizations() {
  const { user, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id || user?.Id;

  const fetchMemberships = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setOrganizations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await extracurricularService.getUserMemberships(userId);
      if (res && res.success) {
        setOrganizations(res.data || []);
      } else {
        setError(res.message || "Gagal memuat keanggotaan organisasi Anda.");
        setOrganizations([]);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memuat data keanggotaan ekstrakurikuler.");
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  return {
    organizations,
    isLoading,
    error,
    refetch: fetchMemberships,
  };
}

export default useUserOrganizations;
