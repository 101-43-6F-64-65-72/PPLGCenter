import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Extracurricular Club Service matching API Contract (/api/clubs)
 * Communicates directly with .NET REST API without client-side mock data.
 */
export const clubService = {
  /**
   * Fetch list of extracurricular clubs
   */
  async getClubs(params = {}) {
    const endpoint = API_ROUTES.CLUBS.LIST;
    try {
      const response = await apiClient.get(endpoint, { params });
      if (response && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Fetch single club detail by ID
   */
  async getClubById(id) {
    const endpoint = API_ROUTES.CLUBS.DETAIL(id);
    try {
      const response = await apiClient.get(endpoint);
      return response?.data || null;
    } catch (error) {
      return null;
    }
  },
};

export default clubService;
