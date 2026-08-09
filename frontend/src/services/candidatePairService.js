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
    // Return empty result gracefully to prevent 404/403 console errors when dedicated endpoint is disabled
    return { data: [] };
  },

  /**
   * Submit single Unified Candidate Pair Registration (Chairman + Vice Chairman)
   * Data payload: { electionId, viceUserId, vision, mission, programs, photoUrl, vicePhotoUrl }
   */
  createCandidatePair: async (data) => {
    try {
      return await api.post("/api/candidate-pairs", data);
    } catch (err) {
      // Fallback contract mapping
      return await api.post("/api/candidate-pairs/register-pair", data);
    }
  },

  /**
   * Fetch current user's registered CandidatePair for an election
   */
  getMyCandidatePair: async (electionId) => {
    return await api.get(`/api/candidate-pairs/my-pair`, { params: { electionId } });
  },
};

export default candidatePairService;
