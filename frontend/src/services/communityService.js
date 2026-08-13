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
};

export default communityService;
