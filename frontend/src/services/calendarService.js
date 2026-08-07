import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Production Calendar Service
 * Directly communicates with .NET REST API endpoints (/api/calendar) without client-side dummy data.
 */
export const calendarService = {
  /**
   * Get all calendar events with optional pagination and category filtering.
   */
  async getEvents(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);
    if (params.category && params.category !== "All" && params.category !== "Semua") {
      queryParams.append("category", params.category);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ROUTES.CALENDAR.LIST}?${queryString}`
      : API_ROUTES.CALENDAR.LIST;

    try {
      const response = await apiClient.get(endpoint);
      return response || { success: true, data: { items: [], totalCount: 0 } };
    } catch (error) {
      console.warn("Backend API GET /api/calendar error:", error?.message);
      return { success: false, data: { items: [], totalCount: 0 }, message: error?.message };
    }
  },

  /**
   * Get upcoming events list
   */
  async getUpcomingEvents(count = 5) {
    try {
      const response = await apiClient.get(`${API_ROUTES.CALENDAR.UPCOMING}?count=${count}`);
      return response || { success: true, data: [] };
    } catch (error) {
      console.warn("Backend API GET /api/calendar/upcoming error:", error?.message);
      return { success: false, data: [] };
    }
  },

  /**
   * Create a new calendar event
   */
  async createEvent(data) {
    try {
      const response = await apiClient.post(API_ROUTES.CALENDAR.LIST, data);
      return response;
    } catch (error) {
      console.warn("Backend API POST /api/calendar error:", error?.message);
      return { success: false, message: error?.message || "Gagal menambah kegiatan kalender." };
    }
  },

  /**
   * Delete a calendar event by ID
   */
  async deleteEvent(id) {
    try {
      const response = await apiClient.delete(API_ROUTES.CALENDAR.DETAIL(id));
      return response;
    } catch (error) {
      console.warn(`Backend API DELETE /api/calendar/${id} error:`, error?.message);
      return { success: false, message: error?.message || "Gagal menghapus kegiatan kalender." };
    }
  },
};

export default calendarService;
