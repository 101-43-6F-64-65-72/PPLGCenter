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
   * Update user account by ID
   */
  async updateUser(userId, userData) {
    const endpoint = API_ROUTES.USERS.DETAIL(userId);
    try {
      const response = await apiClient.put(endpoint, userData);
      return response;
    } catch (error) {
      return {
        success: false,
        statusCode: error?.statusCode || 500,
        message: error?.message || "Gagal memperbarui pengguna",
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

  /**
   * Assign Homeroom class & Advisor roles to a Teacher
   */
  async assignTeacher(payload) {
    const endpoint = API_ROUTES.USERS.ASSIGN_TEACHER;
    try {
      const response = await apiClient.post(endpoint, payload);
      return response;
    } catch (error) {
      return {
        success: false,
        statusCode: error?.statusCode || 500,
        message: error?.message || "Gagal mengatur penugasan guru",
      };
    }
  },

  /**
   * Import Students from CSV text or File
   */
  async importStudents(csvContent) {
    const endpoint = API_ROUTES.USERS.IMPORT_STUDENTS;
    try {
      const response = await apiClient.post(endpoint, csvContent, {
        headers: { "Content-Type": "text/plain" },
      });
      return response;
    } catch (error) {
      return {
        success: false,
        statusCode: error?.statusCode || 500,
        message: error?.message || "Gagal mengimpor data siswa",
      };
    }
  },

  /**
   * Import Teachers from CSV text or File
   */
  async importTeachers(csvContent) {
    const endpoint = API_ROUTES.USERS.IMPORT_TEACHERS;
    try {
      const response = await apiClient.post(endpoint, csvContent, {
        headers: { "Content-Type": "text/plain" },
      });
      return response;
    } catch (error) {
      return {
        success: false,
        statusCode: error?.statusCode || 500,
        message: error?.message || "Gagal mengimpor data guru",
      };
    }
  },

  /**
   * Export Students CSV
   */
  async exportStudents(params = {}) {
    const endpoint = API_ROUTES.USERS.EXPORT_STUDENTS;
    const response = await apiClient.get(endpoint, {
      params,
      responseType: "blob",
    });
    return response;
  },

  /**
   * Fetch active teachers list for dropdown/selection
   */
  async getTeachers() {
    const endpoint = API_ROUTES.USERS.TEACHERS;
    try {
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      return {
        success: false,
        statusCode: error?.statusCode || 500,
        message: error?.message || "Gagal memuat daftar guru",
        data: [],
      };
    }
  },

  // Alias used by AdminTeacherSubjectsTab — maps to getUsers
  async getAllUsers(params = {}) {
    return await this.getUsers(params);
  },
};

export default userService;
