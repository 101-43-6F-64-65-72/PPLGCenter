import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const calendarService = {
  getEvents: async (params = {}) => {
    return await api.get(API_ROUTES.CALENDAR.LIST, { params });
  },

  getMonthlyEvents: async (year, month) => {
    return await api.get(API_ROUTES.CALENDAR.MONTH, { params: { year, month } });
  },

  getDailyEvents: async (date) => {
    return await api.get(API_ROUTES.CALENDAR.DAY, { params: { date } });
  },

  getUpcomingEvents: async (count = 5) => {
    return await api.get(API_ROUTES.CALENDAR.UPCOMING, { params: { count } });
  },

  getEventById: async (id) => {
    return await api.get(API_ROUTES.CALENDAR.DETAIL(id));
  },

  createEvent: async (data) => {
    return await api.post(API_ROUTES.CALENDAR.LIST, data);
  },

  updateEvent: async (id, data) => {
    return await api.put(API_ROUTES.CALENDAR.DETAIL(id), data);
  },

  deleteEvent: async (id) => {
    return await api.delete(API_ROUTES.CALENDAR.DETAIL(id));
  },
};

export default calendarService;
