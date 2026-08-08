import api, { getStoredToken } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const extracurricularService = {
  getExtracurriculars: async (paramsOrPage = {}, pageSize = 20) => {
    let params = {};
    if (typeof paramsOrPage === "number") {
      params = { page: paramsOrPage, pageSize };
    } else if (paramsOrPage && typeof paramsOrPage === "object") {
      params = paramsOrPage;
    }
    return await api.get(API_ROUTES.EXTRACURRICULARS.LIST, { params });
  },

  getExtracurricularById: async (id) => {
    return await api.get(API_ROUTES.EXTRACURRICULARS.DETAIL(id));
  },

  createExtracurricular: async (data) => {
    return await api.post(API_ROUTES.EXTRACURRICULARS.LIST, data);
  },

  updateExtracurricular: async (id, data) => {
    return await api.put(API_ROUTES.EXTRACURRICULARS.DETAIL(id), data);
  },

  deleteExtracurricular: async (id) => {
    return await api.delete(API_ROUTES.EXTRACURRICULARS.DETAIL(id));
  },

  joinExtracurricular: async (id) => {
    return await api.post(API_ROUTES.EXTRACURRICULARS.JOIN(id));
  },

  leaveExtracurricular: async (id) => {
    return await api.delete(API_ROUTES.EXTRACURRICULARS.LEAVE(id));
  },

  getMembers: async (id, params = {}) => {
    return await api.get(API_ROUTES.EXTRACURRICULARS.MEMBERS(id), { params });
  },

  getUserMemberships: async (userId) => {
    if (!getStoredToken()) return { success: true, data: [] };
    return await api.get(`/api/extracurriculars/my`, { params: { userId } });
  },

  updateMemberStatus: async (extracurricularId, memberId, status) => {
    return await api.put(`/api/extracurricular-members/${extracurricularId}/members/${memberId}/status`, { status });
  },

  /**
   * Returns all extracurriculars supervised by the currently authenticated teacher.
   * Fetches live data from PostgreSQL via GET /api/extracurriculars/supervised.
   * NEVER relies on localStorage or stale login response — always fresh from DB.
   * Used by Teacher Panel as the source of truth for "Binaan Saya" section.
   */
  getSupervisedByMe: async () => {
    if (!getStoredToken()) return { success: true, data: [] };
    return await api.get(API_ROUTES.EXTRACURRICULARS.SUPERVISED);
  },

  // Alias used by AuthContext.jsx
  getMyExtracurriculars: async (userId) => {
    if (!getStoredToken()) return { success: true, data: [] };
    return await api.get(`/api/extracurriculars/my`, { params: userId ? { userId } : {} });
  },

  // Alias used by AdminTeachersTab.jsx
  getAll: async (params = {}) => {
    return await api.get(API_ROUTES.EXTRACURRICULARS.LIST, { params });
  },
};

export default extracurricularService;

