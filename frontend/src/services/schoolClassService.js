import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const schoolClassService = {
  async getAll(params = {}) {
    const res = await apiClient.get(API_ROUTES.CLASSES.LIST, { params });
    return res?.data || res;
  },

  async getById(id) {
    const res = await apiClient.get(API_ROUTES.CLASSES.DETAIL(id));
    return res?.data || res;
  },

  async create(data) {
    const res = await apiClient.post(API_ROUTES.CLASSES.LIST, data);
    return res?.data || res;
  },

  async update(id, data) {
    const res = await apiClient.put(API_ROUTES.CLASSES.DETAIL(id), data);
    return res?.data || res;
  },

  async delete(id) {
    const res = await apiClient.delete(API_ROUTES.CLASSES.DETAIL(id));
    return res?.data || res;
  },
};

export default schoolClassService;
