import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";
import bookingService from "@/services/bookingService";

export const facilityService = {
  /**
   * Get paginated list of facilities.
   * Backend returns: ApiResponse<PagedResult<FacilityResponse>>
   * PagedResult shape: { items: [], totalCount, page, pageSize, totalPages }
   */
  getFacilities: async (params = {}) => {
    const res = await api.get(API_ROUTES.FACILITIES.LIST, { params });
    // Unwrap: api.js returns res.data (inner payload), PagedResult has .items
    const pagedResult = res?.data ?? res;
    const items = pagedResult?.items ?? (Array.isArray(pagedResult) ? pagedResult : []);
    return { data: { items, totalCount: pagedResult?.totalCount ?? items.length } };
  },

  getFacilityById: async (id) => {
    return await api.get(API_ROUTES.FACILITIES.DETAIL(id));
  },

  createFacility: async (data) => {
    return await api.post(API_ROUTES.FACILITIES.LIST, data);
  },

  updateFacility: async (id, data) => {
    return await api.put(API_ROUTES.FACILITIES.DETAIL(id), data);
  },

  deleteFacility: async (id) => {
    return await api.delete(API_ROUTES.FACILITIES.DETAIL(id));
  },

  getBookings: async (params = {}) => {
    return await bookingService.getBookings(params);
  },

  updateBookingStatus: async (id, status, note) => {
    return await bookingService.updateBookingStatus(id, status, note);
  },

  getMyManagedFacilities: async () => {
    const res = await api.get("/api/facilities/my-managed");
    const data = res?.data ?? res;
    return { data: Array.isArray(data) ? data : [] };
  },

  getManagedBookings: async (params = {}) => {
    const res = await api.get("/api/facilities/managed-bookings", { params });
    const pagedResult = res?.data ?? res;
    const items = pagedResult?.items ?? (Array.isArray(pagedResult) ? pagedResult : []);
    return items;
  },
};

export default facilityService;
