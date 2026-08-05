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
    const response = await apiClient.put(`/users/${userId}`, profileData);
    return response;
  },
};

export default profileService;
