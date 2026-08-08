import api, { getStoredToken } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const notificationService = {
  async getNotifications(params = {}) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan.", data: { items: [], totalCount: 0 } };
    const res = await api.get(API_ROUTES.NOTIFICATIONS.LIST, { params });
    return res.data;
  },

  async getSummary() {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan.", data: null };
    const res = await api.get(API_ROUTES.NOTIFICATIONS.SUMMARY);
    return res.data;
  },

  async getUnreadCount() {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan.", data: 0 };
    const res = await api.get(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT);
    return res.data;
  },

  async markAsRead(id) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await api.patch(API_ROUTES.NOTIFICATIONS.MARK_READ(id));
    return res.data;
  },

  async markAllAsRead() {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await api.patch(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ);
    return res.data;
  },

  async deleteNotification(id) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await api.delete(API_ROUTES.NOTIFICATIONS.DELETE(id));
    return res.data;
  },

  async broadcast(data) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await api.post(API_ROUTES.NOTIFICATIONS.BROADCAST, data);
    return res.data;
  },
};

export default notificationService;
