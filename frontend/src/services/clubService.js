import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Club (Extracurricular) Service
 * Directly communicates with .NET REST API endpoints without any client-side dummy data.
 */
export const clubService = {
  /**
   * Fetch list of extracurricular clubs from backend REST API
   * @param {Object} params - { page, pageSize, search }
   */
  async getClubs(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ROUTES.CLUBS.LIST}?${queryString}`
      : API_ROUTES.CLUBS.LIST;

    const response = await apiClient.get(endpoint);
    return response;
  },

  /**
   * Fetch single club detail by ID from backend REST API
   * @param {string|number} id
   */
  async getClubById(id) {
    const response = await apiClient.get(API_ROUTES.CLUBS.DETAIL(id));
    return response;
  },
};

export default clubService;
