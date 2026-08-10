import api from "@/lib/api";

export const osisRecruitmentService = {
  getPositions: async (academicYearId) => {
    const params = academicYearId ? { academicYearId } : {};
    return await api.get("/api/osis/recruitment/positions", { params });
  },

  createPosition: async (data) => {
    return await api.post("/api/osis/recruitment/positions", data);
  },

  deletePosition: async (id) => {
    return await api.delete(`/api/osis/recruitment/positions/${id}`);
  },

  getApplications: async (params = {}) => {
    return await api.get("/api/osis/recruitment/applications", { params });
  },

  submitApplication: async (data) => {
    return await api.post("/api/osis/recruitment/apply", data);
  },

  teacherReview: async (id, data) => {
    return await api.post(`/api/osis/recruitment/applications/${id}/teacher-review`, data);
  },

  chairmanReview: async (id, data) => {
    return await api.post(`/api/osis/recruitment/applications/${id}/chairman-review`, data);
  },

  adminReview: async (id, data) => {
    return await api.post(`/api/osis/recruitment/applications/${id}/admin-review`, data);
  },

  getCabinetStructure: async (academicYearId) => {
    const params = academicYearId ? { academicYearId } : {};
    return await api.get("/api/osis/recruitment/cabinet-structure", { params });
  },

  addCabinetMember: async (data) => {
    const params = {};
    if (data.academicYearId) params.academicYearId = data.academicYearId;
    if (data.studentId) params.studentId = data.studentId;
    if (data.positionTitle) params.positionTitle = data.positionTitle;
    if (data.department) params.department = data.department;
    if (data.photoUrl) params.photoUrl = data.photoUrl;
    return await api.post("/api/osis/recruitment/cabinet-structure", null, { params });
  },

  deleteCabinetMember: async (id) => {
    return await api.delete(`/api/osis/recruitment/cabinet-structure/${id}`);
  },
};

export default osisRecruitmentService;
