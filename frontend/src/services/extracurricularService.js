import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Extracurricular API Service for Student Center
 * Communicates with backend endpoints (/api/extracurriculars)
 */
export const extracurricularService = {
  /**
   * Fetch all extracurriculars with optional category filter
   */
  async getExtracurriculars(params = {}) {
    const endpoint = API_ROUTES.EXTRACURRICULARS.LIST;
    try {
      const response = await apiClient.get(endpoint, { params });
      const items = response?.data?.items || response?.items || response?.data || (Array.isArray(response) ? response : []);
      return {
        success: true,
        statusCode: 200,
        data: items,
        raw: response,
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal memuat data ekstrakurikuler.",
        data: [],
      };
    }
  },

  /**
   * Fetch single extracurricular detail by ID or Slug
   */
  async getExtracurricularById(id) {
    if (!id) {
      return { success: false, statusCode: 400, data: null, message: "ID tidak valid." };
    }
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    try {
      if (!isGuid) {
        // If slug is string like "basket", search from list
        const listRes = await this.getExtracurriculars();
        const items = listRes?.data || [];
        const item = items.find(
          (i) =>
            i.id?.toLowerCase() === id.toLowerCase() ||
            i.name?.toLowerCase().includes(id.toLowerCase())
        ) || null;
        
        return {
          success: !!item,
          statusCode: item ? 200 : 404,
          data: item,
          message: item ? "Retrieved successfully" : "Resource not found",
        };
      }

      const endpoint = API_ROUTES.EXTRACURRICULARS.DETAIL(id);
      const response = await apiClient.get(endpoint);
      return {
        success: true,
        statusCode: 200,
        data: response?.data || response || null,
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Data ekstrakurikuler tidak ditemukan.",
        data: null,
      };
    }
  },

  /**
   * Join an extracurricular (Student only)
   */
  async joinExtracurricular(id) {
    const endpoint = API_ROUTES.EXTRACURRICULARS.JOIN(id);
    try {
      const response = await apiClient.post(endpoint);
      return { success: true, data: response?.data || response };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Leave an extracurricular (Student only)
   */
  async leaveExtracurricular(id) {
    const endpoint = API_ROUTES.EXTRACURRICULARS.LEAVE(id);
    try {
      const response = await apiClient.delete(endpoint);
      return { success: true, data: response?.data || response };
    } catch (error) {
      throw error;
    }
  },
};

export default extracurricularService;
