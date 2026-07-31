import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Profile Service
 * Directly communicates with .NET REST API endpoints without any client-side dummy data.
 */
export const profileService = {
  /**
   * Fetch authenticated user profile from backend REST API
   */
  async getProfile() {
    const response = await apiClient.get(API_ROUTES.PROFILE.GET);
    return response;
  },
};

export default profileService;
