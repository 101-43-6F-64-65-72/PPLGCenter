import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const showcaseBannerService = {
  async getActiveBanners() {
    try {
      const response = await apiClient.get(API_ROUTES.SHOWCASE_BANNERS.LIST);
      return response || { success: true, data: [] };
    } catch (error) {
      console.warn("Backend API endpoint GET /showcase-banners error:", error?.message);
      return { success: false, data: [] };
    }
  },

  async getAllBanners() {
    try {
      const response = await apiClient.get(API_ROUTES.SHOWCASE_BANNERS.ALL);
      return response || { success: true, data: [] };
    } catch (error) {
      console.warn("Backend API endpoint GET /showcase-banners/all error:", error?.message);
      return { success: false, data: [] };
    }
  },

  async createBanner(data) {
    try {
      const response = await apiClient.post(API_ROUTES.SHOWCASE_BANNERS.CREATE, data);
      return response;
    } catch (error) {
      console.warn("Backend API endpoint POST /showcase-banners error:", error?.message);
      throw error;
    }
  },

  async addFromAnnouncement(announcementId) {
    try {
      const response = await apiClient.post(
        API_ROUTES.SHOWCASE_BANNERS.FROM_ANNOUNCEMENT(announcementId)
      );
      return response;
    } catch (error) {
      console.warn("Backend API endpoint POST /showcase-banners/from-announcement error:", error?.message);
      throw error;
    }
  },

  async updateBanner(id, data) {
    try {
      const response = await apiClient.put(API_ROUTES.SHOWCASE_BANNERS.UPDATE(id), data);
      return response;
    } catch (error) {
      console.warn(`Backend API endpoint PUT /showcase-banners/${id} error:`, error?.message);
      throw error;
    }
  },

  async deleteBanner(id, permanent = false) {
    try {
      const url = permanent 
        ? `${API_ROUTES.SHOWCASE_BANNERS.DELETE(id)}?permanent=true`
        : API_ROUTES.SHOWCASE_BANNERS.DELETE(id);
      const response = await apiClient.delete(url);
      return response;
    } catch (error) {
      console.warn(`Backend API endpoint DELETE /showcase-banners/${id} error:`, error?.message);
      throw error;
    }
  },

  async restoreBanner(id) {
    try {
      const response = await apiClient.post(API_ROUTES.SHOWCASE_BANNERS.RESTORE(id));
      return response;
    } catch (error) {
      console.warn(`Backend API endpoint POST /showcase-banners/${id}/restore error:`, error?.message);
      throw error;
    }
  },

  async reorderBanners(orderedBannerIds) {
    try {
      const response = await apiClient.post(API_ROUTES.SHOWCASE_BANNERS.REORDER, {
        orderedBannerIds,
      });
      return response;
    } catch (error) {
      console.warn("Backend API endpoint POST /showcase-banners/reorder error:", error?.message);
      throw error;
    }
  },
};

export default showcaseBannerService;
