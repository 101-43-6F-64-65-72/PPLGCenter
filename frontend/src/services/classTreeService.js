import apiClient from "@/lib/api";

export const classTreeService = {
  // Class Divisions Tree
  getDivisionTree: async (schoolClassId) => {
    try {
      const res = await apiClient.get(`/api/ClassDivisions/class/${schoolClassId}`);
      return res;
    } catch (err) {
      if (err?.response?.status === 404 || err?.statusCode === 404) return [];
      return [];
    }
  },

  createDivision: async (data) => {
    const res = await apiClient.post("/api/ClassDivisions", data);
    return res;
  },

  updateDivision: async (divisionId, data) => {
    const res = await apiClient.put(`/api/ClassDivisions/${divisionId}`, data);
    return res;
  },

  deleteDivision: async (divisionId) => {
    const res = await apiClient.delete(`/api/ClassDivisions/${divisionId}`);
    return res;
  },

  // Class Leadership
  getActiveLeadership: async (schoolClassId) => {
    try {
      const res = await apiClient.get(`/api/ClassLeadership/class/${schoolClassId}/active`);
      return res;
    } catch (err) {
      if (err?.response?.status === 404 || err?.statusCode === 404) return null;
      return null;
    }
  },

  getLeadershipHistory: async (schoolClassId) => {
    try {
      const res = await apiClient.get(`/api/ClassLeadership/class/${schoolClassId}/history`);
      return res;
    } catch (err) {
      if (err?.response?.status === 404 || err?.statusCode === 404) return [];
      return [];
    }
  },

  appointLeadership: async (data) => {
    const res = await apiClient.post("/api/ClassLeadership", data);
    return res;
  },

  // Schedule Rotation Config
  getRotationConfig: async (schoolClassId) => {
    try {
      const res = await apiClient.get(`/api/ScheduleRotation/class/${schoolClassId}`);
      return res;
    } catch (err) {
      if (err?.response?.status === 404 || err?.statusCode === 404) return null;
      return null;
    }
  },

  saveRotationConfig: async (data) => {
    const res = await apiClient.post("/api/ScheduleRotation/config", data);
    return res;
  },
};

export default classTreeService;
