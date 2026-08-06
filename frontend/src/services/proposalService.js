import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Proposal Service matching API Contract (/api/proposals)
 * Communicates directly with .NET REST API without client-side mock data.
 */
export const proposalService = {
  /**
   * Fetch list of all proposals
   * GET /api/proposals
   */
  async getProposals(params = {}) {
    const endpoint = API_ROUTES.PROPOSALS.LIST;
    try {
      const response = await apiClient.get(endpoint, { params });
      const items = response?.data?.items || response?.items || response?.data || (Array.isArray(response) ? response : []);
      return {
        success: true,
        data: items,
        raw: response,
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal memuat proposal",
        data: [],
      };
    }
  },

  /**
   * Create new proposal
   * POST /api/proposals
   * Body: { title, description, fileUrl }
   */
  async createProposal(data) {
    const endpoint = API_ROUTES.PROPOSALS.LIST;
    try {
      const response = await apiClient.post(endpoint, data);
      return {
        success: true,
        data: response?.data || response,
        message: response?.message || "Proposal berhasil diajukan",
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal mengajukan proposal",
      };
    }
  },

  /**
   * Update existing proposal
   * PUT /api/proposals/:id
   */
  async updateProposal(id, data) {
    const endpoint = API_ROUTES.PROPOSALS.DETAIL(id);
    try {
      const response = await apiClient.put(endpoint, data);
      return {
        success: true,
        data: response?.data || response,
        message: response?.message || "Proposal berhasil diperbarui",
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal memperbarui proposal",
      };
    }
  },

  /**
   * Delete proposal
   * DELETE /api/proposals/:id
   */
  async deleteProposal(id) {
    const endpoint = API_ROUTES.PROPOSALS.DETAIL(id);
    try {
      const response = await apiClient.delete(endpoint);
      return {
        success: true,
        message: response?.message || "Proposal berhasil dihapus",
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal menghapus proposal",
      };
    }
  },

  /**
   * Review proposal status (Admin / Teacher only)
   * PATCH /api/proposals/:id/review
   */
  async updateProposalStatus(proposalId, status, rejectionReason = "") {
    const endpoint = API_ROUTES.PROPOSALS.REVIEW(proposalId);
    try {
      const response = await apiClient.patch(endpoint, { status, rejectionReason });
      return {
        success: true,
        data: response?.data || response,
      };
    } catch (error) {
      const statusCode = error?.statusCode || error?.response?.status || 500;
      return {
        success: false,
        statusCode,
        message: error?.message || "Gagal memperbarui status proposal",
      };
    }
  },
};

export default proposalService;
