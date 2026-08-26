import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const feedbackService = {
  /**
   * Kirim umpan balik dari pengguna (Siswa, Guru, Admin, atau Anonim)
   * @param {Object} data { category, rating, content, isAnonymous }
   */
  createFeedback: async (data) => {
    return await api.post(API_ROUTES.FEEDBACK.CREATE, data);
  },

  /**
   * Ambil daftar umpan balik milik pengguna aktif (Section Riwayat Masukan di User)
   * @param {Object} params { page, pageSize }
   */
  getMyFeedbacks: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.pageSize) query.append("pageSize", params.pageSize);

    const qs = query.toString();
    const url = `/api/feedback/my${qs ? `?${qs}` : ""}`;
    return await api.get(url);
  },

  /**
   * Ambil daftar semua umpan balik (Khusus Admin)
   * @param {Object} params { category, rating, status, search, page, pageSize }
   */
  getFeedbacks: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append("category", params.category);
    if (params.rating) query.append("rating", params.rating);
    if (params.status) query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", params.page);
    if (params.pageSize) query.append("pageSize", params.pageSize);

    const qs = query.toString();
    const url = `${API_ROUTES.FEEDBACK.LIST}${qs ? `?${qs}` : ""}`;
    return await api.get(url);
  },

  /**
   * Ambil ringkasan statistik umpan balik (Khusus Admin)
   */
  getSummary: async () => {
    return await api.get(API_ROUTES.FEEDBACK.SUMMARY);
  },

  /**
   * Balas umpan balik secara resmi dan kirim notifikasi + email (Khusus Admin)
   * @param {string} id 
   * @param {Object} data { adminReply, status, sendEmailNotification }
   */
  replyFeedback: async (id, data) => {
    return await api.post(`/api/feedback/${id}/reply`, data);
  },

  /**
   * Perbarui status umpan balik (Khusus Admin)
   * @param {string} id 
   * @param {Object} data { status, adminNotes }
   */
  updateStatus: async (id, data) => {
    return await api.patch(API_ROUTES.FEEDBACK.UPDATE_STATUS(id), data);
  },

  /**
   * Hapus umpan balik (Khusus Admin)
   * @param {string} id 
   */
  deleteFeedback: async (id) => {
    return await api.delete(API_ROUTES.FEEDBACK.DELETE(id));
  },
};

export default feedbackService;
