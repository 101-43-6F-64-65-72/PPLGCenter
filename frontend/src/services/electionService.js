import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const electionService = {
  getElections: async (params = {}) => {
    return await api.get(API_ROUTES.ELECTIONS.LIST, { params });
  },

  getElectionById: async (id) => {
    return await api.get(API_ROUTES.ELECTIONS.DETAIL(id));
  },

  createElection: async (data) => {
    return await api.post(API_ROUTES.ELECTIONS.LIST, data);
  },

  updateElection: async (id, data) => {
    return await api.put(API_ROUTES.ELECTIONS.DETAIL(id), data);
  },

  deleteElection: async (id) => {
    return await api.delete(API_ROUTES.ELECTIONS.DETAIL(id));
  },

  addCandidate: async (electionId, candidateData) => {
    return await api.post(API_ROUTES.ELECTIONS.CANDIDATES(electionId), candidateData);
  },

  removeCandidate: async (electionId, candidateId) => {
    return await api.delete(`${API_ROUTES.ELECTIONS.CANDIDATES(electionId)}/${candidateId}`);
  },

  openElection: async (id) => {
    return await api.post(API_ROUTES.ELECTIONS.OPEN(id));
  },

  closeElection: async (id) => {
    return await api.post(API_ROUTES.ELECTIONS.CLOSE(id));
  },

  publishResult: async (id) => {
    return await api.post(API_ROUTES.ELECTIONS.PUBLISH(id));
  },

  vote: async (electionId, candidateId) => {
    return await api.post(API_ROUTES.ELECTIONS.VOTE(electionId), { candidateId });
  },

  getResult: async (id) => {
    return await api.get(API_ROUTES.ELECTIONS.RESULT(id));
  },

  getParticipation: async (id) => {
    return await api.get(API_ROUTES.ELECTIONS.PARTICIPATION(id));
  },
};

export default electionService;
