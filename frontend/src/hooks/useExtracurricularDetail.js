"use client";

import { useState, useEffect, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import { extracurricularService } from "@/services/extracurricularService";
import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Custom Hook for Extracurricular Detail & Membership State
 */
export function useExtracurricularDetail(slug) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || user?.Id;

  const [detailData, setDetailData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [currentMembers, setCurrentMembers] = useState(0);
  const [maxMembers, setMaxMembers] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const fetchDetailAndMembership = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setFetchError("");

    try {
      // 1. Fetch Extracurricular Detail
      const res = await extracurricularService.getExtracurricularById(slug);
      const item = res?.data || res;

      if (!item || (!item.id && !item.Id && !item.name && !item.Name)) {
        setDetailData(null);
        setIsLoading(false);
        return;
      }

      const exId = item.id || item.Id;
      const exName = item.name || item.Name;
      const cat = item.category || item.Category || "Ekstrakurikuler";
      const maxM = item.maxMembers ?? item.maxMember ?? item.MaxMembers ?? 30;
      const curM = item.currentMembers ?? item.membersCount ?? item.extracurricularMembers?.length ?? 0;
      const activeState = item.isActive ?? item.IsActive ?? true;

      const formatted = {
        id: exId,
        name: exName,
        category: cat,
        maxMembers: maxM,
        currentMembers: curM,
        isActive: activeState,
        description: item.description || item.Description || "",
        imageUrl: item.imageUrl || item.ImageUrl || null,
        instructor: item.supervisor?.name || item.advisorName || item.managedByUser?.fullName || item.instructor || "Pembina Ekstrakurikuler",
        supervisor: item.supervisor || null,
        schedule: item.schedule || {
          day: "Sesuai Jadwal",
          time: "15.30 - 17.00 WIB",
          location: "Lingkungan SMKN 2 Surakarta",
        },
      };

      setDetailData(formatted);
      setMaxMembers(maxM);
      setCurrentMembers(curM);
      setIsActive(activeState);

      // 2. Check if currently authenticated user has joined this extracurricular
      if (isAuthenticated && userId && exId) {
        try {
          const membersRes = await apiClient.get(API_ROUTES.EXTRACURRICULARS.MEMBERS(exId), {
            params: { pageSize: 100 },
          });
          const memberItems =
            membersRes?.data?.items ||
            membersRes?.items ||
            membersRes?.data ||
            (Array.isArray(membersRes) ? membersRes : []);

          const userFound =
            Array.isArray(memberItems) &&
            memberItems.some((m) => {
              const sId = m.studentId || m.StudentId || m.userId || m.UserId;
              return sId && String(sId).toLowerCase() === String(userId).toLowerCase();
            });

          setIsJoined(userFound);
          if (Array.isArray(memberItems)) {
            setCurrentMembers(memberItems.length);
          }
        } catch (mErr) {
          // Fallback membership check via user memberships
          try {
            const userMemRes = await extracurricularService.getUserMemberships(userId);
            if (userMemRes.success && Array.isArray(userMemRes.data)) {
              const joinedThis = userMemRes.data.some(
                (ekstra) => String(ekstra.id || ekstra.Id).toLowerCase() === String(exId).toLowerCase()
              );
              setIsJoined(joinedThis);
            }
          } catch (e) {
            // Ignore error
          }
        }
      } else {
        setIsJoined(false);
      }
    } catch (err) {
      setFetchError("Gagal memuat detail ekstrakurikuler.");
      setDetailData(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug, isAuthenticated, userId]);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) fetchDetailAndMembership();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchDetailAndMembership]);

  return {
    detailData,
    isLoading,
    isJoined,
    currentMembers,
    maxMembers,
    isActive,
    fetchError,
    refetch: fetchDetailAndMembership,
  };
}

export default useExtracurricularDetail;
