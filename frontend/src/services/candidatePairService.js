import api from "@/lib/api";

export const candidatePairService = {
  getElections: async (params = {}) => {
    return await api.get("/api/elections", { params });
  },

  getPairs: async (electionId) => {
    return await api.get(`/api/candidate-pairs/election/${electionId}`);
  },

  getPairById: async (id) => {
    return await api.get(`/api/candidate-pairs/${id}`);
  },

  getEligibility: async (electionId) => {
    return await api.get(`/api/candidate-pairs/election/${electionId}/eligibility`);
  },

  registerChairman: async (data) => {
    return await api.post("/api/candidate-pairs/register-chairman", data);
  },

  applyVice: async (candidatePairId, data) => {
    return await api.post(`/api/candidate-pairs/${candidatePairId}/apply-vice`, data);
  },

  chairmanReviewVice: async (candidatePairId, accept) => {
    return await api.post(`/api/candidate-pairs/${candidatePairId}/chairman-review?accept=${accept}`);
  },

  teacherReviewPair: async (candidatePairId, data) => {
    return await api.post(`/api/candidate-pairs/${candidatePairId}/teacher-review`, data);
  },

  adminReviewPair: async (candidatePairId, data) => {
    return await api.post(`/api/candidate-pairs/${candidatePairId}/admin-review`, data);
  },

  castVote: async (electionId, candidatePairId) => {
    return await api.post(`/api/candidate-pairs/election/${electionId}/vote`, { candidatePairId });
  },

  getLiveResults: async (electionId) => {
    return await api.get(`/api/candidate-pairs/election/${electionId}/live-results`);
  },

  /**
   * Search eligible Vice Chairman candidates (Students) by Name / NIS
   */
  searchEligibleViceCandidates: async (search = "", electionId = null) => {
    try {
      return await api.get("/api/candidate-pairs/eligible-vices", { params: { search, electionId } });
    } catch (err) {
      console.error("Gagal mencari calon wakil:", err);
      return { data: [] };
    }
  },

  /**
   * Unified atomic registration of a Chairman + Vice pair.
   * The logged-in user is automatically set as Chairman by the backend.
   * Payload: { electionId, viceUserId, vision, mission, programs, photoUrl?, vicePhotoUrl? }
   */
  createCandidatePair: async (data) => {
    return await api.post("/api/candidate-pairs/register-pair", data);
  },

  /**
   * Fetch current user's registered CandidatePair for an election
   */
  getMyCandidatePair: async (electionId) => {
    try {
      return await api.get("/api/candidate-pairs/my-pair", { params: { electionId } });
    } catch {
      return { data: null };
    }
  },
};

export default candidatePairService;
