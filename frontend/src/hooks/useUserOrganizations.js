"use client";

import { useState, useEffect, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import { extracurricularService } from "@/services/extracurricularService";

/**
 * Custom hook to load extracurriculars joined by current user AND all registered school extracurriculars
 */
export function useUserOrganizations() {
  const { user, isAuthenticated } = useAuth();
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id || user?.Id;

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      if (isAuthenticated && userId) {
        const myRes = await extracurricularService.getUserMemberships(userId);
        const rawMy = myRes?.data ?? myRes;
        const myItems = Array.isArray(rawMy)
          ? rawMy
          : Array.isArray(rawMy?.items)
          ? rawMy.items
          : [];
        setUserOrganizations(myItems);
      } else {
        setUserOrganizations([]);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memuat data keanggotaan ekstrakurikuler.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) fetchOrganizations();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchOrganizations]);

  return {
    userOrganizations,
    isLoading,
    error,
    refetch: fetchOrganizations,
  };
}

export default useUserOrganizations;
