import apiClient, { setStoredToken } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Auth Service
 * Communicates with .NET REST API authentication endpoints.
 */
export const authService = {
  /**
   * Log in user via backend REST API
   * @param {Object} credentials - { loginType, fullName, identifier, password }
   */
  async login(credentials) {
    const payload = {
      loginType: credentials.loginType || credentials.roleType || "Student",
      fullName: credentials.fullName || "",
      identifier: credentials.identifier || credentials.email || "",
      email: credentials.email || credentials.identifier || "",
      password: credentials.password || "",
    };
    const response = await apiClient.post(API_ROUTES.AUTH.LOGIN, payload);
    return response;
  },

  /**
   * Log out user (Stateless JWT token cleanup)
   */
  async logout() {
    setStoredToken(null);
    return { success: true };
  },
};

export default authService;
