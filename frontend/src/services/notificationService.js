import apiClient, { getStoredToken } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const notificationService = {
  async getNotifications(params = {}) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan.", data: { items: [], totalCount: 0 } };
    const res = await apiClient.get(API_ROUTES.NOTIFICATIONS.LIST, { params });
    return res;
  },

  async getSummary() {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan.", data: null };
    const res = await apiClient.get(API_ROUTES.NOTIFICATIONS.SUMMARY);
    return res;
  },

  async getUnreadCount() {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan.", data: 0 };
    const res = await apiClient.get(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT);
    return res;
  },

  async markAsRead(id) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await apiClient.patch(API_ROUTES.NOTIFICATIONS.MARK_READ(id));
    return res;
  },

  async markAllAsRead() {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await apiClient.patch(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ);
    return res;
  },

  async deleteNotification(id) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await apiClient.delete(API_ROUTES.NOTIFICATIONS.DELETE(id));
    return res;
  },

  async broadcast(data) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await apiClient.post(API_ROUTES.NOTIFICATIONS.BROADCAST, data);
    return res;
  },

  async getBroadcasts() {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan.", data: [] };
    const res = await apiClient.get("/api/notifications/broadcasts");
    return res;
  },

  async updateBroadcast(broadcastId, data) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await apiClient.put(`/api/notifications/broadcast/${broadcastId}`, data);
    return res;
  },

  async deleteBroadcast(broadcastId) {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Token tidak ditemukan." };
    const res = await apiClient.delete(`/api/notifications/broadcast/${broadcastId}`);
    return res;
  },
};

export default notificationService;
