import apiClient, { getStoredToken } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const dashboardService = {
  async getSummary() {
    if (!getStoredToken()) return { success: false, data: null };
    try {
      const response = await apiClient.get(API_ROUTES.DASHBOARD.SUMMARY);
      return response;
    } catch {
      const fallbackResponse = await apiClient.get("/api/dashboard");
      return fallbackResponse;
    }
  },

  async getAdminDashboard() {
    if (!getStoredToken()) return null;
    const response = await apiClient.get(API_ROUTES.DASHBOARD.ADMIN);
    return response?.data || response;
  },

  async getTeacherDashboard() {
    if (!getStoredToken()) return null;
    const response = await apiClient.get(API_ROUTES.DASHBOARD.TEACHER);
    return response?.data || response;
  },

  async getStudentDashboard() {
    if (!getStoredToken()) return null;
    const response = await apiClient.get(API_ROUTES.DASHBOARD.STUDENT);
    return response?.data || response;
  },
};

export default dashboardService;
