import apiClient from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Service for Facility Booking Operations matching API contract (/api/bookings)
 */
export const bookingService = {
  /**
   * Fetch bookings filtered by facility, date, and status from backend
   * @param {string} facilityId - UUID of the facility
   * @param {string} [bookingDate] - Date string YYYY-MM-DD
   * @param {number|string} [status] - BookingStatus enum (1 = Approved)
   */
  async getVerifiedBookings(facilityId, bookingDate = null, status = 1) {
    const endpoint = API_ROUTES.BOOKINGS.LIST;
    try {
      const params = {
        facilityId,
        status: status, // Approved bookings only
        pageSize: 100,
      };

      const response = await apiClient.get(endpoint, { params });
      let items = response?.data?.items || response?.items || response?.data || (Array.isArray(response) ? response : []);

      // Client-side date filter if bookingDate provided
      if (bookingDate && Array.isArray(items)) {
        const targetDateStr = new Date(bookingDate).toISOString().split("T")[0];
        items = items.filter((b) => {
          if (!b.startTime && !b.StartTime) return false;
          const bDateStr = new Date(b.startTime || b.StartTime).toISOString().split("T")[0];
          return bDateStr === targetDateStr;
        });
      }

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error?.message || "Gagal mengambil data peminjaman dari server",
      };
    }
  },

  /**
   * Calculate real-time slot availability for a given facility and date
   * @param {Object} facility - Facility object
   * @param {string} selectedDate - YYYY-MM-DD date string
   * @param {Array} predefinedSlots - Array of slot templates [{ id, time, startTime, endTime }]
   */
  async getSlotAvailability(facility, selectedDate, predefinedSlots = []) {
    if (!facility) {
      return { success: false, slots: [], message: "Fasilitas tidak ditemukan" };
    }

    // Default predefined time slots if omitted
    const baseSlots = predefinedSlots.length > 0 ? predefinedSlots : [
      { id: 1, time: "07:00 - 09:00", startHour: 7, endHour: 9 },
      { id: 2, time: "09:00 - 11:00", startHour: 9, endHour: 11 },
      { id: 3, time: "11:00 - 12:00", startHour: 11, endHour: 12 },
      { id: 4, time: "12:00 - 13:00", startHour: 12, endHour: 13 },
      { id: 5, time: "13:00 - 14:00", startHour: 13, endHour: 14 },
      { id: 6, time: "14:00 - 15:00", startHour: 14, endHour: 15 },
      { id: 7, time: "15:00 - 17:00", startHour: 15, endHour: 17 },
    ];

    // Check facility active status
    const isFacilityActive = facility.isActive ?? facility.IsActive ?? true;
    if (!isFacilityActive) {
      const unavailableSlots = baseSlots.map((s) => ({
        ...s,
        status: "Tidak tersedia",
        available: false,
      }));
      return { success: true, slots: unavailableSlots };
    }

    // Fetch verified approved bookings for this facility
    const result = await this.getVerifiedBookings(facility.id, selectedDate, 1);
    if (!result.success) {
      return {
        success: false,
        slots: [],
        message: result.message,
      };
    }

    const verifiedBookings = result.data || [];

    // Map availability for each time slot
    const mappedSlots = baseSlots.map((slot) => {
      // Check if slot overlaps with any approved booking
      const isOccupied = verifiedBookings.some((b) => {
        const statusVal = b.status ?? b.Status;
        // Only Approved (1) blocks the slot
        const isApproved = statusVal === 1 || statusVal === "Approved" || statusVal === "1";
        if (!isApproved) return false;

        const bookingStart = new Date(b.startTime || b.StartTime);
        const bookingEnd = new Date(b.endTime || b.EndTime);

        const bStartHour = bookingStart.getHours() + bookingStart.getMinutes() / 60;
        const bEndHour = bookingEnd.getHours() + bookingEnd.getMinutes() / 60;

        // Overlap condition: start < bEnd AND end > bStart
        return slot.startHour < bEndHour && slot.endHour > bStartHour;
      });

      if (isOccupied) {
        return {
          ...slot,
          status: "Penuh",
          available: false,
        };
      }

      return {
        ...slot,
        status: "Tersedia",
        available: true,
      };
    });

    return { success: true, slots: mappedSlots };
  },

  /**
   * Submit new booking request
   */
  async createBooking(payload) {
    const endpoint = API_ROUTES.BOOKINGS.CREATE;
    try {
      const response = await apiClient.post(endpoint, payload);
      return {
        success: true,
        data: response?.data || response,
        message: response?.message || "Peminjaman berhasil diajukan",
      };
    } catch (error) {
      return {
        success: false,
        message: error?.message || "Gagal mengajukan peminjaman ke server",
      };
    }
  },
};

export default bookingService;
