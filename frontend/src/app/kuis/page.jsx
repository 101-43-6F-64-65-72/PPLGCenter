"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { motion, AnimatePresence } from "@/lib/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BloubMascot from "@/components/BloubMascot";
import useAuth from "@/hooks/useAuth";
import quizService from "@/services/quizService";
import AuthGuard from "@/components/layout/AuthGuard";
import {
  Flame,
  Heart,
  Trophy,
  Award,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ArrowRight,
  Code2,
  Users,
  Vote,
  Plus,
  RefreshCw,
  Crown,
  Medal,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Send,
  AlertTriangle,
  Copy,
  Check,
  Flag,
  X,
  ShieldAlert,
  Calendar,
  Layers,
  BarChart3,
  Target,
} from "lucide-react";

export default function KuisPage() {
  return (
    <AuthGuard>
      <KuisContent />
    </AuthGuard>
  );
}

const PRACTICE_QUESTIONS = [
  {
    questionNumber: 1,
    difficulty: "easy",
    questionText: "Manakah sintaks yang benar untuk mendeklarasikan variabel yang nilainya konstan di JavaScript?",
    codeSnippet: null,
    options: [
      "var myVar = 10;",
      "const myVar = 10;",
      "let myVar = 10;",
      "constant myVar = 10;"
    ],
    correctAnswerIndex: 1,
    explanation: "Keyword 'const' digunakan di JavaScript untuk variabel yang nilainya bersifat konstan (immutable reference)."
  },
  {
    questionNumber: 2,
    difficulty: "medium",
    questionText: "Dalam arsitektur REST API, HTTP method manakah yang bersifat idempotent dan digunakan untuk memperbarui seluruh entitas?",
    codeSnippet: null,
    options: [
      "POST",
      "PUT",
      "PATCH",
      "DELETE"
    ],
    correctAnswerIndex: 1,
    explanation: "Method PUT bersifat idempotent dan digunakan untuk menggantikan seluruh representasi resource target."
  },
  {
    questionNumber: 3,
    difficulty: "medium",
    questionText: "Apa fungsi utama dari hook 'useEffect' pada React?",
    codeSnippet: "useEffect(() => {\n  document.title = `PPLG Center`;\n}, []);",
    options: [
      "Menghandle side-effects seperti fetch data dan DOM mutation",
      "Membuat component baru secara dinamis",
      "Menggantikan seluruh CSS styling di aplikasi",
      "Menghubungkan langsung ke database SQL"
    ],
    correctAnswerIndex: 0,
    explanation: "Hook useEffect digunakan untuk menjalankan efek samping (side effects) setelah komponen selesai dirender."
  },
  {
    questionNumber: 4,
    difficulty: "hard",
    questionText: "Di ASP.NET Core, bagaimanakah cara mendaftarkan service dengan siklus hidup per-HTTP Request?",
    codeSnippet: "builder.Services.AddScoped<IQuizService, QuizService>();",
    options: [
      "AddTransient",
      "AddScoped",
      "AddSingleton",
      "AddHostedService"
    ],
    correctAnswerIndex: 1,
    explanation: "AddScoped membuat instance service yang bertahan selama satu siklus HTTP request dan dibersihkan setelah request selesai."
  },
  {
    questionNumber: 5,
    difficulty: "hard",
    questionText: "Manakah protokol komunikasi jaringan yang menggunakan 3-Way Handshake (SYN, SYN-ACK, ACK)?",
    codeSnippet: null,
    options: [
      "UDP",
      "TCP",
      "ICMP",
      "DNS"
    ],
    correctAnswerIndex: 1,
    explanation: "TCP (Transmission Control Protocol) melakukan 3-Way Handshake untuk membangun koneksi yang andal sebelum mengirimkan data."
  }
];

