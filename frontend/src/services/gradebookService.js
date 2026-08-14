import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const gradebookService = {
  // Grade Categories
  getGradeCategories: async () => {
    return await api.get(API_ROUTES.GRADE_CATEGORIES.LIST);
  },
  createGradeCategory: async (data) => {
    return await api.post(API_ROUTES.GRADE_CATEGORIES.LIST, data);
  },
  updateGradeCategory: async (id, data) => {
    return await api.put(API_ROUTES.GRADE_CATEGORIES.DETAIL(id), data);
  },
  deleteGradeCategory: async (id) => {
    return await api.delete(API_ROUTES.GRADE_CATEGORIES.DETAIL(id));
  },

  // Assessments
  getAssessments: async (params = {}) => {
    return await api.get(API_ROUTES.ASSESSMENTS.LIST, { params });
  },
  getAssessmentById: async (id) => {
    return await api.get(API_ROUTES.ASSESSMENTS.DETAIL(id));
  },
  createAssessment: async (data) => {
    return await api.post(API_ROUTES.ASSESSMENTS.LIST, data);
  },
  updateAssessment: async (id, data) => {
    return await api.put(API_ROUTES.ASSESSMENTS.DETAIL(id), data);
  },
  deleteAssessment: async (id) => {
    return await api.delete(API_ROUTES.ASSESSMENTS.DETAIL(id));
  },
  publishAssessment: async (id) => {
    return await api.post(API_ROUTES.ASSESSMENTS.PUBLISH(id));
  },

  // Student Grades & Gradebook
  getTeacherGradebook: async (classSubjectId) => {
    return await api.get(API_ROUTES.STUDENT_GRADES.GRADEBOOK(classSubjectId));
  },
  getMyGrades: async (params = {}) => {
    return await api.get(API_ROUTES.STUDENT_GRADES.MY, { params });
  },
  getTranscript: async () => {
    return await api.get(API_ROUTES.STUDENT_GRADES.TRANSCRIPT);
  },
  getReportCardSummary: async (semesterId = null) => {
    return await api.get(API_ROUTES.STUDENT_GRADES.REPORT_CARD, {
      params: semesterId ? { semesterId } : {},
    });
  },
  bulkGrade: async (data) => {
    return await api.post(API_ROUTES.STUDENT_GRADES.BULK, data);
  },
  publishGrades: async (assessmentId, studentIds = null) => {
    return await api.post(API_ROUTES.STUDENT_GRADES.PUBLISH(assessmentId), studentIds);
  },
  importCsv: async (assessmentId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post(
      `${API_ROUTES.STUDENT_GRADES.IMPORT_CSV}?assessmentId=${assessmentId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },
  getExportCsvUrl: (assessmentId) => {
    return API_ROUTES.STUDENT_GRADES.EXPORT_CSV(assessmentId);
  },

  // Grade Scales
  getGradeScales: async () => {
    return await api.get(API_ROUTES.GRADE_SCALES.LIST);
  },
  createGradeScale: async (data) => {
    return await api.post(API_ROUTES.GRADE_SCALES.LIST, data);
  },
  updateGradeScale: async (id, data) => {
    return await api.put(API_ROUTES.GRADE_SCALES.DETAIL(id), data);
  },
};
