import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const assignmentService = {
  async getAll(params = {}) {
    const res = await api.get(API_ROUTES.ASSIGNMENTS.LIST, { params });
    return res.data;
  },

  async getById(id) {
    const res = await api.get(API_ROUTES.ASSIGNMENTS.DETAIL(id));
    return res.data;
  },

  async create(data) {
    const res = await api.post(API_ROUTES.ASSIGNMENTS.LIST, data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(API_ROUTES.ASSIGNMENTS.DETAIL(id), data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(API_ROUTES.ASSIGNMENTS.DETAIL(id));
    return res.data;
  },

  async getMyAssignments() {
    const res = await api.get(API_ROUTES.ASSIGNMENTS.MY);
    return res.data;
  },

  async getSubmissions(id) {
    const res = await api.get(API_ROUTES.ASSIGNMENTS.SUBMISSIONS(id));
    return res.data;
  },
};
