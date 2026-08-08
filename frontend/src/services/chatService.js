import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const chatService = {
  getConversations: async (cursor = null, limit = 20) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    return await api.get(API_ROUTES.CONVERSATIONS.LIST, { params });
  },

  getConversationById: async (id) => {
    return await api.get(API_ROUTES.CONVERSATIONS.DETAIL(id));
  },

  getOrCreateDirectConversation: async (recipientUserId, initialMessage = null) => {
    return await api.post(API_ROUTES.CONVERSATIONS.CREATE, { recipientUserId, initialMessage });
  },

  markAsRead: async (conversationId) => {
    return await api.post(API_ROUTES.CONVERSATIONS.MARK_READ(conversationId));
  },

  getUnreadCount: async () => {
    return await api.get(API_ROUTES.CONVERSATIONS.UNREAD_COUNT);
  },

  getMessages: async (conversationId, cursor = null, limit = 30) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    return await api.get(API_ROUTES.MESSAGES.BY_CONVERSATION(conversationId), { params });
  },

  sendMessage: async (data) => {
    return await api.post(API_ROUTES.MESSAGES.SEND, data);
  },

  deleteMessage: async (id) => {
    return await api.delete(API_ROUTES.MESSAGES.DELETE(id));
  },
};
