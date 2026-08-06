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
      const response = await apiClient.get(endpoint, {
        params: { pageSize: 100, ...params },
      });

      // Backend returns ApiResponse<PagedResult<ProposalResponse>>
      // response structure: { success: true, data: { items: [...], totalCount, page, pageSize } }
      const rawData = response?.data || response;
      const items =
        rawData?.items ||
        rawData?.Items ||
        (Array.isArray(rawData) ? rawData : (Array.isArray(response) ? response : []));

      return {
        success: true,
        data: Array.isArray(items) ? items : [],
        totalCount: rawData?.totalCount || rawData?.TotalCount || (Array.isArray(items) ? items.length : 0),
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
   * Body: { status: 0|1|2, rejectionReason }
   */
  async reviewProposal(proposalId, statusValue, rejectionReason = "") {
    const endpoint = API_ROUTES.PROPOSALS.REVIEW(proposalId);
    try {
      let statusEnum = statusValue;
      if (typeof statusValue === "string") {
        if (statusValue.toLowerCase().includes("disetujui") || statusValue.toLowerCase().includes("approved")) {
          statusEnum = 1; // Approved
        } else if (statusValue.toLowerCase().includes("ditolak") || statusValue.toLowerCase().includes("rejected")) {
          statusEnum = 2; // Rejected
        } else {
          statusEnum = 0; // Pending
        }
      }

      const response = await apiClient.patch(endpoint, {
        status: statusEnum,
        rejectionReason: rejectionReason || null,
      });

      return {
        success: true,
        data: response?.data || response,
        message: response?.message || "Status proposal berhasil diperbarui",
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

  async updateProposalStatus(proposalId, statusValue, rejectionReason = "") {
    return this.reviewProposal(proposalId, statusValue, rejectionReason);
  },
};

export default proposalService;
