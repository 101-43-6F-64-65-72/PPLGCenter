import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const semesterService = {
  async getAll(params = {}) {
    const res = await apiClient.get(API_ROUTES.SEMESTERS.LIST, { params });
    return res?.data || res;
  },

  async getById(id) {
    const res = await apiClient.get(API_ROUTES.SEMESTERS.DETAIL(id));
    return res?.data || res;
  },

  async create(data) {
    const res = await apiClient.post(API_ROUTES.SEMESTERS.LIST, data);
    return res?.data || res;
  },

  async update(id, data) {
    const res = await apiClient.put(API_ROUTES.SEMESTERS.DETAIL(id), data);
    return res?.data || res;
  },

  async delete(id) {
    const res = await apiClient.delete(API_ROUTES.SEMESTERS.DETAIL(id));
    return res?.data || res;
  },

  async setActive(id) {
    const res = await apiClient.patch(API_ROUTES.SEMESTERS.SET_ACTIVE(id));
    return res?.data || res;
  },
};

export default semesterService;
