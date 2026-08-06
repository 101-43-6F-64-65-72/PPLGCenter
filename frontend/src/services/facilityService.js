import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Pure Production Facility Service matching API Contract (/api/facilities, /api/bookings)
 * Communicates directly with .NET REST API without client-side mock data.
 */
export const facilityService = {
  /**
   * Fetch all facilities (Places)
   * GET /api/facilities
   */
  async getFacilities(params = {}) {
    const endpoint = API_ROUTES.FACILITIES.LIST;
    try {
      const response = await apiClient.get(endpoint, { params });
      const items = response?.data?.items || response?.items || response?.data || (Array.isArray(response) ? response : []);
      return {
        success: true,
        data: items,
        raw: response,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error?.message || "Gagal memuat data fasilitas",
      };
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
      return {
        success: true,
        data: response?.data || response,
        message: response?.message || "Peminjaman fasilitas berhasil diajukan",
      };
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
      const items = response?.data?.items || response?.items || response?.data || (Array.isArray(response) ? response : []);
      return {
        success: true,
        data: items,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
      };
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
      return {
        success: true,
        data: response?.data || response,
      };
    } catch (error) {
      return { success: false, message: error?.message || "Gagal memperbarui status booking" };
    }
  },
};

export default facilityService;
