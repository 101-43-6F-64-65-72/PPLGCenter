import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const scheduleService = {
  async getAll(params = {}) {
    const response = await apiClient.get(API_ROUTES.SCHEDULES.LIST, { params });
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(API_ROUTES.SCHEDULES.DETAIL(id));
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post(API_ROUTES.SCHEDULES.LIST, data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.put(API_ROUTES.SCHEDULES.DETAIL(id), data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(API_ROUTES.SCHEDULES.DETAIL(id));
    return response.data;
  },

  async getStudentToday() {
    const response = await apiClient.get(API_ROUTES.SCHEDULES.STUDENT_TODAY);
    return response.data;
  },

  async getTeacherToday() {
    const response = await apiClient.get(API_ROUTES.SCHEDULES.TEACHER_TODAY);
    return response.data;
  },
};
