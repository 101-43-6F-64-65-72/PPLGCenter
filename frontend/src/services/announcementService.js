import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Announcement (Mading) Service
 * Directly communicates with .NET REST API endpoints without client-side dummy data.
 */
export const announcementService = {
  async getAnnouncements(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);
    if (params.category && params.category !== "Semua") queryParams.append("category", params.category);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ROUTES.ANNOUNCEMENTS.LIST}?${queryString}`
      : API_ROUTES.ANNOUNCEMENTS.LIST;

    try {
      const response = await apiClient.get(endpoint);
      return response || { success: true, data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
    } catch (error) {
      console.warn("Backend API endpoint GET /announcements error:", error?.message);
      return { success: false, data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
    }
  },

  async getAnnouncementById(id) {
    try {
      const response = await apiClient.get(API_ROUTES.ANNOUNCEMENTS.DETAIL(id));
      return response || { success: false, data: null };
    } catch (error) {
      console.warn(`Backend API endpoint GET /announcements/${id} error:`, error?.message);
      return { success: false, data: null };
    }
  },

  async createAnnouncement(data) {
    try {
      const response = await apiClient.post(API_ROUTES.ANNOUNCEMENTS.LIST, data);
      return response;
    } catch (error) {
      console.warn("Backend API endpoint POST /announcements error:", error?.message);
      return { success: false, message: error?.message };
    }
  },
};

export default announcementService;
