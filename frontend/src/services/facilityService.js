import api from "@/lib/api";

/**
 * Pure Production Facility Service matching API Contract V1 (/api/v1/facilities, /api/v1/bookings)
 * Communicates directly with .NET REST API without client-side mock data.
 */
export const facilityService = {
  /**
   * Fetch all facilities & equipment items
   * GET /api/v1/facilities
   */
  async getFacilities(params = {}) {
    try {
      const response = await api.get("/facilities", { params });
      if (response && response.data) {
        return response.data;
      }
      return { places: [], items: [] };
    } catch (error) {
      console.warn("Backend /facilities endpoint error:", error?.message);
      return { places: [], items: [] };
    }
  },

  /**
   * Fetch available slots for a facility
   * GET /api/v1/facilities/:id/slots
   */
  async getFacilitySlots(facilityId) {
    try {
      const response = await api.get(`/facilities/${facilityId}/slots`);
      return response?.data || [];
    } catch (error) {
      console.warn(`Backend /facilities/${facilityId}/slots endpoint error:`, error?.message);
      return [];
    }
  },

  /**
   * Submit facility booking (individual or bulk cart items)
   * POST /api/v1/bookings
   */
  async createBooking(bookingPayload) {
    try {
      const response = await api.post("/bookings", bookingPayload);
      return response;
    } catch (error) {
      console.warn("Backend /bookings endpoint error:", error?.message);
      return {
        success: false,
        message: error?.message || "Gagal menghubungi server booking",
      };
    }
  },

  /**
   * Fetch list of all facility bookings (For Admin / OSIS Panel)
   * GET /api/v1/bookings
   */
  async getBookings(params = {}) {
    try {
      const response = await api.get("/bookings", { params });
      return response?.data || [];
    } catch (error) {
      console.warn("Backend /bookings endpoint error:", error?.message);
      return [];
    }
  },

  /**
   * Update booking status (Approved / Rejected)
   * PATCH /api/v1/bookings/:id/status
   */
  async updateBookingStatus(bookingId, status, notes = "") {
    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status, notes });
      return response;
    } catch (error) {
      console.warn(`Backend /bookings/${bookingId}/status endpoint error:`, error?.message);
      return { success: false, message: error?.message };
    }
  },
};

export default facilityService;
