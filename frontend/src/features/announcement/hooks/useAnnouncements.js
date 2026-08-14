"use client";

import { useQuery } from "@/lib/queryClient";
import announcementService from "@/services/announcementService";
import { QUERY_KEYS } from "@/constants/queryKeys";

/**
 * Custom hook for fetching announcements with filtering & pagination
 * @param {Object} params - { page, pageSize, category, search }
 */
export const useAnnouncements = (params = {}) => {
  const { page = 1, pageSize = 10, category = "Semua", search = "" } = params;

  return useQuery({
    queryKey: [...QUERY_KEYS.ANNOUNCEMENTS, { page, pageSize, category, search }],
    queryFn: () => announcementService.getAnnouncements({ page, pageSize, category, search }),
    keepPreviousData: true,
    staleTime: 3 * 60 * 1000,
  });
};

export default useAnnouncements;
