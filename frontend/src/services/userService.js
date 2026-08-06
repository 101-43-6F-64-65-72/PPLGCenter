import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Service for User Management operations (Admin only)
 * GET /api/users, POST /api/users, DELETE /api/users/:id
 */
export const userService = {
  /**
   * Fetch list of users with pagination and search
   */
  async getUsers(params = {}) {
    const endpoint = API_ROUTES.USERS.LIST;
    try {
      const response = await apiClient.get(endpoint, { params });
      return response;
    } catch (error) {
      return {
        success: false,
        statusCode: error?.statusCode || 500,
        message: error?.message || "Gagal memuat pengguna",
        data: [],
      };
    }
  },

  /**
   * Register/Create a new user account
   * @param {Object} userData - { fullName, email, password, role }
   */
  async createUser(userData) {
    const endpoint = API_ROUTES.USERS.LIST;
    try {
      const response = await apiClient.post(endpoint, userData);
      return response;
    } catch (error) {
      return {
        success: false,
        statusCode: error?.statusCode || 500,
        message: error?.message || "Gagal membuat pengguna",
      };
    }
  },

  /**
   * Delete user account by ID
   */
  async deleteUser(userId) {
    const endpoint = API_ROUTES.USERS.DETAIL(userId);
    try {
      const response = await apiClient.delete(endpoint);
      return response;
    } catch (error) {
      return {
        success: false,
        statusCode: error?.statusCode || 500,
        message: error?.message || "Gagal menghapus pengguna",
      };
    }
  },
};

export default userService;
