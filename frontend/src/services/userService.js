import apiClient from "@/lib/api";

/**
 * Service for User Management operations (Admin only)
 */
export const userService = {
  /**
   * Fetch list of users with pagination and search
   */
  async getUsers(params = {}) {
    const response = await apiClient.get("/users", { params });
    return response;
  },

  /**
   * Register/Create a new user account
   * @param {Object} userData - { fullName, email, password, role }
   */
  async createUser(userData) {
    const response = await apiClient.post("/users", userData);
    return response;
  },

  /**
   * Delete user account by ID
   */
  async deleteUser(userId) {
    const response = await apiClient.delete(`/users/${userId}`);
    return response;
  },
};

export default userService;
