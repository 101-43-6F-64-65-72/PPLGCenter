import apiClient from "@/lib/api";

const libraryService = {
  getFolders: async (parentFolderId = null) => {
    const res = await apiClient.get("/api/library/folders", {
      params: { parentFolderId },
    });
    return res;
  },

  createFolder: async (data) => {
    const res = await apiClient.post("/api/library/folders", data);
    return res;
  },

  deleteFolder: async (folderId) => {
    const res = await apiClient.delete(`/api/library/folders/${folderId}`);
    return res;
  },

  getBooks: async (folderId = null, search = "") => {
    const res = await apiClient.get("/api/library/books", {
      params: { folderId, search },
    });
    return res;
  },

  getBookById: async (bookId) => {
    const res = await apiClient.get(`/api/library/books/${bookId}`);
    return res;
  },

  createBook: async (data) => {
    const res = await apiClient.post("/api/library/books", data);
    return res;
  },

  deleteBook: async (bookId) => {
    const res = await apiClient.delete(`/api/library/books/${bookId}`);
    return res;
  },

  borrowBook: async (bookId, data) => {
    const res = await apiClient.post(`/api/library/books/${bookId}/borrow`, data);
    return res;
  },

  getTargetedTeacherBorrowRequests: async () => {
    const res = await apiClient.get("/api/library/inbox/borrow-requests");
    return res;
  },

  getStudentBorrowRequests: async () => {
    const res = await apiClient.get("/api/library/my-borrow-requests");
    return res;
  },

  respondToBorrowRequest: async (requestId, approve = true, reason = "") => {
    const res = await apiClient.post(`/api/library/inbox/borrow-requests/${requestId}/respond`, null, {
      params: { approve, reason },
    });
    return res;
  },
};

export default libraryService;
