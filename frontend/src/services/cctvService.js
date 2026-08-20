import apiClient from "@/lib/api";

export const cctvService = {
  getCameras: async () => {
    const res = await apiClient.get("/api/cctv");
    return res;
  },

  getCameraById: async (id) => {
    const res = await apiClient.get(`/api/cctv/${id}`);
    return res;
  },

  createCamera: async (data) => {
    const res = await apiClient.post("/api/cctv", data);
    return res;
  },

  toggleCamera: async (id, isEnabled) => {
    const res = await apiClient.post(`/api/cctv/${id}/toggle`, null, {
      params: { isEnabled },
    });
    return res;
  },

  deleteCamera: async (id) => {
    const res = await apiClient.delete(`/api/cctv/${id}`);
    return res;
  },

  discoverCameras: async () => {
    const res = await apiClient.post("/api/cctv/discover");
    return res;
  },
};

export default cctvService;
