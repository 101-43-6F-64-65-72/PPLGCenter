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
   * Create new extracurricular (Admin / Teacher only)
   * POST /api/extracurriculars
   */
  async createExtracurricular(data) {
    const endpoint = API_ROUTES.EXTRACURRICULARS.LIST;
    try {
      const response = await apiClient.post(endpoint, data);
      return {
        success: true,
        data: response?.data || response,
        message: "Ekstrakurikuler berhasil dibuat",
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal membuat ekstrakurikuler",
      };
    }
  },

  /**
   * Update existing extracurricular (Admin / Teacher manager only)
   * PUT /api/extracurriculars/:id
   */
  async updateExtracurricular(id, data) {
    const endpoint = API_ROUTES.EXTRACURRICULARS.DETAIL(id);
    try {
      const response = await apiClient.put(endpoint, data);
      return {
        success: true,
        data: response?.data || response,
        message: "Ekstrakurikuler berhasil diperbarui",
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal memperbarui ekstrakurikuler",
      };
    }
  },

  /**
   * Delete extracurricular (Admin / Teacher manager only)
   * DELETE /api/extracurriculars/:id
   */
  async deleteExtracurricular(id) {
    const endpoint = API_ROUTES.EXTRACURRICULARS.DETAIL(id);
    try {
      const response = await apiClient.delete(endpoint);
      return {
        success: true,
        message: "Ekstrakurikuler berhasil dihapus",
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal menghapus ekstrakurikuler",
      };
    }
  },

  /**
   * Fetch user's extracurricular memberships
   * Checks member list of active extracurriculars to find memberships for current user
   */
  async getUserMemberships(userId) {
    if (!userId) {
      return { success: true, data: [] };
    }

    try {
      const listRes = await this.getExtracurriculars({ pageSize: 100 });
      if (!listRes.success || !Array.isArray(listRes.data)) {
        return {
          success: false,
          data: [],
          message: listRes.message || "Gagal memuat data keanggotaan ekstrakurikuler.",
        };
      }

      const allExtracurriculars = listRes.data;
      const joined = [];

      for (const ekstra of allExtracurriculars) {
        if (!ekstra.id) continue;
        try {
          const membersRes = await apiClient.get(API_ROUTES.EXTRACURRICULARS.MEMBERS(ekstra.id), {
            params: { pageSize: 100 },
          });
          const memberItems =
            membersRes?.data?.items ||
            membersRes?.items ||
            membersRes?.data ||
            (Array.isArray(membersRes) ? membersRes : []);

          const isMember =
            Array.isArray(memberItems) &&
            memberItems.some((m) => {
              const studentId = m.studentId || m.StudentId || m.userId || m.UserId;
              return studentId && String(studentId).toLowerCase() === String(userId).toLowerCase();
            });

          if (isMember) {
            joined.push(ekstra);
          }
        } catch (e) {
          // Ignore error for individual member query
        }
      }

      return {
        success: true,
        data: joined,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: "Gagal memuat data keanggotaan ekstrakurikuler pengguna.",
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
