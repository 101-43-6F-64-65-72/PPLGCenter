import extracurricularService from "./extracurricularService";

/**
 * Extracurricular Club Service matching backend REST API endpoints (/api/extracurriculars)
 * Delegates to extracurricularService to avoid route mismatches.
 */
export const clubService = {
  /**
   * Fetch list of extracurricular clubs
   */
  async getClubs(params = {}) {
    const res = await extracurricularService.getExtracurriculars(params);
    return res?.data || [];
  },

  /**
   * Fetch single club detail by ID
   */
  async getClubById(id) {
    const res = await extracurricularService.getExtracurricularById(id);
    return res?.data || null;
  },
};

export default clubService;
