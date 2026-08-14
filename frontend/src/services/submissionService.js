import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const submissionService = {
  async getById(id) {
    const res = await api.get(API_ROUTES.SUBMISSIONS.DETAIL(id));
    return res.data;
  },

  async getMySubmissionForAssignment(assignmentId) {
    const res = await api.get(API_ROUTES.SUBMISSIONS.MY_SUBMISSION(assignmentId));
    return res.data;
  },

  async submit(data) {
    const res = await api.post(API_ROUTES.SUBMISSIONS.SUBMIT, data);
    return res.data;
  },

  async grade(id, data) {
    const res = await api.post(API_ROUTES.SUBMISSIONS.GRADE(id), data);
    return res.data;
  },
};
