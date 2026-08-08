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
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id || user?.Id;

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // 1. Fetch all registered school extracurriculars
      const allRes = await extracurricularService.getExtracurriculars({ pageSize: 100 });
      const rawAll = allRes?.data ?? allRes;
      const allItems = Array.isArray(rawAll)
        ? rawAll
        : Array.isArray(rawAll?.items)
        ? rawAll.items
        : [];
      setAllOrganizations(allItems);

      // 2. Fetch user specific memberships if authenticated
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
      setError("Terjadi kesalahan saat memuat data ekstrakurikuler.");
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

  // Combine user joined orgs + all registered school orgs, fallback to default list
  const defaultList = [
    { id: "osis", name: "OSIS (Organisasi Siswa Intra Sekolah)" },
    { id: "pramuka", name: "Pramuka" },
    { id: "paskibra", name: "Paskibra" },
    { id: "pmr", name: "PMR (Palang Merah Remaja)" },
  ];

  const combinedList = [];
  const nameSet = new Set();

  // Add user specific orgs first
  userOrganizations.forEach((item) => {
    const name = typeof item === "string" ? item : (item.name || item.Name || item.title || item.Title);
    if (name && !nameSet.has(name.toLowerCase())) {
      nameSet.add(name.toLowerCase());
      combinedList.push(typeof item === "object" ? item : { id: name, name });
    }
  });

  // Add all school orgs
  allOrganizations.forEach((item) => {
    const name = typeof item === "string" ? item : (item.name || item.Name || item.title || item.Title);
    if (name && !nameSet.has(name.toLowerCase())) {
      nameSet.add(name.toLowerCase());
      combinedList.push(typeof item === "object" ? item : { id: name, name });
    }
  });

  // Fallback defaults if still empty
  if (combinedList.length === 0) {
    defaultList.forEach((item) => {
      if (!nameSet.has(item.name.toLowerCase())) {
        nameSet.add(item.name.toLowerCase());
        combinedList.push(item);
      }
    });
  }

  return {
    organizations: combinedList,
    userOrganizations,
    allOrganizations,
    isLoading,
    error,
    refetch: fetchOrganizations,
  };
}

export default useUserOrganizations;
