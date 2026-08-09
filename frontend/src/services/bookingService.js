import apiClient, { getStoredToken } from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

/**
 * Service for Facility Booking Operations matching API contract (/api/bookings)
 */
export const bookingService = {
  /**
   * Fetch all bookings with optional query parameters
   * @param {Object} params - Query parameters (page, pageSize, facilityId, userId, status)
   */
  async getBookings(params = {}) {
    if (!getStoredToken()) {
      return [];
    }
    const endpoint = API_ROUTES.BOOKINGS.LIST;
    try {
      const response = await apiClient.get(endpoint, { params });
      let items = response?.data?.items || response?.items || response?.data || (Array.isArray(response) ? response : []);
      
      // Normalize items for UI consumption
      return items.map((item) => {
        const rawStatus = item.status ?? item.Status ?? 0;
        let statusText = "Menunggu Verifikasi";
        if (rawStatus === 1 || rawStatus === "Approved") statusText = "Disetujui Admin";
        else if (rawStatus === 2 || rawStatus === "Rejected") statusText = "Ditolak Admin";

        return {
          id: item.id || item.Id,
          facilityId: item.facilityId || item.FacilityId,
          facilityTitle: item.facilityName || item.FacilityName || item.facilityTitle || "Fasilitas Sekolah",
          activityName: item.purpose || item.Purpose || item.activityName || "Kegiatan Sekolah",
          organization: item.organizationName || item.OrganizationName || item.organization || "OSIS / Ekstrakurikuler",
          date: item.startTime
            ? new Date(item.startTime).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
            : "Hari ini",
          slotFormatted: item.startTime && item.endTime
            ? `${new Date(item.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
            : "08:00 - 12:00",
          description: item.purpose || item.Description || item.description || "-",
          status: statusText,
          verificator: item.approvedByUserName || "Admin Sarpras",
        };
      });
    } catch (error) {
      return [];
    }
  },

  /**
   * Update booking status (Approved = 1, Rejected = 2)
   */
  async updateBookingStatus(id, status, note = "") {
    const endpoint = `/api/bookings/${id}/status`;
    try {
      let statusNum = 1;
      if (typeof status === "number") {
        statusNum = status;
      } else if (String(status).toLowerCase().includes("tolak") || String(status).toLowerCase().includes("reject")) {
        statusNum = 2;
      }
      const response = await apiClient.put(endpoint, {
        status: statusNum,
        rejectionReason: note,
        note,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch bookings filtered by facility, date, and status from backend
   * @param {string} facilityId - UUID of the facility
   * @param {string} [bookingDate] - Date string YYYY-MM-DD
   * @param {number|string} [status] - BookingStatus enum (1 = Approved)
   */
  async getVerifiedBookings(facilityId, bookingDate = null, status = 1) {
    if (!getStoredToken()) {
      return { success: true, data: [] };
    }
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
   */
  async getSlotAvailability(facility, selectedDate, predefinedSlots = []) {
    if (!facility) {
      return { success: false, slots: [], message: "Fasilitas tidak ditemukan" };
    }

    const baseSlots = predefinedSlots.length > 0 ? predefinedSlots : [
      { id: 1, time: "07:00 - 09:00", startHour: 7, endHour: 9 },
      { id: 2, time: "09:00 - 11:00", startHour: 9, endHour: 11 },
      { id: 3, time: "11:00 - 12:00", startHour: 11, endHour: 12 },
      { id: 4, time: "12:00 - 13:00", startHour: 12, endHour: 13 },
      { id: 5, time: "13:00 - 14:00", startHour: 13, endHour: 14 },
      { id: 6, time: "14:00 - 15:00", startHour: 14, endHour: 15 },
      { id: 7, time: "15:00 - 17:00", startHour: 15, endHour: 17 },
    ];

    const isFacilityActive = facility.isActive ?? facility.IsActive ?? true;
    if (!isFacilityActive) {
      const unavailableSlots = baseSlots.map((s) => ({
        ...s,
        status: "Tidak tersedia",
        available: false,
      }));
      return { success: true, slots: unavailableSlots };
    }

    const result = await this.getVerifiedBookings(facility.id, selectedDate, 1);
    if (!result.success) {
      return {
        success: false,
        slots: [],
        message: result.message,
      };
    }

    const verifiedBookings = result.data || [];

    const mappedSlots = baseSlots.map((slot) => {
      const isOccupied = verifiedBookings.some((b) => {
        const statusVal = b.status ?? b.Status;
        const isApproved = statusVal === 1 || statusVal === "Approved" || statusVal === "1";
        if (!isApproved) return false;

        const bookingStart = new Date(b.startTime || b.StartTime);
        const bookingEnd = new Date(b.endTime || b.EndTime);

        const bStartHour = bookingStart.getHours() + bookingStart.getMinutes() / 60;
        const bEndHour = bookingEnd.getHours() + bookingEnd.getMinutes() / 60;

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
      let errMsg = "Gagal mengajukan peminjaman.";
      if (error?.response?.data) {
        const d = error.response.data;
        if (d.errors && typeof d.errors === "object") {
          const firstErrKey = Object.keys(d.errors)[0];
          if (firstErrKey && Array.isArray(d.errors[firstErrKey]) && d.errors[firstErrKey].length > 0) {
            errMsg = d.errors[firstErrKey][0];
          } else if (typeof d.errors === "string") {
            errMsg = d.errors;
          }
        } else if (d.message) {
          errMsg = d.message;
        } else if (d.title) {
          errMsg = d.title;
        }
      } else if (error?.message) {
        errMsg = error.message;
      }
      return {
        success: false,
        message: errMsg,
      };
    }
  },
};

export default bookingService;
