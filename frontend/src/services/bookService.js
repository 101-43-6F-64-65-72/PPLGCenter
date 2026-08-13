import apiClient from "@/lib/api";

export const bookService = {
  getBooks: async (params = {}) => {
    const { page = 1, pageSize = 10, category = "", search = "" } = params;
    const res = await apiClient.get("/api/Books", {
      params: { page, pageSize, category, search },
    });
    return res;
  },

  getBookById: async (id) => {
    const res = await apiClient.get(`/api/Books/${id}`);
    return res;
  },

  createBook: async (data) => {
    const res = await apiClient.post("/api/Books", data);
    return res;
  },

  updateBook: async (id, data) => {
    const res = await apiClient.put(`/api/Books/${id}`, data);
    return res;
  },

  deleteBook: async (id) => {
    const res = await apiClient.delete(`/api/Books/${id}`);
    return res;
  },

  requestBorrow: async (data) => {
    const res = await apiClient.post("/api/Books/borrow/request", data);
    return res;
  },

  getMyBorrowRequests: async (params = {}) => {
    const { page = 1, pageSize = 10 } = params;
    const res = await apiClient.get("/api/Books/borrow/my-requests", {
      params: { page, pageSize },
    });
    return res;
  },

  getPendingBorrowRequests: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const res = await apiClient.get("/api/Books/borrow/pending", {
      params: { page, pageSize },
    });
    return res;
  },

  processBorrowRequest: async (requestId, data) => {
    const res = await apiClient.post(`/api/Books/borrow/${requestId}/process`, data);
    return res;
  },

  markReturned: async (requestId) => {
    const res = await apiClient.post(`/api/Books/borrow/${requestId}/return`);
    return res;
  },

  assignManager: async (category, managerUserId) => {
    const res = await apiClient.post("/api/Books/managers", {
      category,
      managerUserId,
    });
    return res;
  },
};

export default bookService;
