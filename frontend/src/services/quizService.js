import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";

export const quizService = {
  /**
   * Ambil informasi kuis hari ini (Tema, status sesi siswa, streak)
   */
  getTodayInfo: async (date = null) => {
    const url = date ? `${API_ROUTES.QUIZ.TODAY}?date=${date}` : API_ROUTES.QUIZ.TODAY;
    return await api.get(url);
  },

  /**
   * Mulai sesi kuis harian baru (3 Nyawa ❤️❤️❤️)
   */
  startQuiz: async (data = {}) => {
    return await api.post(API_ROUTES.QUIZ.START, data);
  },

  /**
   * Ambil soal aktif saat ini (Anti-Cheat: Kunci jawaban dirahasiakan di server)
   */
  getCurrentQuestion: async (sessionId) => {
    return await api.get(API_ROUTES.QUIZ.GET_QUESTION(sessionId));
  },

  /**
   * Kirim jawaban soal kuis
   * @param {string} sessionId 
   * @param {Object} data { questionNumber, selectedOptionIndex, timeTakenSeconds }
   */
  submitAnswer: async (sessionId, data) => {
    return await api.post(API_ROUTES.QUIZ.SUBMIT_ANSWER(sessionId), data);
  },

  /**
   * Selesai / Kibarkan Bendera Putih (Menyerah Terhormat & Kunci Skor yang Diraih)
   */
  surrenderQuiz: async (sessionId) => {
    return await api.post(API_ROUTES.QUIZ.SURRENDER(sessionId));
  },

  /**
   * Ambil Leaderboard Harian
   */
  getDailyLeaderboard: async (date = null, limit = 50) => {
    const query = new URLSearchParams();
    if (date) query.append("date", date);
    if (limit) query.append("limit", limit);
    const qs = query.toString();
    return await api.get(`${API_ROUTES.QUIZ.DAILY_LEADERBOARD}${qs ? `?${qs}` : ""}`);
  },

  /**
   * Ambil Leaderboard Sepanjang Masa (Hall of Fame)
   */
  getAllTimeLeaderboard: async (limit = 50) => {
    return await api.get(`${API_ROUTES.QUIZ.ALL_TIME_LEADERBOARD}?limit=${limit}`);
  },

  /**
   * Ambil profil & statistik kuis pengguna
   */
  getMyProfile: async () => {
    return await api.get(API_ROUTES.QUIZ.PROFILE);
  },

  // ── Teacher Daily Topic Pipeline ─────────────────────────────────────────────

  /**
   * Ambil daftar tema yang diajukan untuk tanggal tertentu
   */
  getTopics: async (date = null) => {
    const url = date ? `${API_ROUTES.QUIZ.TOPICS}?date=${date}` : API_ROUTES.QUIZ.TOPICS;
    return await api.get(url);
  },

  /**
   * Guru / Admin mengajukan tema kuis harian baru
   */
  proposeTopic: async (data) => {
    return await api.post(API_ROUTES.QUIZ.PROPOSE_TOPIC, data);
  },

  /**
   * Guru memberikan vote untuk suatu tema
   */
  voteTopic: async (topicId) => {
    return await api.post(API_ROUTES.QUIZ.VOTE_TOPIC(topicId));
  },

  /**
   * Finalisasi tema & buat pool soal (Khusus Admin / Manual Trigger)
   */
  finalizeTopic: async (date = null) => {
    const url = date ? `${API_ROUTES.QUIZ.FINALIZE_TOPIC}?date=${date}` : API_ROUTES.QUIZ.FINALIZE_TOPIC;
    return await api.post(url);
  },

  /**
   * Reset seluruh database kuis dan generate topik & soal baru
   */
  resetAllQuizData: async () => {
    return await api.post("/api/quiz/reset");
  },

  /**
   * Admin: Acak topik baru hari ini & generate 30 soal AI baru
   */
  refreshRandomTopic: async () => {
    return await api.post("/api/quiz/admin/refresh-topic");
  },

  /**
   * Admin: Pertahankan topik saat ini tapi generate ulang 30 soal AI baru
   */
  refreshQuestions: async () => {
    return await api.post("/api/quiz/admin/refresh-questions");
  },

  /**
   * Admin: Atur topik kustom dan generate 30 soal AI baru
   */
  setTopicAndGenerate: async (topicName, description = "") => {
    return await api.post("/api/quiz/admin/set-topic-and-generate", { topicName, description });
  },
};

export default quizService;
