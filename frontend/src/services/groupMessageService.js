import apiClient from "@/lib/api";

export const groupMessageService = {
  getGroupMessages: async (groupId, params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const res = await apiClient.get(`/api/CommunityMessages/group/${groupId}`, {
      params: { page, pageSize },
    });
    return res;
  },

  getMessages: async (groupId, params = {}) => {
    return groupMessageService.getGroupMessages(groupId, params);
  },

  sendMessage: async (data) => {
    const res = await apiClient.post("/api/CommunityMessages/send", data);
    return res;
  },

  toggleReaction: async (messageId, emoji) => {
    const res = await apiClient.post(`/api/CommunityMessages/messages/${messageId}/reactions`, { emoji });
    return res;
  },

  editMessage: async (messageId, data) => {
    const res = await apiClient.put(`/api/CommunityMessages/messages/${messageId}`, data);
    return res;
  },

  deleteForEveryone: async (messageId) => {
    const res = await apiClient.delete(`/api/CommunityMessages/messages/${messageId}/everyone`);
    return res;
  },

  deleteForMe: async (messageId) => {
    const res = await apiClient.delete(`/api/CommunityMessages/messages/${messageId}/me`);
    return res;
  },
};

export default groupMessageService;
