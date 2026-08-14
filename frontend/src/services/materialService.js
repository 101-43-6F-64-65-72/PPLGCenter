import apiClient from "@/lib/api";

/**
 * Material Service
 * Pure Production Service communicating with .NET REST API for learning materials.
 */
export const materialService = {
  async getMaterials(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);
    if (params.subject) queryParams.append("subject", params.subject);
    if (params.grade) queryParams.append("grade", params.grade);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/materials?${queryString}` : "/api/materials";

    try {
      const response = await apiClient.get(endpoint);
      return response || { success: true, data: [] };
    } catch (error) {
      console.warn("GET /api/materials error:", error?.message);
      return { success: false, data: [] };
    }
  },

  async getMaterialById(id) {
    try {
      const response = await apiClient.get(`/api/materials/${id}`);
      return response;
    } catch (error) {
      console.warn(`GET /api/materials/${id} error:`, error?.message);
      return { success: false, data: null };
    }
  },

  async createMaterial(payload) {
    try {
      const response = await apiClient.post("/api/materials", payload);
      return response;
    } catch (error) {
      console.warn("POST /api/materials error:", error?.message);
      return { success: false, message: error?.message };
    }
  },

  async updateMaterial(id, payload) {
    try {
      const response = await apiClient.put(`/api/materials/${id}`, payload);
      return response;
    } catch (error) {
      console.warn(`PUT /api/materials/${id} error:`, error?.message);
      return { success: false, message: error?.message };
    }
  },

  async deleteMaterial(id) {
    try {
      const response = await apiClient.delete(`/api/materials/${id}`);
      return response;
    } catch (error) {
      console.warn(`DELETE /materials/${id} error:`, error?.message);
      return { success: false, message: error?.message };
    }
  },
};

export default materialService;
