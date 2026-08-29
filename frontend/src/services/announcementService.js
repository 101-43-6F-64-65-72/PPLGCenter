import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Announcement (Mading) Service
 * Directly communicates with .NET REST API endpoints without client-side dummy data.
 */
export const announcementService = {
  async getAnnouncements(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);
    if (params.category && params.category !== "Semua" && params.category !== "Populer") queryParams.append("category", params.category);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ROUTES.ANNOUNCEMENTS.LIST}?${queryString}`
      : API_ROUTES.ANNOUNCEMENTS.LIST;

    try {
      const response = await apiClient.get(endpoint);
      return response || { success: true, data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
    } catch (error) {
      console.warn("Backend API endpoint GET /announcements error:", error?.message);
      return { success: false, data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
    }
  },

  async getShowcaseAnnouncements() {
    try {
      const response = await apiClient.get(API_ROUTES.ANNOUNCEMENTS.SHOWCASE);
      return response || { success: true, data: [] };
    } catch (error) {
      console.warn("Backend API endpoint GET /announcements/showcase error:", error?.message);
      return { success: false, data: [] };
    }
  },

  async toggleShowcase(id, data = {}) {
    try {
      const response = await apiClient.patch(API_ROUTES.ANNOUNCEMENTS.TOGGLE_SHOWCASE(id), data);
      return response;
    } catch (error) {
      console.warn(`Backend API endpoint PATCH /announcements/${id}/showcase error:`, error?.message);
      throw error;
    }
  },

  async getAnnouncementById(id) {
    try {
      const response = await apiClient.get(API_ROUTES.ANNOUNCEMENTS.DETAIL(id));
      return response || { success: false, data: null };
    } catch (error) {
      console.warn(`Backend API endpoint GET /announcements/${id} error:`, error?.message);
      return { success: false, data: null };
    }
  },

  async createAnnouncement(data) {
    try {
      const response = await apiClient.post(API_ROUTES.ANNOUNCEMENTS.LIST, data);
      return response;
    } catch (error) {
      console.warn("Backend API endpoint POST /announcements error:", error?.message);
      return { success: false, message: error?.message };
    }
  },

  async updateAnnouncement(id, data) {
    try {
      const response = await apiClient.put(API_ROUTES.ANNOUNCEMENTS.DETAIL(id), data);
      return response;
    } catch (error) {
      console.warn(`Backend API endpoint PUT /announcements/${id} error:`, error?.message);
      throw error;
    }
  },

  async deleteAnnouncement(id) {
    try {
      const response = await apiClient.delete(API_ROUTES.ANNOUNCEMENTS.DETAIL(id));
      return response;
    } catch (error) {
      console.warn(`Backend API endpoint DELETE /announcements/${id} error:`, error?.message);
      throw error;
    }
  },

  // ── Comment Endpoints ──
  async getComments(announcementId, params = {}) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    try {
      const response = await apiClient.get(
        `${API_ROUTES.ANNOUNCEMENT_COMMENTS.BY_ANNOUNCEMENT(announcementId)}?page=${page}&pageSize=${pageSize}`
      );
      return response;
    } catch (error) {
      console.warn(`GET comments error for announcement ${announcementId}:`, error?.message);
      return { success: false, items: [], totalCount: 0 };
    }
  },

  async addComment(announcementId, contentOrData, parentCommentId = null) {
    try {
      let content = "";
      let parentId = parentCommentId;

      if (typeof contentOrData === "object" && contentOrData !== null) {
        content = contentOrData.content || "";
        parentId = contentOrData.parentCommentId || parentCommentId || null;
      } else {
        content = typeof contentOrData === "string" ? contentOrData : String(contentOrData || "");
      }

      const response = await apiClient.post(
        API_ROUTES.ANNOUNCEMENT_COMMENTS.BY_ANNOUNCEMENT(announcementId),
        { content, parentCommentId: parentId }
      );
      return response;
    } catch (error) {
      console.warn(`POST comment error for announcement ${announcementId}:`, error?.message);
      throw error;
    }
  },

  async deleteComment(announcementIdOrObj, commentId = null) {
    try {
      let aId = announcementIdOrObj;
      let cId = commentId;

      if (typeof announcementIdOrObj === "object" && announcementIdOrObj !== null) {
        aId = announcementIdOrObj.announcementId;
        cId = announcementIdOrObj.commentId || announcementIdOrObj.id;
      }

      const response = await apiClient.delete(
        API_ROUTES.ANNOUNCEMENT_COMMENTS.DELETE(aId, cId)
      );
      return response;
    } catch (error) {
      console.warn(`DELETE comment error:`, error?.message);
      throw error;
    }
  },

  async toggleCommentsLock(announcementId) {
    try {
      const response = await apiClient.post(
        API_ROUTES.ANNOUNCEMENT_COMMENTS.TOGGLE_LOCK(announcementId)
      );
      return response;
    } catch (error) {
      console.warn(`Toggle comments lock error for announcement ${announcementId}:`, error?.message);
      throw error;
    }
  },

  // ── Reaction Endpoints ──
  async getReactions(announcementId) {
    try {
      const response = await apiClient.get(
        API_ROUTES.ANNOUNCEMENTS.REACTIONS(announcementId)
      );
      return response?.data || response;
    } catch (error) {
      console.warn(`GET reactions error for announcement ${announcementId}:`, error?.message);
      return null;
    }
  },

  async toggleReaction(announcementId, type) {
    try {
      const response = await apiClient.post(
        API_ROUTES.ANNOUNCEMENTS.REACTIONS(announcementId),
        { type }
      );
      return response;
    } catch (error) {
      console.warn(`Toggle reaction ${type} error for announcement ${announcementId}:`, error?.message);
      throw error;
    }
  },

  async removeReaction(announcementId) {
    try {
      const response = await apiClient.delete(
        API_ROUTES.ANNOUNCEMENTS.REACTIONS(announcementId)
      );
      return response;
    } catch (error) {
      console.warn(`Remove reaction error for announcement ${announcementId}:`, error?.message);
      throw error;
    }
  },

  // ── GitHub Emojis Integration ──
  async getGitHubEmojis() {
    try {
      const res = await fetch("https://api.github.com/emojis", {
        headers: { Accept: "application/vnd.github.v3+json" },
      });
      if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.warn("Failed to fetch GitHub emojis:", error?.message);
      return null;
    }
  },
};

export default announcementService;
