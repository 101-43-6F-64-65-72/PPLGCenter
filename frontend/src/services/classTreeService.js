import apiClient from "@/lib/api";

export const classTreeService = {
  // Class Divisions Tree
  getDivisionTree: async (schoolClassId) => {
    const res = await apiClient.get(`/api/ClassDivisions/class/${schoolClassId}`);
    return res;
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
    const res = await apiClient.get(`/api/ClassLeadership/class/${schoolClassId}/active`);
    return res;
  },

  getLeadershipHistory: async (schoolClassId) => {
    const res = await apiClient.get(`/api/ClassLeadership/class/${schoolClassId}/history`);
    return res;
  },

  appointLeadership: async (data) => {
    const res = await apiClient.post("/api/ClassLeadership", data);
    return res;
  },

  // Schedule Rotation Config
  getRotationConfig: async (schoolClassId) => {
    const res = await apiClient.get(`/api/ScheduleRotation/class/${schoolClassId}`);
    return res;
  },

  saveRotationConfig: async (data) => {
    const res = await apiClient.post("/api/ScheduleRotation/config", data);
    return res;
  },
};

export default classTreeService;
