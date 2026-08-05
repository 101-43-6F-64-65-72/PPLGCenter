import apiClient from "@/lib/api";

/**
 * Extracurricular API Service for Student Center
 * Communicates with backend endpoints (/api/extracurriculars)
 */
export const extracurricularService = {
  /**
   * Fetch all extracurriculars with optional category filter
   */
  async getExtracurriculars(params = {}) {
    try {
      const response = await apiClient.get("/extracurriculars", { params });
      if (response && response.data) {
        return response.data;
      }
      return response || null;
    } catch (error) {
      console.warn("Backend /api/extracurriculars endpoint error:", error?.message);
      return null;
    }
  },

  /**
   * Fetch single extracurricular detail by ID
   */
  async getExtracurricularById(id) {
    try {
      const response = await apiClient.get(`/extracurriculars/${id}`);
      return response?.data || response || null;
    } catch (error) {
      console.warn(`Backend /api/extracurriculars/${id} endpoint error:`, error?.message);
      return null;
    }
  },

  /**
   * Join an extracurricular (Student only)
   */
  async joinExtracurricular(id) {
    try {
      const response = await apiClient.post(`/extracurriculars/${id}/join`);
      return response;
    } catch (error) {
      console.warn(`Backend join extracurricular error:`, error?.message);
      throw error;
    }
  },

  /**
   * Leave an extracurricular (Student only)
   */
  async leaveExtracurricular(id) {
    try {
      const response = await apiClient.delete(`/extracurriculars/${id}/leave`);
      return response;
    } catch (error) {
      console.warn(`Backend leave extracurricular error:`, error?.message);
      throw error;
    }
  },
};

export default extracurricularService;
