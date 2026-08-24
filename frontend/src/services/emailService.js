import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const emailService = {
  /**
   * Get email provider configuration status (sender, active provider, flags)
   */
  getConfigStatus: async () => {
    const res = await api.get(API_ROUTES.ADMIN_EMAIL.CONFIG);
    return res?.data ?? res;
  },

  /**
   * Send a test email
   * payload: { to: string, subject: string, message: string, recipientUserId?: string }
   */
  sendTestEmail: async (payload) => {
    const res = await api.post(API_ROUTES.ADMIN_EMAIL.TEST, payload);
    return res?.data ?? res;
  },

  /**
   * Get paginated email logs
   * params: { page?: number, pageSize?: number, search?: string }
   */
  getEmailLogs: async (params = {}) => {
    const res = await api.get(API_ROUTES.ADMIN_EMAIL.LOGS, { params });
    const paged = res?.data ?? res;
    return {
      items: paged?.items || [],
      totalItems: paged?.totalCount ?? paged?.totalItems ?? 0,
      page: paged?.page || 1,
      pageSize: paged?.pageSize || 20,
      totalPages: paged?.totalPages || 1,
    };
  },

  /**
   * Get specific email log details (including raw provider response)
   */
  getEmailLogDetail: async (id) => {
    const res = await api.get(API_ROUTES.ADMIN_EMAIL.LOG_DETAIL(id));
    return res?.data ?? res;
  },
};

export default emailService;
