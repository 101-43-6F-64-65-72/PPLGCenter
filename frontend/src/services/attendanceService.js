import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const attendanceService = {
  async getSessions(params = {}) {
    const res = await api.get(API_ROUTES.ATTENDANCE.SESSIONS, { params });
    return res.data;
  },

  async getSessionById(id) {
    const res = await api.get(API_ROUTES.ATTENDANCE.SESSION_DETAIL(id));
    return res.data;
  },

  async createSession(data) {
    const res = await api.post(API_ROUTES.ATTENDANCE.SESSIONS, data);
    return res.data;
  },

  async updateStudentStatus(sessionId, data) {
    const res = await api.put(API_ROUTES.ATTENDANCE.RECORDS(sessionId), data);
    return res.data;
  },

  async bulkUpdate(sessionId, data) {
    const res = await api.put(API_ROUTES.ATTENDANCE.BULK(sessionId), data);
    return res.data;
  },

  async closeSession(sessionId) {
    const res = await api.post(API_ROUTES.ATTENDANCE.CLOSE_SESSION(sessionId));
    return res.data;
  },

  async getMyHistory() {
    const res = await api.get(API_ROUTES.ATTENDANCE.MY);
    return res.data;
  },
};
