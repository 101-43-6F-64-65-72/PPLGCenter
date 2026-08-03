import api from "@/lib/api";

/**
 * Pure Production Proposal Service matching API Contract V1 (/api/v1/proposals)
 * Communicates directly with .NET REST API without client-side mock data.
 */
export const proposalService = {
  /**
   * Fetch list of all proposals
   * GET /api/v1/proposals
   */
  async getProposals(params = {}) {
    try {
      const response = await api.get("/proposals", { params });
      return response?.data || [];
    } catch (error) {
      console.warn("Backend /proposals endpoint error:", error?.message);
      return [];
    }
  },

  /**
   * Create new proposal with file attachment
   * POST /api/v1/proposals
   */
  async createProposal(formData) {
    try {
      const response = await api.post("/proposals", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      console.warn("Backend POST /proposals endpoint error:", error?.message);
      return {
        success: false,
        message: error?.message || "Gagal mengajukan proposal",
      };
    }
  },

  /**
   * Update proposal status (Acc / Revision / Reject)
   * PATCH /api/v1/proposals/:id/status
   */
  async updateProposalStatus(proposalId, status, notes = "") {
    try {
      const response = await api.patch(`/proposals/${proposalId}/status`, { status, notes });
      return response;
    } catch (error) {
      console.warn(`Backend PATCH /proposals/${proposalId}/status error:`, error?.message);
      return {
        success: false,
        message: error?.message,
      };
    }
  },
};

export default proposalService;
