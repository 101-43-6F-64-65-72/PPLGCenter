import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const departmentService = {
  async getAll() {
    const res = await apiClient.get(API_ROUTES.DEPARTMENTS.LIST);
    return res?.data || res;
  },

  async getById(id) {
    const res = await apiClient.get(API_ROUTES.DEPARTMENTS.DETAIL(id));
    return res?.data || res;
  },

  async create(data) {
    const res = await apiClient.post(API_ROUTES.DEPARTMENTS.LIST, data);
    return res?.data || res;
  },

  async update(id, data) {
    const res = await apiClient.put(API_ROUTES.DEPARTMENTS.DETAIL(id), data);
    return res?.data || res;
  },

  async delete(id) {
    const res = await apiClient.delete(API_ROUTES.DEPARTMENTS.DETAIL(id));
    return res?.data || res;
  },
};

export default departmentService;