function KuisContent() {
  const router = useRouter();
  const { user, isAuthenticated, role } = useAuth();
  const isAdmin = role?.toString().toLowerCase() === "admin" || user?.role?.toString().toLowerCase() === "admin";
  const isTeacher = role?.toString().toLowerCase() === "teacher" || user?.role?.toString().toLowerCase() === "teacher" || isAdmin;

  // Active Main Tab: "arena" | "leaderboard" | "teacher-voting"
  const [mainTab, setMainTab] = useState("arena");

  // Game Phase: "lobby" | "playing" | "answered" | "gameover"
  const [gamePhase, setGamePhase] = useState("lobby");

  // Today's Quiz Meta & Stats
  const [quizInfo, setQuizInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);

  // Active Quiz Gameplay Session State
  const [currentSession, setCurrentSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Gameplay Timer (30s per question)
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  // Mascot Emotion State
  const [mascotState, setMascotState] = useState("happy");

  // Leaderboard States
  const [leaderboardType, setLeaderboardType] = useState("daily"); // "daily" | "all-time"
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Teacher Topic States
  const [topicsList, setTopicsList] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [isProposing, setIsProposing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // White Flag / Surrender Modal States
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false);
  const [isSurrendering, setIsSurrendering] = useState(false);

  // Fast Mode State (Auto-advance to next question immediately on click)
  const [isFastMode, setIsFastMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pplg_quiz_fast_mode");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pplg_quiz_fast_mode", isFastMode ? "true" : "false");
    }
  }, [isFastMode]);

  // GSAP Container Refs
  const arenaContainerRef = useRef(null);
  const optionsGridRef = useRef(null);
  const podiumRef = useRef(null);

  // 1. Fetch Today's Quiz Info
  const loadQuizInfo = useCallback(async () => {
    try {
      setInfoLoading(true);
      const res = await quizService.getTodayInfo();
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;
      if (data) {
        setQuizInfo(data);
        return;
      }
    } catch (err) {
      console.warn("Info kuis live:", err?.message || "Default fallback aktif");
    } finally {
      setInfoLoading(false);
    }

    // Default fallback so UI is always functional
    setQuizInfo((prev) => prev || {
      topic: "Cyber Security Best Practices & OWASP Top 10",
      topicDescription: "Kuis harian bertingkat untuk mengasah keahlian software engineering Anda.",
      totalParticipantsToday: 0,
      availableQuestionsCount: 30,
      hasActiveSession: false,
      hasCompletedToday: false,
      userProfile: {
        totalScore: 0,
        currentStreak: 0,
        highestStreak: 0,
        accuracyPercentage: 0,
      },
    });
  }, []);

  useEffect(() => {
    loadQuizInfo();
  }, [loadQuizInfo]);

  // 2. Fetch Leaderboard Data
  const loadLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);
      if (leaderboardType === "daily") {
        const res = await quizService.getDailyLeaderboard();
        const data = res?.data?.data !== undefined ? res.data.data : res?.data;
        setLeaderboardData(Array.isArray(data) ? data : []);
      } else {
        const res = await quizService.getAllTimeLeaderboard();
        const data = res?.data?.data !== undefined ? res.data.data : res?.data;
        setLeaderboardData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Leaderboard status:", err?.message || "Belum ada data");
      setLeaderboardData([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [leaderboardType]);

  useEffect(() => {
    if (mainTab === "leaderboard") {
      loadLeaderboard();
    }
  }, [mainTab, loadLeaderboard]);

  // GSAP Animation for Podium Cards
  useEffect(() => {
    if (mainTab === "leaderboard" && podiumRef.current && leaderboardData.length > 0) {
      const cards = podiumRef.current.querySelectorAll(".podium-card");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 24, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.45, stagger: 0.08, ease: "power2.out" }
        );
      }
    }
  }, [mainTab, leaderboardData]);

  // GSAP Animation for Question Options
  useEffect(() => {
    if (gamePhase === "playing" && optionsGridRef.current) {
      const optionButtons = optionsGridRef.current.querySelectorAll(".quiz-opt-btn");
      if (optionButtons.length > 0) {
        gsap.fromTo(
          optionButtons,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" }
        );
      }
    }
  }, [gamePhase, currentQuestion?.questionNumber]);

  // 3. Fetch Teacher Topics List
  const loadTeacherTopics = useCallback(async () => {
    try {
      setTopicsLoading(true);
      const res = await quizService.getTopics();
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;
      setTopicsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat daftar tema:", err);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab === "teacher-voting") {
      loadTeacherTopics();
    }
  }, [mainTab, loadTeacherTopics]);

  // 4. Timer Logic
  useEffect(() => {
    if (gamePhase === "playing" && !isSurrenderModalOpen) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gamePhase, currentQuestion?.questionNumber, isSurrenderModalOpen]);

  // Reset timer on new question
  useEffect(() => {
    if (gamePhase === "playing") {
      setTimeLeft(30);
    }
  }, [currentQuestion?.questionNumber, gamePhase]);

  // Handle Surrender / Finish Early with Honor
  const handleConfirmSurrender = async () => {
    if (!currentSession) return;
    try {
      setIsSurrendering(true);
      await quizService.surrenderQuiz(currentSession.sessionId);
      setIsSurrenderModalOpen(false);
      setGamePhase("gameover");
      setMascotState("love");
      loadQuizInfo();
    } catch (err) {
      alert("Gagal mengakhiri sesi kuis.");
    } finally {
      setIsSurrendering(false);
    }
  };

  // 5. Start / Resume Quiz
  const handleStartQuiz = async () => {
    try {
      setInfoLoading(true);
      setMascotState("peek");
      const res = await quizService.startQuiz();
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;

      if (data) {
        setCurrentSession({
          sessionId: data.sessionId,
          livesRemaining: data.livesRemaining,
          score: data.score,
          currentQuestionNumber: data.currentQuestionNumber,
          topic: data.topic,
        });

        if (data.firstQuestion) {
          setCurrentQuestion(data.firstQuestion);
          setGamePhase("playing");
          setMascotState("happy");
        } else {
          setGamePhase("gameover");
          setMascotState("love");
        }
        return;
      }
    } catch (err) {
      console.warn("Mulai kuis server:", err?.message || "Menggunakan mode latihan terintegrasi");
      
      // Resilient fallback: Start instant practice session
      const firstQ = PRACTICE_QUESTIONS[0];
      setCurrentSession({
        sessionId: "practice-" + Date.now(),
        livesRemaining: 3,
        score: 0,
        currentQuestionNumber: 1,
        topic: "Cyber Security Best Practices & OWASP Top 10",
      });
      setCurrentQuestion(firstQ);
      setGamePhase("playing");
      setMascotState("happy");
    } finally {
      setInfoLoading(false);
    }
  };

  // 6. Handle Answer Selection
  const handleSelectOption = async (optionIndex) => {
    if (gamePhase !== "playing" || isSubmittingAnswer || !currentSession) return;

    setSelectedOption(optionIndex);
    setIsSubmittingAnswer(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = 30 - timeLeft;

    // Check if running in local practice mode
    if (currentSession.sessionId.startsWith("practice-")) {
      const qIndex = (currentQuestion.questionNumber || 1) - 1;
      const currentPracticeQ = PRACTICE_QUESTIONS[qIndex] || PRACTICE_QUESTIONS[0];
      const isRight = optionIndex === currentPracticeQ.correctAnswerIndex;
      const newScore = isRight ? (currentSession.score || 0) + 100 : currentSession.score;
      const newLives = isRight ? currentSession.livesRemaining : Math.max(0, currentSession.livesRemaining - 1);
      const nextQ = PRACTICE_QUESTIONS[qIndex + 1] || null;
      const isGameOver = newLives <= 0 || !nextQ;

      const practiceResult = {
        isCorrect: isRight,
        correctAnswerIndex: currentPracticeQ.correctAnswerIndex,
        explanation: currentPracticeQ.explanation,
        newScore: newScore,
        livesRemaining: newLives,
        isGameOver: isGameOver,
        nextQuestion: nextQ,
      };

      setAnswerResult(practiceResult);
      setGamePhase("answered");
      setCurrentSession((prev) => ({
        ...prev,
        score: newScore,
        livesRemaining: newLives,
      }));

      if (isRight) {
        setMascotState("love");
      } else {
        setMascotState(newLives <= 0 ? "sad" : "shock");
      }

      if (isFastMode) {
        setTimeout(() => {
          if (isGameOver) {
            setGamePhase("gameover");
          } else if (nextQ) {
            setCurrentQuestion(nextQ);
            setSelectedOption(null);
            setAnswerResult(null);
            setGamePhase("playing");
            setMascotState("thinking");
          }
        }, 450);
      }

      setIsSubmittingAnswer(false);
      return;
    }

    try {
      const res = await quizService.submitAnswer(currentSession.sessionId, {
        questionNumber: currentQuestion.questionNumber,
        selectedOptionIndex: optionIndex,
        timeTakenSeconds: timeTaken,
      });

      const data = res?.data?.data !== undefined ? res.data.data : res?.data;
      setAnswerResult(data);
      setGamePhase("answered");

      setCurrentSession((prev) => ({
        ...prev,
        score: data.newScore,
        livesRemaining: data.livesRemaining,
      }));

      if (data.isCorrect) {
        setMascotState("love");
      } else {
        setMascotState(data.livesRemaining <= 0 ? "sad" : "shock");
      }

      // Fast Mode Auto-Advance (Directly advance to next question)
      if (isFastMode) {
        setTimeout(() => {
          if (data.isGameOver || data.livesRemaining <= 0) {
            setGamePhase("gameover");
            loadQuizInfo();
          } else if (data.nextQuestion) {
            setCurrentQuestion(data.nextQuestion);
            setSelectedOption(null);
            setAnswerResult(null);
            setGamePhase("playing");
            setMascotState("thinking");
          } else {
            setGamePhase("gameover");
            loadQuizInfo();
          }
        }, 450);
      }
    } catch (err) {
      console.warn("Gagal submit jawaban live, fallback lokal:", err?.message || err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // 7. Handle Time Out (Treated as wrong answer with index -1)
  const handleTimeOut = async () => {
    if (gamePhase !== "playing" || !currentSession) return;
    await handleSelectOption(-1);
  };

  // 8. Proceed to Next Question or Game Over
  const handleProceedNext = () => {
    if (!answerResult) return;

    if (answerResult.isGameOver || answerResult.livesRemaining <= 0) {
      setGamePhase("gameover");
      loadQuizInfo();
    } else if (answerResult.nextQuestion) {
      setCurrentQuestion(answerResult.nextQuestion);
      setSelectedOption(null);
      setAnswerResult(null);
      setGamePhase("playing");
      setMascotState("thinking");
    } else {
      setGamePhase("gameover");
      loadQuizInfo();
    }
  };

  // 9. Handle Propose Topic (Teachers/Admins)
  const handleProposeTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      setIsProposing(true);
      const res = await quizService.proposeTopic({
        topicName: newTopicName.trim(),
        description: newTopicDesc.trim(),
      });

      if (res?.data) {
        setToastMessage("Tema kuis berhasil diajukan!");
        setNewTopicName("");
        setNewTopicDesc("");
        loadTeacherTopics();
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal mengajukan tema.");
    } finally {
      setIsProposing(false);
    }
  };

  // 10. Handle Vote Topic
  const handleVoteTopic = async (topicId) => {
    try {
      const res = await quizService.voteTopic(topicId);
      if (res?.data) {
        loadTeacherTopics();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal memberikan suara.");
    }
  };

  // 11. Handle Reset All Quiz Data (Restart the entire flow fresh)
  const handleResetQuizData = async () => {
    if (!confirm("Apakah Anda yakin ingin mereset seluruh data kuis dan memulai ulang dari awal?")) return;
    try {
      setInfoLoading(true);
      const res = await quizService.resetAllQuizData();
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;
      alert(data?.message || "Data kuis berhasil direset dan siap dimulai ulang!");
      await loadQuizInfo();
      setGamePhase("lobby");
      setCurrentSession(null);
      setCurrentQuestion(null);
      setSelectedOption(null);
      setAnswerResult(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal mereset data kuis.");
    } finally {
      setInfoLoading(false);
    }
  };

  // 12. Handle Refresh Random Topic (Admin)
  const handleRefreshRandomTopic = async () => {
    if (!confirm("Acak topik baru hari ini dan langsung generate 30 soal baru dari AI?")) return;
    try {
      setInfoLoading(true);
      const res = await quizService.refreshRandomTopic();
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;
      alert(data?.message || "Topik baru berhasil diacak dan di-generate!");
      await loadQuizInfo();
      setGamePhase("lobby");
      setCurrentSession(null);
      setCurrentQuestion(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal mengacak topik.");
    } finally {
      setInfoLoading(false);
    }
  };

  // 13. Handle Refresh Questions (Admin)
  const handleRefreshQuestions = async () => {
    if (!confirm("Generate ulang 30 butir soal baru dari AI untuk topik saat ini?")) return;
    try {
      setInfoLoading(true);
      const res = await quizService.refreshQuestions();
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;
      alert(data?.message || "30 Soal baru berhasil di-generate dari AI!");
      await loadQuizInfo();
      setGamePhase("lobby");
      setCurrentSession(null);
      setCurrentQuestion(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal me-refresh soal.");
    } finally {
      setInfoLoading(false);
    }
  };

  // Helper Badge Color based on difficulty
  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case "easy":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Dasar
          </span>
        );
      case "medium":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Menengah
          </span>
        );
      case "hard":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Terapan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Lanjutan
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Navigation Tabs (Arena, Leaderboard, Ruang Guru) */}
        {gamePhase === "lobby" && (
          <div className="flex items-center justify-between mb-8 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setMainTab("arena")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  mainTab === "arena"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-[#2c1ee8]" />
                <span>Arena Kuis</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab("leaderboard")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  mainTab === "leaderboard"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Papan Peringkat</span>
              </button>

              {(isTeacher || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setMainTab("teacher-voting")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    mainTab === "teacher-voting"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Vote className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ruang Voting Guru</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: ARENA KUIS (LOBBY / PLAYING / ANSWERED / GAMEOVER)
        ══════════════════════════════════════════════════════════════════════ */}
        {mainTab === "arena" && (
          <AnimatePresence mode="wait">
            {/* ── 1. LOBBY SCREEN ── */}
            {gamePhase === "lobby" && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Admin Quick Toolbar */}
                {isAdmin && (
                  <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-black text-white text-[11px] font-black uppercase rounded-lg tracking-wider">
                        Admin Controls
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        Kontrol Cepat Soal & Topik Harian
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRefreshRandomTopic}
                        disabled={infoLoading}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Acak topik hari ini & generate 30 soal baru dari AI"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Acak Topik Baru</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRefreshQuestions}
                        disabled={infoLoading}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Buat ulang 30 soal AI untuk topik saat ini"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Ulang Soal</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetQuizData}
                        disabled={infoLoading}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Reset seluruh sesi, leaderboard, dan data kuis"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Semua</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hero Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4 max-w-xl text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-[#2c1ee8] border border-blue-200 text-[11px] font-bold tracking-wide">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>KUIS HARIAN REKAYASA PERANGKAT LUNAK</span>
                      </div>

                      <div className="space-y-2">
                        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                          {quizInfo?.topic || "Memuat Tema Kuis Hari Ini..."}
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                          Uji pemahaman software engineering Anda setiap hari. Bertahanlah dengan 3 nyawa, raih skor combo tertinggi, dan bersaing secara sehat di papan peringkat.
                        </p>
                      </div>

                      {/* Rules Badges */}
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 text-xs font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                          <span>3 Nyawa Bertahan</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>30 Detik per Soal</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                          <span>Skor Combo Bertingkat</span>
                        </span>
                      </div>

                      {/* CTA Button & Fast Mode Switch */}
                      <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                        <button
                          onClick={handleStartQuiz}
                          disabled={infoLoading}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2c1ee8] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>{quizInfo?.hasActiveSession ? "Lanjutkan Sesi Kuis" : "Mulai Kuis Sekarang"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsFastMode((prev) => !prev)}
                          className={`w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                            isFastMode
                              ? "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                          title="Mode Cepat: Langsung lanjut ke soal berikutnya setelah memilih jawaban"
                        >
                          <Zap className={`w-4 h-4 ${isFastMode ? "text-amber-600 fill-amber-600" : "text-slate-400"}`} />
                          <span>Mode Cepat: {isFastMode ? "Aktif" : "Nonaktif"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Mascot Card */}
                    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-lg shrink-0 text-center space-y-3">
                      <div className="inline-block cursor-pointer" onClick={() => setMascotState((s) => (s === "happy" ? "love" : "happy"))}>
                        <BloubMascot size={110} state={mascotState} badge={false} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
                          Maskot RPL
                        </span>
                        <p className="text-xs text-slate-300 font-medium">
                          "Fokus pada logika dan ketelitian!"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stat Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <span>Streak Aktif</span>
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {quizInfo?.userProfile?.currentStreak || 0} Hari
                    </p>
                    <span className="text-[11px] text-slate-500 font-medium">Rekor tertinggi: {quizInfo?.userProfile?.highestStreak || 0} hari</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <span>Total Skor XP</span>
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {quizInfo?.userProfile?.totalScore || 0}
                    </p>
                    <span className="text-[11px] text-amber-700 font-medium">Poin Akumulasi</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <span>Peserta Hari Ini</span>
                      <Users className="w-4 h-4 text-[#2c1ee8]" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {quizInfo?.totalParticipantsToday || 0}
                    </p>
                    <span className="text-[11px] text-slate-500 font-medium">Siswa & Guru RPL</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <span>Tingkat Akurasi</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {quizInfo?.userProfile?.accuracyPercentage || 0}%
                    </p>
                    <span className="text-[11px] text-slate-500 font-medium">Jawaban Tepat</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 2. ACTIVE GAMEPLAY SCREEN (PLAYING / ANSWERED) ── */}
            {(gamePhase === "playing" || gamePhase === "answered") && currentQuestion && (
              <motion.div
                key="active-quiz"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-8 relative"
              >
                {/* Top Gameplay Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
                  {/* Survival Hearts */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((heartIndex) => {
                        const isAlive = heartIndex < (currentSession?.livesRemaining || 0);
                        return (
                          <Heart
                            key={heartIndex}
                            className={`w-5 h-5 transition-all duration-300 ${
                              isAlive
                                ? "text-rose-500 fill-rose-500 scale-105"
                                : "text-slate-200 scale-90"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Question Info & Difficulty */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Soal #{currentQuestion.questionNumber}
                    </span>
                    {getDifficultyBadge(currentQuestion.difficulty)}
                  </div>

                  {/* Controls & Metrics */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Timer */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs sm:text-sm border transition-colors ${
                      timeLeft <= 5 ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}s</span>
                    </div>

                    {/* Live Score */}
                    <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#2c1ee8] font-bold text-xs sm:text-sm flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{currentSession?.score || 0} XP</span>
                    </div>

                    {/* Fast Mode Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsFastMode((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                        isFastMode
                          ? "bg-amber-500 text-white border-amber-500 shadow-amber-500/20"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                      title={isFastMode ? "Mode Cepat Aktif: Otomatis lanjut soal berikutnya" : "Mode Standar: Tampilkan penjelasan soal"}
                    >
                      <Zap className={`w-3.5 h-3.5 ${isFastMode ? "fill-white text-white" : "text-amber-500"}`} />
                      <span className="hidden sm:inline">{isFastMode ? "Fast: Aktif" : "Fast: Nonaktif"}</span>
                    </button>

                    {/* White Flag (Surrender with Honor) */}
                    <button
                      type="button"
                      onClick={() => setIsSurrenderModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      title="Kibarkan Bendera Putih (Selesai Bermain & Kunci Skor)"
                    >
                      <Flag className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600" />
                      <span className="hidden sm:inline">Kibarkan Bendera</span>
                      <span className="sm:hidden">Selesai</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug">
                    {currentQuestion.questionText}
                  </h2>

                  {/* Code Snippet Box */}
                  {currentQuestion.codeSnippet && (
                    <CodeSnippetViewer code={currentQuestion.codeSnippet} />
                  )}
                </div>

                {/* 4 Interactive Option Cards */}
                <div ref={optionsGridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentQuestion.options.map((opt, idx) => {
                    const letters = ["A", "B", "C", "D"];
                    const isSelected = selectedOption === idx;
                    const isAnswered = gamePhase === "answered";
                    const isCorrectOption = isAnswered && answerResult?.correctOptionIndex === idx;
                    const isWrongSelected = isAnswered && isSelected && !answerResult?.isCorrect;

                    let btnStyle = "bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40";
                    if (isAnswered) {
                      if (isCorrectOption) {
                        btnStyle = "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20";
                      } else if (isWrongSelected) {
                        btnStyle = "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20";
                      } else {
                        btnStyle = "bg-slate-50 text-slate-400 border-slate-200 opacity-60";
                      }
                    } else if (isSelected) {
                      btnStyle = "bg-[#2c1ee8] text-white border-[#2c1ee8]";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswered || isSubmittingAnswer}
                        className={`quiz-opt-btn p-4 sm:p-5 rounded-2xl border text-left font-semibold text-xs sm:text-sm transition-all duration-150 flex items-start gap-3.5 cursor-pointer ${btnStyle}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs transition-colors ${
                            isAnswered && (isCorrectOption || isWrongSelected)
                              ? "bg-white/20 text-white"
                              : isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {letters[idx]}
                        </span>
                        <span className="flex-1 pt-1 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card when Answered (Standard Mode) */}
                {gamePhase === "answered" && answerResult && !isFastMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-2xl border space-y-4 ${
                      answerResult.isCorrect
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-rose-50/70 border-rose-200 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {answerResult.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="font-bold text-sm text-emerald-800">
                              Jawaban Tepat! (+{answerResult.pointsAwarded} XP)
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-rose-600" />
                            <span className="font-bold text-sm text-rose-800">
                              Kurang Tepat (Tersisa {answerResult.livesRemaining} Nyawa)
                            </span>
                          </>
                        )}
                      </div>

                      {answerResult.comboMultiplier > 1 && (
                        <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 text-xs font-bold flex items-center gap-1 border border-orange-200">
                          <Flame className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
                          Combo x{answerResult.comboMultiplier}
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">Pembahasan:</p>
                      <p>{answerResult.explanation}</p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleProceedNext}
                        className="px-6 py-2.5 rounded-xl bg-[#2c1ee8] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
                      >
                        <span>{answerResult.isGameOver ? "Lihat Hasil Akhir" : "Soal Berikutnya"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── MODAL KIBARKAN BENDERA PUTIH (MENYERAH TERHORMAT) ── */}
            <AnimatePresence>
              {isSurrenderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center relative overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setIsSurrenderModalOpen(false)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="relative z-10 space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                        <Flag className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider border border-rose-200">
                          SELESAI TERHORMAT
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                          Kibarkan Bendera Putih?
                        </h3>
                        <p className="text-xs text-slate-600 font-normal leading-relaxed px-2">
                          Perjuangan Anda sudah sangat baik. Mengibarkan bendera putih akan mengakhiri sesi kuis dan <strong>mengunci skor Anda ke papan peringkat</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Rewards Locked In Card */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Skor Terkunci</span>
                        <p className="text-xl font-extrabold text-[#2c1ee8]">{currentSession?.score || 0} XP</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Soal Tercapai</span>
                        <p className="text-xl font-extrabold text-slate-800">#{currentQuestion?.questionNumber || 1}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsSurrenderModalOpen(false)}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        Lanjutkan Kuis
                      </button>

                      <button
                        type="button"
                        disabled={isSurrendering}
                        onClick={handleConfirmSurrender}
                        className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSurrendering ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengunci Skor...</span>
                          </>
                        ) : (
                          <>
                            <Flag className="w-3.5 h-3.5" />
                            <span>Kunci & Akhiri Sesi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* ── 3. GAME OVER / SUMMARY SCREEN ── */}
            {gamePhase === "gameover" && (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center space-y-6 max-w-lg mx-auto"
              >
                <div className="inline-block p-4 bg-slate-900 rounded-3xl shadow-lg border border-slate-800">
                  <BloubMascot size={110} state={mascotState} badge={false} />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wide">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    SESI KUIS SELESAI
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Performa Sangat Baik!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-normal">
                    Anda telah menyelesaikan tantangan kuis hari ini. Skor Anda telah dikunci ke papan peringkat.
                  </p>
                </div>

                {/* Score Summary Box */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Skor Sesi Ini</span>
                    <p className="text-2xl font-extrabold text-[#2c1ee8]">{currentSession?.score || 0} XP</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Soal Tercapai</span>
                    <p className="text-2xl font-extrabold text-slate-800">#{currentSession?.currentQuestionNumber || 1}</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setGamePhase("lobby");
                      loadQuizInfo();
                    }}
                    className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                  >
                    Kembali ke Lobby
                  </button>

                  <button
                    onClick={() => {
                      setMainTab("leaderboard");
                    }}
                    className="py-3 px-6 rounded-xl bg-[#2c1ee8] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Lihat Papan Peringkat</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: PAPAN PERINGKAT (LEADERBOARD)
        ══════════════════════════════════════════════════════════════════════ */}
        {mainTab === "leaderboard" && (
          <div className="space-y-6">
            {/* Header & Switch */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Papan Peringkat RPL</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  Siswa berprestasi dengan pemahaman logika dan skor tertinggi
                </p>
              </div>

              {/* Daily vs All-Time Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLeaderboardType("daily")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    leaderboardType === "daily" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardType("all-time")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    leaderboardType === "all-time" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sepanjang Masa
                </button>
              </div>
            </div>

            {/* Podium Top 3 */}
            {leaderboardData.length >= 3 && (
              <div ref={podiumRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {/* Juara 2 (Perak) */}
                <div className="podium-card order-2 md:order-1 bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-3 relative shadow-2xs">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                    <Medal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {leaderboardData[1]?.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">{leaderboardData[1]?.className || "RPL"}</p>
                  </div>
                  <div className="text-xl font-extrabold text-slate-800">
                    {leaderboardData[1]?.score} XP
                  </div>
                </div>

                {/* Juara 1 (Emas) */}
                <div className="podium-card order-1 md:order-2 bg-gradient-to-b from-amber-50/60 to-white rounded-2xl border-2 border-amber-300/80 p-6 text-center space-y-3 relative shadow-sm scale-105">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-400/20">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 truncate">
                      {leaderboardData[0]?.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{leaderboardData[0]?.className || "RPL"}</p>
                  </div>
                  <div className="text-2xl font-black text-amber-600">
                    {leaderboardData[0]?.score} XP
                  </div>
                </div>

                {/* Juara 3 (Perunggu) */}
                <div className="podium-card order-3 md:order-3 bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-3 relative shadow-2xs">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-200">
                    <Medal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {leaderboardData[2]?.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">{leaderboardData[2]?.className || "RPL"}</p>
                  </div>
                  <div className="text-xl font-extrabold text-slate-800">
                    {leaderboardData[2]?.score} XP
                  </div>
                </div>
              </div>
            )}

            {/* Full Table Leaderboard */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              {leaderboardLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                  <p>Memuat data peringkat...</p>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">Belum Ada Catatan Peringkat</p>
                  <p className="text-xs text-slate-500">Jadilah siswa pertama yang menyelesaikan kuis hari ini!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {leaderboardData.map((item, index) => {
                    const isCurrentUser = user && item.userId === user.id;

                    return (
                      <div
                        key={item.userId || index}
                        className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition ${
                          isCurrentUser ? "bg-blue-50/60 font-semibold" : "hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              index === 0
                                ? "bg-amber-400 text-white"
                                : index === 1
                                ? "bg-slate-200 text-slate-700"
                                : index === 2
                                ? "bg-orange-200 text-orange-900"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.rank || index + 1}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {item.fullName}
                              </p>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2c1ee8] text-white">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {item.className || "PPLG"} • Streak: {item.maxStreak || 0}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-sm sm:text-base text-[#2c1ee8]">
                            {item.score} XP
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Soal #{item.highestQuestionReached || 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: RUANG VOTING TEMA GURU (TEACHERS ONLY)
        ══════════════════════════════════════════════════════════════════════ */}
        {mainTab === "teacher-voting" && (isTeacher || isAdmin) && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Pengajuan & Voting Tema Harian
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  Ajukan tema materi RPL untuk kuis besok dan berikan suara pada tema terbaik
                </p>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRefreshRandomTopic}
                    disabled={infoLoading}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Acak topik hari ini & generate 30 soal baru dari AI"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Acak Topik Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshQuestions}
                    disabled={infoLoading}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Buat ulang 30 butir soal AI untuk topik aktif saat ini"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Ulang Soal</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetQuizData}
                    disabled={infoLoading}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Reset seluruh data sesi kuis, topik, dan generate ulang dari awal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Database</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form Pengajuan Tema Baru */}
            <form
              onSubmit={handleProposeTopic}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4"
            >
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#2c1ee8]" />
                Ajukan Tema Baru untuk Besok
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Tema Materi
                  </label>
                  <input
                    type="text"
                    required
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Contoh: REST API Authentication"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Ringkas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    placeholder="Contoh: JWT Token, Refresh Token, dan Middleware"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isProposing || !newTopicName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#2c1ee8] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isProposing ? "Mengajukan..." : "Ajukan Tema"}</span>
                </button>
              </div>
            </form>

            {/* List Tema & Voting Room */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Daftar Pengajuan Tema untuk Besok</span>
                <span className="text-slate-400 font-normal">Voting dibuka 18:00 – 21:00 WIB</span>
              </div>

              {topicsLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-600" />
                  Memuat daftar tema...
                </div>
              ) : topicsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-1">
                  <p>Belum ada pengajuan tema untuk besok.</p>
                  <p className="text-[11px] text-slate-400">Jika nihil, sistem akan memilih tema default secara otomatis.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topicsList.map((t) => (
                    <div key={t.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {t.topicName}
                          </h4>
                          {t.status === "Selected" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Terpilih
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          Diajukan oleh: {t.proposedByUserName || "Guru RPL"} • {t.votesCount} Suara
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVoteTopic(t.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          t.hasVotedByMe
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <Vote className="w-3.5 h-3.5" />
                        <span>{t.hasVotedByMe ? "Telah Di-Vote" : "Beri Vote"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rich Developer-Grade Code Snippet Viewer
// ─────────────────────────────────────────────────────────────────────────────
function CodeSnippetViewer({ code }) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  // Unescape literal \r\n, \n, and \r and clean up string
  const cleanCode = code
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(/^["']|["']$/g, "")
    .trim();

  const lines = cleanCode.split("\n");

  const handleCopy = () => {
    navigator.clipboard?.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#0d1117] border border-slate-800 shadow-lg overflow-hidden text-left font-mono">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-800 text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 ml-2 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            Cuplikan Kode / Analisis Logika
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer"
          title="Salin kode"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>

      {/* Code Lines with Line Numbers */}
      <div className="p-3.5 sm:p-4 overflow-x-auto max-h-96">
        <table className="w-full border-collapse font-mono text-xs sm:text-sm leading-relaxed">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition">
                <td className="w-8 pr-3.5 text-right text-slate-600 select-none font-mono font-bold text-[11px] align-top border-r border-slate-800/80">
                  {idx + 1}
                </td>
                <td className="pl-4 text-emerald-300 whitespace-pre font-mono align-top text-left selection:bg-blue-600 selection:text-white">
                  {line || " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
