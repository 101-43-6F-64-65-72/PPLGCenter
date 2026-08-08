import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const academicEventService = {
  async getAll(params = {}) {
    const response = await apiClient.get(API_ROUTES.ACADEMIC_EVENTS.LIST, { params });
    return response.data;
  },

  async getUpcoming(limit = 5) {
    const response = await apiClient.get(API_ROUTES.ACADEMIC_EVENTS.UPCOMING, { params: { limit } });
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(API_ROUTES.ACADEMIC_EVENTS.DETAIL(id));
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post(API_ROUTES.ACADEMIC_EVENTS.LIST, data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.put(API_ROUTES.ACADEMIC_EVENTS.DETAIL(id), data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(API_ROUTES.ACADEMIC_EVENTS.DETAIL(id));
    return response.data;
  },
};
