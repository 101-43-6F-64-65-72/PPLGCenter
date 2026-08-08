import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const academicYearService = {
  async getAll() {
    const res = await apiClient.get(API_ROUTES.ACADEMIC_YEARS.LIST);
    return res?.data || res;
  },

  async getById(id) {
    const res = await apiClient.get(API_ROUTES.ACADEMIC_YEARS.DETAIL(id));
    return res?.data || res;
  },

  async create(data) {
    const res = await apiClient.post(API_ROUTES.ACADEMIC_YEARS.LIST, data);
    return res?.data || res;
  },

  async update(id, data) {
    const res = await apiClient.put(API_ROUTES.ACADEMIC_YEARS.DETAIL(id), data);
    return res?.data || res;
  },

  async delete(id) {
    const res = await apiClient.delete(API_ROUTES.ACADEMIC_YEARS.DETAIL(id));
    return res?.data || res;
  },

  async setActive(id) {
    const res = await apiClient.patch(API_ROUTES.ACADEMIC_YEARS.SET_ACTIVE(id));
    return res?.data || res;
  },
};

export default academicYearService;
