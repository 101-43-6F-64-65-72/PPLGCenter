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
};

export default groupMessageService;

