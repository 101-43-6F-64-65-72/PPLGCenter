import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const teacherSubjectService = {
  async getAll(params = {}) {
    const response = await apiClient.get(API_ROUTES.TEACHER_SUBJECTS.LIST, { params });
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(API_ROUTES.TEACHER_SUBJECTS.DETAIL(id));
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post(API_ROUTES.TEACHER_SUBJECTS.LIST, data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(API_ROUTES.TEACHER_SUBJECTS.DETAIL(id));
    return response.data;
  },
};
