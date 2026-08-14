"use client";

import { useQuery } from "@/lib/queryClient";
import announcementService from "@/services/announcementService";
import { QUERY_KEYS } from "@/constants/queryKeys";

/**
 * Custom hook for fetching single announcement detail
 * @param {string|number} id
 */
export const useAnnouncement = (id) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ANNOUNCEMENTS, "detail", id],
    queryFn: () => announcementService.getAnnouncementById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export default useAnnouncement;
