import apiClient from "@/lib/api";

export const communityService = {
  getGroups: async (params = {}) => {
    const { page = 1, pageSize = 10, search = "" } = params;
    const res = await apiClient.get("/api/CommunityGroups", {
      params: { page, pageSize, search },
    });
    return res;
  },

  getGroupById: async (groupId) => {
    const res = await apiClient.get(`/api/CommunityGroups/${groupId}`);
    return res;
  },

  createGroup: async (data) => {
    const res = await apiClient.post("/api/CommunityGroups", data);
    return res;
  },

  joinGroupRequest: async (groupId) => {
    const res = await apiClient.post(`/api/CommunityGroups/${groupId}/join`);
    return res;
  },

  getMembers: async (groupId) => {
    const res = await apiClient.get(`/api/CommunityGroups/${groupId}/members`);
    return res;
  },

  manageMember: async (groupId, targetUserId, data) => {
    const res = await apiClient.put(`/api/CommunityGroups/${groupId}/members/${targetUserId}`, data);
    return res;
  },

  leaveGroup: async (groupId) => {
    const res = await apiClient.delete(`/api/CommunityGroups/${groupId}/leave`);
    return res;
  },

  inviteMember: async (groupId, targetUserId) => {
    const res = await apiClient.post(`/api/CommunityGroups/${groupId}/invite/${targetUserId}`);
    return res;
  },

  searchUsersForInvite: async (groupId, query = "") => {
    const res = await apiClient.get(`/api/CommunityGroups/${groupId}/search-users`, {
      params: { query },
    });
    return res;
  },

  getInvitations: async () => {
    const res = await apiClient.get("/api/CommunityGroups/inbox/invitations");
    return res;
  },

  respondToInvitation: async (membershipId, accept = true) => {
    const res = await apiClient.post(`/api/CommunityGroups/inbox/invitations/${membershipId}/respond`, null, {
      params: { accept },
    });
    return res;
  },

  getMentions: async () => {
    const res = await apiClient.get("/api/CommunityGroups/inbox/mentions");
    return res;
  },

  deleteGroup: async (groupId) => {
    const res = await apiClient.delete(`/api/CommunityGroups/${groupId}`);
    return res;
  },
};

export default communityService;
