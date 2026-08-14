import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const lessonMaterialService = {
  async getAll(params = {}) {
    const res = await api.get(API_ROUTES.MATERIALS.LIST, { params });
    return res.data;
  },

  async getById(id) {
    const res = await api.get(API_ROUTES.MATERIALS.DETAIL(id));
    return res.data;
  },

  async create(data) {
    const res = await api.post(API_ROUTES.MATERIALS.LIST, data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(API_ROUTES.MATERIALS.DETAIL(id), data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(API_ROUTES.MATERIALS.DETAIL(id));
    return res.data;
  },

  async getMyMaterials() {
    const res = await api.get(API_ROUTES.MATERIALS.MY);
    return res.data;
  },
};
