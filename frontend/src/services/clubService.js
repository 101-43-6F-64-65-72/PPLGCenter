import apiClient from "@/lib/api";

/**
 * Pure Production Extracurricular Club Service matching API Contract V1 (/api/v1/clubs)
 * Communicates directly with .NET REST API without client-side mock data.
 */
export const clubService = {
  /**
   * Fetch list of extracurricular clubs
   */
  async getClubs(params = {}) {
    try {
      const response = await apiClient.get("/clubs", { params });
      if (response && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn("Backend /clubs endpoint error:", error?.message);
      return [];
    }
  },

  /**
   * Fetch single club detail by ID
   */
  async getClubById(id) {
    try {
      const response = await apiClient.get(`/clubs/${id}`);
      return response?.data || null;
    } catch (error) {
      console.warn(`Backend /clubs/${id} endpoint error:`, error?.message);
      return null;
    }
  },
};

export default clubService;
