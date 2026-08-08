import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const discussionService = {
  getThreadsByClassSubject: async (classSubjectId, cursor = null, limit = 15) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    return await api.get(API_ROUTES.DISCUSSIONS.BY_CLASS_SUBJECT(classSubjectId), { params });
  },

  getThreadById: async (id) => {
    return await api.get(API_ROUTES.DISCUSSIONS.DETAIL(id));
  },

  createThread: async (data) => {
    return await api.post(API_ROUTES.DISCUSSIONS.LIST, data);
  },

  updateThread: async (id, data) => {
    return await api.put(API_ROUTES.DISCUSSIONS.DETAIL(id), data);
  },

  deleteThread: async (id) => {
    return await api.delete(API_ROUTES.DISCUSSIONS.DETAIL(id));
  },

  togglePin: async (id) => {
    return await api.post(API_ROUTES.DISCUSSIONS.PIN(id));
  },

  toggleLock: async (id) => {
    return await api.post(API_ROUTES.DISCUSSIONS.LOCK(id));
  },

  getReplies: async (threadId) => {
    return await api.get(API_ROUTES.DISCUSSIONS.REPLIES(threadId));
  },

  createReply: async (data) => {
    return await api.post(API_ROUTES.DISCUSSIONS.CREATE_REPLY, data);
  },

  deleteReply: async (id) => {
    return await api.delete(API_ROUTES.DISCUSSIONS.DELETE_REPLY(id));
  },
};
