import api, { getStoredToken } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const proposalService = {
  getProposals: async (params = {}) => {
    if (!getStoredToken()) {
      return { success: true, data: [] };
    }
    return await api.get(API_ROUTES.PROPOSALS.LIST, { params });
  },

  getProposalById: async (id) => {
    return await api.get(API_ROUTES.PROPOSALS.DETAIL(id));
  },

  createProposal: async (data) => {
    return await api.post(API_ROUTES.PROPOSALS.LIST, data);
  },

  updateProposal: async (id, data) => {
    return await api.put(API_ROUTES.PROPOSALS.DETAIL(id), data);
  },

  deleteProposal: async (id) => {
    return await api.delete(API_ROUTES.PROPOSALS.DETAIL(id));
  },

  reviewProposal: async (id, status, rejectionReason = null) => {
    return await api.patch(API_ROUTES.PROPOSALS.REVIEW(id), { status, rejectionReason });
  },

  /**
   * Alias used by AdminProposalTab and OsisProposalTab.
   * Accepts (id, statusNumOrObj, noteText) or (id, { status, rejectionReason }).
   */
  updateProposalStatus: async (id, statusOrObj, note = "") => {
    let status, rejectionReason;
    if (statusOrObj !== null && typeof statusOrObj === "object") {
      status = statusOrObj.status ?? statusOrObj.Status;
      rejectionReason = statusOrObj.rejectionReason ?? statusOrObj.RejectionReason ?? statusOrObj.note ?? "";
    } else {
      status = statusOrObj;
      rejectionReason = note;
    }
    return await api.patch(API_ROUTES.PROPOSALS.REVIEW(id), { status, rejectionReason });
  },
};

export default proposalService;
