import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Auth Service
 * Directly communicates with .NET REST API endpoints without any client-side dummy data.
 */
export const authService = {
  /**
   * Log in user via backend REST API
   * @param {Object} credentials - { identifier, password }
   */
  async login(credentials) {
    const payload = {
      email: credentials.email || credentials.identifier,
      password: credentials.password,
    };
    const response = await apiClient.post(API_ROUTES.AUTH.LOGIN, payload);
    return response;
  },

  /**
   * Log out user via backend REST API
   */
  async logout() {
    const response = await apiClient.post(API_ROUTES.AUTH.LOGOUT);
    return response;
  },
};

export default authService;
