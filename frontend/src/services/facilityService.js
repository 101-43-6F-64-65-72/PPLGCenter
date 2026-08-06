import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Facility Service matching API Contract (/api/facilities, /api/bookings)
 * Communicates directly with .NET REST API without client-side mock data.
 */
export const facilityService = {
  /**
   * Fetch all facilities & equipment items
   * GET /api/facilities
   */
  async getFacilities(params = {}) {
    const endpoint = API_ROUTES.FACILITIES.LIST;
    try {
      const response = await apiClient.get(endpoint, { params });
      if (response && response.data) {
        return response.data;
      }
      return { places: [], items: [] };
    } catch (error) {
      return { places: [], items: [] };
    }
  },

  /**
   * Fetch available slots for a facility
   * GET /api/facilities/:id/slots
   */
  async getFacilitySlots(facilityId) {
    const endpoint = API_ROUTES.FACILITIES.SLOTS(facilityId);
    try {
      const response = await apiClient.get(endpoint);
      return response?.data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Submit facility booking
   * POST /api/bookings
   */
  async createBooking(bookingPayload) {
    const endpoint = API_ROUTES.BOOKINGS.CREATE;
    try {
      const response = await apiClient.post(endpoint, bookingPayload);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error?.message || "Gagal menghubungi server booking",
      };
    }
  },

  /**
   * Fetch list of all facility bookings (For Admin / OSIS Panel)
   * GET /api/bookings
   */
  async getBookings(params = {}) {
    const endpoint = API_ROUTES.BOOKINGS.LIST;
    try {
      const response = await apiClient.get(endpoint, { params });
      return response?.data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Update booking status (Approved / Rejected)
   * PUT /api/bookings/:id/status
   */
  async updateBookingStatus(bookingId, status, rejectionReason = "") {
    const endpoint = `/api/bookings/${bookingId}/status`;
    try {
      const response = await apiClient.put(endpoint, { status, rejectionReason });
      return response;
    } catch (error) {
      return { success: false, message: error?.message || "Gagal memperbarui status booking" };
    }
  },
};

export default facilityService;
