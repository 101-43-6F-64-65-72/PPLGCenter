import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Profile Service
 * Communicates directly with .NET REST API database endpoints.
 */
export const profileService = {
  /**
   * Fetch authenticated user profile from backend REST API database (GET /api/auth/me)
   */
  async getProfile() {
    const response = await apiClient.get(API_ROUTES.PROFILE.GET);
    return response;
  },

  /**
   * Update user profile via backend REST API database (PUT /api/users/:id)
   */
  async updateProfile(userId, profileData) {
    const response = await apiClient.put(`/api/users/${userId}`, profileData);
    return response;
  },

  /**
   * Request Tech Stack OTP challenge to link/change notification email
   */
  async requestNotificationOtp(email) {
    const response = await apiClient.post(API_ROUTES.NOTIFICATION_EMAIL.REQUEST_OTP, { email });
    return response;
  },

  /**
   * Verify 3-step Tech Stack sequence and link notification email
   */
  async verifyNotificationOtp(email, techStack) {
    const response = await apiClient.post(API_ROUTES.NOTIFICATION_EMAIL.VERIFY_OTP, { email, techStack });
    return response;
  },

  /**
   * Remove / unlink notification email
   */
  async deleteNotificationEmail() {
    const response = await apiClient.delete(API_ROUTES.NOTIFICATION_EMAIL.DELETE);
    return response;
  },
};

export default profileService;
