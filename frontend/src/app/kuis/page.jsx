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
  Settings,
  Wand2,
  Lightbulb,
  Dice5,
  Sliders,
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
      "Mengatur routing halaman Next.js secara otomatis"
    ],
    correctAnswerIndex: 0,
    explanation: "useEffect digunakan untuk mengeksekusi side-effects setelah proses render selesai, seperti data fetching dan event subscriptions."
  },
  {
    questionNumber: 4,
    difficulty: "hard",
    questionText: "Dalam database relasional, apa tujuan utama dari Indexing pada kolom yang sering digunakan dalam query WHERE?",
    codeSnippet: null,
    options: [
      "Memperkecil ukuran file database di hard disk",
      "Mempercepat pencarian data dengan struktur B-Tree / Hash",
      "Mencegah terjadinya duplicate key pada seluruh tabel",
      "Mengenkripsi isi data agar tidak terbaca oleh umum"
    ],
    correctAnswerIndex: 1,
    explanation: "Index membuat struktur data pencarian teratur (umumnya B-Tree) sehingga query execution plan dapat melakukan index scan yang jauh lebih cepat daripada full table scan."
  },
  {
    questionNumber: 5,
    difficulty: "hard",
    questionText: "Prinsip Clean Code 'Single Responsibility Principle' (SRP) dalam SOLID menyatakan bahwa:",
    codeSnippet: null,
    options: [
      "Sebuah class hanya boleh memiliki satu alasan untuk berubah",
      "Setiap function harus diselesaikan dalam satu baris kode",
      "Aplikasi hanya boleh memiliki satu file controller utama",
      "Database hanya boleh diakses oleh satu pengguna tunggal"
    ],
    correctAnswerIndex: 0,
    explanation: "Single Responsibility Principle (SRP) menyatakan bahwa satu modul/class harus bertanggung jawab atas satu fungsionalitas dan hanya memiliki satu alasan untuk berubah."
  }
];

function KuisContent() {
  const router = useRouter();
  const { user, role } = useAuth();
  const isTeacher = role === "Guru" || role === "Teacher";
  const isAdmin = role === "Admin" || role === "admin";

  // Navigation Sub-tab: "arena" | "leaderboard" | "teacher-voting"
  const [mainTab, setMainTab] = useState("arena");

  // Game Flow State: "lobby" | "playing" | "answered" | "gameover"
  const [gamePhase, setGamePhase] = useState("lobby");

  // Quiz Info State
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

  // Admin Progress Modal State
  const [adminProgress, setAdminProgress] = useState({
    isOpen: false,
    title: "",
    stepText: "",
    percent: 0,
    isComplete: false,
  });

  // Admin Custom Topic & Settings Modal State
  const [isAdminSettingsModalOpen, setIsAdminSettingsModalOpen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [customTopicDescInput, setCustomTopicDescInput] = useState("");

  // Curated AI Suggestion Topics Pool (SMK RPL Kurikulum Merdeka)
  const AI_TOPIC_SUGGESTIONS = [
    { name: "Cyber Security & OWASP Top 10", desc: "Keamanan web, pencegahan SQL Injection, XSS, dan CSRF" },
    { name: "RESTful API & JWT Authentication", desc: "Desain endpoint REST API, Token JWT, Middleware autentikasi" },
    { name: "Git Branching & Workflow Kolaborasi", desc: "Git merge, conflict resolution, rebase, dan pull request" },
    { name: "SQL Indexing, JOIN & Query Optimization", desc: "Relasi database, normalisasi data, query tuning, dan indexing" },
    { name: "HTML5 Semantic & Modern CSS Flexbox/Grid", desc: "Struktur web semantik, tata letak responsif modern, dan UI/UX" },
    { name: "JavaScript Asynchronous & DOM Manipulation", desc: "Event handling, async/await, fetch API, dan promise" },
    { name: "OOP Inheritance & Clean Architecture", desc: "Pewarisan, polimorfisme, enkapsulasi, dan separation of concerns" },
    { name: "React Hooks, State & Component Lifecycle", desc: "useState, useEffect, custom hooks, dan performa render" },
    { name: "Clean Code & Refactoring Best Practices", desc: "Prinsip SOLID, penamaan variabel bersih, dan debugging efektif" },
    { name: "Dasar Algoritma & Struktur Data Pemula", desc: "Array, stack, queue, sorting algoritma, dan logika percabangan" },
  ];

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
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, ease: "power2.out" }
        );
      }
    }
  }, [mainTab, leaderboardData]);

  // 3. Fetch Teacher Topics List
  const loadTeacherTopics = useCallback(async () => {
    if (!isTeacher && !isAdmin) return;
    try {
      setTopicsLoading(true);
      const res = await quizService.getProposedTopics();
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;
      setTopicsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Topik guru:", err?.message || "Belum ada topik");
      setTopicsList([]);
    } finally {
      setTopicsLoading(false);
    }
  }, [isTeacher, isAdmin]);

  useEffect(() => {
    if (mainTab === "teacher-voting") {
      loadTeacherTopics();
    }
  }, [mainTab, loadTeacherTopics]);

  // 4. Timer Handling (30s per question countdown)
  useEffect(() => {
    if (gamePhase !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(30);
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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gamePhase, currentQuestion]);

  // Mascot Animation reactions to Time
  useEffect(() => {
    if (gamePhase === "playing") {
      if (timeLeft <= 5) setMascotState("shock");
      else if (timeLeft <= 10) setMascotState("thinking");
      else setMascotState("happy");
    }
  }, [timeLeft, gamePhase]);

  // 5. Handle Start / Resume Quiz
  const handleStartQuiz = async () => {
    try {
      setInfoLoading(true);
      const res = await quizService.startQuiz();
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;

      if (data && data.session && data.question) {
        setCurrentSession(data.session);
        setCurrentQuestion(data.question);
        setSelectedOption(null);
        setAnswerResult(null);
        setGamePhase("playing");
        setMascotState("happy");
      } else {
        startPracticeSession();
      }
    } catch (err) {
      console.warn("Mulai kuis server:", err?.message || "Menggunakan Practice Engine");
      startPracticeSession();
    } finally {
      setInfoLoading(false);
    }
  };

  const startPracticeSession = () => {
    const q1 = PRACTICE_QUESTIONS[0];
    setCurrentSession({
      id: "practice-session",
      score: 0,
      livesRemaining: 3,
      currentQuestionNumber: 1,
      streak: 0,
      comboMultiplier: 1,
      isPractice: true,
    });
    setCurrentQuestion(q1);
    setSelectedOption(null);
    setAnswerResult(null);
    setGamePhase("playing");
    setMascotState("happy");
  };

  // 6. Handle Answer Selection
  const handleSelectOption = async (optionIndex) => {
    if (gamePhase !== "playing" || isSubmittingAnswer) return;

    setSelectedOption(optionIndex);
    setIsSubmittingAnswer(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // If in Practice Engine
    if (currentSession?.isPractice) {
      const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
      const points = isCorrect ? 100 * (currentSession.comboMultiplier || 1) : 0;
      const nextLives = isCorrect ? currentSession.livesRemaining : currentSession.livesRemaining - 1;
      const nextStreak = isCorrect ? currentSession.streak + 1 : 0;
      const nextMultiplier = nextStreak >= 3 ? 2 : 1;
      const isOver = nextLives <= 0 || currentQuestion.questionNumber >= PRACTICE_QUESTIONS.length;

      const result = {
        isCorrect,
        correctOptionIndex: currentQuestion.correctAnswerIndex,
        explanation: currentQuestion.explanation,
        pointsAwarded: points,
        livesRemaining: nextLives,
        streak: nextStreak,
        comboMultiplier: nextMultiplier,
        totalScore: currentSession.score + points,
        isGameOver: isOver,
      };

      setAnswerResult(result);
      setCurrentSession((prev) => ({
        ...prev,
        score: prev.score + points,
        livesRemaining: nextLives,
        streak: nextStreak,
        comboMultiplier: nextMultiplier,
      }));

      setMascotState(isCorrect ? "love" : "sad");
      setGamePhase("answered");
      setIsSubmittingAnswer(false);

      if (isFastMode) {
        setTimeout(() => {
          advancePracticeQuestion(isOver, currentQuestion.questionNumber);
        }, isCorrect ? 500 : 900);
      }
      return;
    }

    // Live Server Submission
    try {
      const res = await quizService.submitAnswer(currentSession.id, optionIndex, 30 - timeLeft);
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;

      if (data) {
        setAnswerResult(data);
        setCurrentSession((prev) => ({
          ...prev,
          score: data.totalScore !== undefined ? data.totalScore : prev.score + (data.pointsAwarded || 0),
          livesRemaining: data.livesRemaining !== undefined ? data.livesRemaining : prev.livesRemaining,
          streak: data.streak || 0,
          comboMultiplier: data.comboMultiplier || 1,
        }));

        setMascotState(data.isCorrect ? "love" : "sad");
        setGamePhase("answered");

        if (isFastMode) {
          setTimeout(() => {
            if (data.isGameOver) {
              setGamePhase("gameover");
              loadQuizInfo();
            } else if (data.nextQuestion) {
              setCurrentQuestion(data.nextQuestion);
              setSelectedOption(null);
              setAnswerResult(null);
              setGamePhase("playing");
              setMascotState("happy");
            }
          }, data.isCorrect ? 500 : 900);
        }
      }
    } catch (err) {
      console.error("Gagal submit jawaban:", err);
      alert(err?.response?.data?.message || "Terjadi kesalahan saat memeriksa jawaban.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const advancePracticeQuestion = (isOver, currentNum) => {
    if (isOver) {
      setGamePhase("gameover");
    } else {
      const nextQ = PRACTICE_QUESTIONS[currentNum];
      setCurrentQuestion(nextQ);
      setSelectedOption(null);
      setAnswerResult(null);
      setGamePhase("playing");
      setMascotState("happy");
    }
  };

  // 7. Handle Timeout (0s)
  const handleTimeOut = () => {
    if (gamePhase !== "playing") return;
    handleSelectOption(-1);
  };

  // 8. Proceed to Next Question (Standard Mode)
  const handleProceedNext = () => {
    if (!answerResult) return;

    if (answerResult.isGameOver) {
      setGamePhase("gameover");
      loadQuizInfo();
      return;
    }

    if (currentSession?.isPractice) {
      advancePracticeQuestion(false, currentQuestion.questionNumber);
      return;
    }

    if (answerResult.nextQuestion) {
      setCurrentQuestion(answerResult.nextQuestion);
      setSelectedOption(null);
      setAnswerResult(null);
      setGamePhase("playing");
      setMascotState("happy");
    }
  };

  // 9. Handle White Flag Surrender
  const handleConfirmSurrender = async () => {
    if (isSurrendering) return;
    setIsSurrendering(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      if (!currentSession?.isPractice && currentSession?.id) {
        await quizService.surrenderQuiz(currentSession.id);
      }
    } catch (err) {
      console.warn("Surrender call failed:", err?.message);
    } finally {
      setIsSurrenderModalOpen(false);
      setIsSurrendering(false);
      setGamePhase("gameover");
      setMascotState("happy");
      loadQuizInfo();
    }
  };

  // 10. Handle Propose Topic (Teachers)
  const handleProposeTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim() || isProposing) return;

    try {
      setIsProposing(true);
      await quizService.proposeTopic(newTopicName.trim(), newTopicDesc.trim());
      setNewTopicName("");
      setNewTopicDesc("");
      loadTeacherTopics();
      alert("Topik materi kuis berhasil diajukan untuk besok!");
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal mengajukan topik.");
    } finally {
      setIsProposing(false);
    }
  };

  // 11. Handle Vote Topic (Teachers)
  const handleVoteTopic = async (topicId) => {
    try {
      await quizService.voteTopic(topicId);
      loadTeacherTopics();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal memberikan vote.");
    }
  };

  const runWithAdminProgress = async (title, actionFn) => {
    setAdminProgress({
      isOpen: true,
      title,
      stepText: "1. Pembersihan & Inisialisasi Database Kuis...",
      percent: 15,
      isComplete: false,
    });

    const t1 = setTimeout(() => {
      setAdminProgress((p) => ({
        ...p,
        stepText: "2. Menghubungkan ke Engine AI (Bitdeer Qwen 27B)...",
        percent: 45,
      }));
    }, 1200);

    const t2 = setTimeout(() => {
      setAdminProgress((p) => ({
        ...p,
        stepText: "3. Merancang 30 Butir Soal AI Paralel (Easy, Medium, Hard)...",
        percent: 75,
      }));
    }, 3200);

    const t3 = setTimeout(() => {
      setAdminProgress((p) => ({
        ...p,
        stepText: "4. Memvalidasi Kunci Jawaban & Menyimpan Soal Lengkap...",
        percent: 92,
      }));
    }, 5500);

    try {
      const res = await actionFn();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setAdminProgress({
        isOpen: true,
        title,
        stepText: "Sukses! 30 Soal AI telah terbit dan siap dimainkan.",
        percent: 100,
        isComplete: true,
      });

      await loadQuizInfo();
      setGamePhase("lobby");
      setCurrentSession(null);
      setCurrentQuestion(null);
      setAnswerResult(null);

      setTimeout(() => {
        setAdminProgress((p) => ({ ...p, isOpen: false }));
      }, 1200);

      return res;
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setAdminProgress((p) => ({ ...p, isOpen: false }));
      alert(err?.response?.data?.message || err?.message || "Gagal memproses aksi admin.");
    }
  };

  const handleResetQuizData = async () => {
    if (!confirm("Apakah Anda yakin ingin mereset seluruh data kuis dan memulai ulang dari awal?")) return;
    setIsAdminSettingsModalOpen(false);
    await runWithAdminProgress("Reset Seluruh Data Kuis", () => quizService.resetAllQuizData());
  };

  const handleSaveAndGenerateCustomTopic = async (e) => {
    if (e) e.preventDefault();
    const topicToUse = customTopicInput.trim() || quizInfo?.topic || "Cyber Security Best Practices";
    setIsAdminSettingsModalOpen(false);
    await runWithAdminProgress(`Generate 30 Soal AI (${topicToUse})`, () =>
      quizService.setTopicAndGenerate(topicToUse, customTopicDescInput.trim())
    );
  };

  const handlePickRandomSuggestion = () => {
    const random = AI_TOPIC_SUGGESTIONS[Math.floor(Math.random() * AI_TOPIC_SUGGESTIONS.length)];
    setCustomTopicInput(random.name);
    setCustomTopicDescInput(random.desc);
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case "easy":
        return (
          <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Dasar
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#2C1EE8] border border-blue-200">
            Menengah
          </span>
        );
      case "hard":
        return (
          <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            Terapan
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Lanjutan
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900 selection:bg-[#2C1EE8] selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-5">
        {/* Navigation Tabs (Arena, Leaderboard, Ruang Guru) */}
        {gamePhase === "lobby" && (
          <div className="bg-white border border-slate-200 rounded-none p-2 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setMainTab("arena")}
                className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 border ${
                  mainTab === "arena"
                    ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Arena Kuis</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab("leaderboard")}
                className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 border ${
                  mainTab === "leaderboard"
                    ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Papan Peringkat</span>
              </button>

              {(isTeacher || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setMainTab("teacher-voting")}
                  className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 border ${
                    mainTab === "teacher-voting"
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Vote className="w-3.5 h-3.5" />
                  <span>Ruang Voting Guru</span>
                </button>
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setCustomTopicInput(quizInfo?.topic || "");
                  setCustomTopicDescInput(quizInfo?.topicDescription || "");
                  setIsAdminSettingsModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-none font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Pengaturan AI</span>
              </button>
            )}
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Hero / Main Quiz Info Card */}
                <div className="bg-white rounded-none border border-slate-200 shadow-xs p-6 sm:p-8 relative text-left">
                  <div className="space-y-3.5 max-w-2xl text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none bg-blue-50 text-[#2C1EE8] border border-blue-200 text-[10.5px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Kuis Harian Rekayasa Perangkat Lunak</span>
                    </div>

                    <div className="space-y-1.5">
                      <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug uppercase">
                        {quizInfo?.topic || "Memuat Tema Kuis Hari Ini..."}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                        Uji pemahaman software engineering Anda setiap hari. Bertahanlah dengan 3 nyawa, raih skor combo tertinggi, dan bersaing secara sehat di papan peringkat.
                      </p>
                    </div>

                    {/* Rules Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-none text-[11px]">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                        <span>3 Nyawa</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-none text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>30 Detik / Soal</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-none text-[11px]">
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                        <span>Combo XP</span>
                      </span>
                    </div>

                    {/* CTA Button & Fast Mode Switch */}
                    <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        onClick={handleStartQuiz}
                        disabled={infoLoading}
                        className="w-full sm:w-auto px-7 py-2.5 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{quizInfo?.hasActiveSession ? "Lanjutkan Sesi Kuis" : "Mulai Kuis Sekarang"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsFastMode((prev) => !prev)}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-none font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isFastMode
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                        title="Mode Cepat: Langsung lanjut ke soal berikutnya setelah memilih jawaban"
                      >
                        <Zap className={`w-3.5 h-3.5 ${isFastMode ? "text-amber-600 fill-amber-600" : "text-slate-400"}`} />
                        <span>Mode Cepat: {isFastMode ? "Aktif" : "Nonaktif"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stat Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-left">
                  <div className="bg-white p-3 sm:p-4 rounded-none border border-slate-200 shadow-xs space-y-0.5 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-slate-400 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider">
                      <span className="truncate">Streak</span>
                      <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 shrink-0" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-slate-900 font-mono truncate">
                      {quizInfo?.userProfile?.currentStreak || 0} Hari
                    </p>
                    <span className="text-[9.5px] text-slate-500 font-medium block truncate">Rekor: {quizInfo?.userProfile?.highestStreak || 0} hari</span>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-none border border-slate-200 shadow-xs space-y-0.5 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-slate-400 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider">
                      <span className="truncate">Skor XP</span>
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-[#2C1EE8] font-mono truncate">
                      {quizInfo?.userProfile?.totalScore || 0}
                    </p>
                    <span className="text-[9.5px] text-slate-500 font-medium block truncate">Poin Akumulasi</span>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-none border border-slate-200 shadow-xs space-y-0.5 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-slate-400 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider">
                      <span className="truncate">Peserta</span>
                      <Users className="w-3.5 h-3.5 text-[#2C1EE8] shrink-0" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-slate-900 font-mono truncate">
                      {quizInfo?.totalParticipantsToday || 0}
                    </p>
                    <span className="text-[9.5px] text-slate-500 font-medium block truncate">Siswa & Guru</span>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-none border border-slate-200 shadow-xs space-y-0.5 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-slate-400 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider">
                      <span className="truncate">Akurasi</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-slate-900 font-mono truncate">
                      {quizInfo?.userProfile?.accuracyPercentage || 0}%
                    </p>
                    <span className="text-[9.5px] text-slate-500 font-medium block truncate">Tepat Menjawab</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 2. ACTIVE GAMEPLAY SCREEN (PLAYING / ANSWERED) ── */}
            {(gamePhase === "playing" || gamePhase === "answered") && currentQuestion && (
              <motion.div
                key="active-quiz"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-none border border-slate-200 shadow-xs p-4 sm:p-7 space-y-4 sm:space-y-6 relative text-left overflow-hidden"
              >
                {/* Top Gameplay Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-200">
                  {/* Survival Hearts & Question Info */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((heartIndex) => {
                        const isAlive = heartIndex < (currentSession?.livesRemaining || 0);
                        return (
                          <Heart
                            key={heartIndex}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${
                              isAlive
                                ? "text-rose-500 fill-rose-500"
                                : "text-slate-200"
                            }`}
                          />
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase font-mono">
                        #{currentQuestion.questionNumber}
                      </span>
                      {getDifficultyBadge(currentQuestion.difficulty)}
                    </div>
                  </div>

                  {/* Controls & Metrics */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {/* Timer */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-none font-mono font-bold text-[11px] sm:text-xs border transition-colors ${
                      timeLeft <= 5 ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{timeLeft}s</span>
                    </div>

                    {/* Live Score */}
                    <div className="px-2 py-1 rounded-none bg-blue-50 border border-blue-200 text-[#2C1EE8] font-bold text-[11px] sm:text-xs font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{currentSession?.score || 0} XP</span>
                    </div>

                    {/* Fast Mode Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsFastMode((prev) => !prev)}
                      className={`px-2 py-1 rounded-none font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer border ${
                        isFastMode
                          ? "bg-amber-500 text-slate-900 border-amber-500"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                      title={isFastMode ? "Mode Cepat Aktif: Otomatis lanjut soal berikutnya" : "Mode Standar: Tampilkan penjelasan soal"}
                    >
                      <Zap className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFastMode ? "fill-slate-900" : "text-amber-500"}`} />
                      <span>{isFastMode ? "Fast" : "Normal"}</span>
                    </button>

                    {/* White Flag (Surrender with Honor) */}
                    <button
                      type="button"
                      onClick={() => setIsSurrenderModalOpen(true)}
                      className="px-2 py-1 rounded-none bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                      title="Kibarkan Bendera Putih (Selesai Bermain & Kunci Skor)"
                    >
                      <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Kibarkan Bendera</span>
                      <span className="sm:hidden">Selesai</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-3 min-w-0">
                  <h2 className="text-sm sm:text-xl font-bold text-slate-900 leading-snug break-words">
                    {currentQuestion.questionText}
                  </h2>

                  {/* Code Snippet Box */}
                  {currentQuestion.codeSnippet && (
                    <CodeSnippetViewer code={currentQuestion.codeSnippet} />
                  )}
                </div>

                {/* 4 Interactive Option Cards */}
                <div ref={optionsGridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
                  {currentQuestion.options.map((opt, idx) => {
                    const letters = ["A", "B", "C", "D"];
                    const isSelected = selectedOption === idx;
                    const isAnswered = gamePhase === "answered";
                    const isCorrectOption = isAnswered && answerResult?.correctOptionIndex === idx;
                    const isWrongSelected = isAnswered && isSelected && !answerResult?.isCorrect;

                    let btnStyle = "bg-white text-slate-800 border-slate-200 hover:border-[#2C1EE8] hover:bg-slate-50/50";
                    if (isAnswered) {
                      if (isCorrectOption) {
                        btnStyle = "bg-emerald-600 text-white border-emerald-600";
                      } else if (isWrongSelected) {
                        btnStyle = "bg-rose-600 text-white border-rose-600";
                      } else {
                        btnStyle = "bg-slate-50 text-slate-400 border-slate-200 opacity-60";
                      }
                    } else if (isSelected) {
                      btnStyle = "bg-[#2C1EE8] text-white border-[#2C1EE8]";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswered || isSubmittingAnswer}
                        className={`quiz-opt-btn p-3 sm:p-4 rounded-none border text-left font-semibold text-xs sm:text-sm transition-colors flex items-start gap-2.5 sm:gap-3 cursor-pointer min-w-0 ${btnStyle}`}
                      >
                        <span
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-none flex items-center justify-center shrink-0 font-mono font-bold text-[11px] sm:text-xs ${
                            isAnswered && (isCorrectOption || isWrongSelected)
                              ? "bg-white/20 text-white"
                              : isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {letters[idx]}
                        </span>
                        <span className="flex-1 pt-0.5 leading-relaxed break-words min-w-0">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card when Answered (Standard Mode) */}
                {gamePhase === "answered" && answerResult && !isFastMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-none border space-y-3 ${
                      answerResult.isCorrect
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-rose-50/70 border-rose-200 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {answerResult.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-xs sm:text-sm text-emerald-800 uppercase">
                              Jawaban Tepat! (+{answerResult.pointsAwarded} XP)
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span className="font-bold text-xs sm:text-sm text-rose-800 uppercase">
                              Kurang Tepat (Tersisa {answerResult.livesRemaining} Nyawa)
                            </span>
                          </>
                        )}
                      </div>

                      {answerResult.comboMultiplier > 1 && (
                        <span className="px-2 py-0.5 rounded-none bg-orange-100 text-orange-800 text-[10px] font-bold uppercase flex items-center gap-1 border border-orange-200">
                          <Flame className="w-3 h-3 fill-orange-600 text-orange-600" />
                          Combo x{answerResult.comboMultiplier}
                        </span>
                      )}
                    </div>

                    <div className="text-xs leading-relaxed text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900 uppercase">Pembahasan:</p>
                      <p>{answerResult.explanation}</p>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={handleProceedNext}
                        className="px-5 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{answerResult.isGameOver ? "Lihat Hasil Akhir" : "Soal Berikutnya"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── MODAL KIBARKAN BENDERA PUTIH (MENYERAH TERHORMAT) ── */}
            <AnimatePresence>
              {isSurrenderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white w-full max-w-md rounded-none border border-slate-200 shadow-xl p-5 sm:p-6 space-y-4 text-center relative text-left"
                  >
                    <button
                      type="button"
                      onClick={() => setIsSurrenderModalOpen(false)}
                      className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-2 text-center">
                      <div className="w-12 h-12 mx-auto rounded-none bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                        <Flag className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider border border-rose-200">
                          SELESAI TERHORMAT
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 uppercase">
                          Kibarkan Bendera Putih?
                        </h3>
                        <p className="text-xs text-slate-600 font-normal leading-relaxed">
                          Perjuangan Anda sudah sangat baik. Mengibarkan bendera putih akan mengakhiri sesi kuis dan <strong>mengunci skor Anda ke papan peringkat</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Rewards Locked In Card */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-none bg-slate-50 border border-slate-200 text-left">
                      <div>
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Skor Terkunci</span>
                        <p className="text-lg font-bold text-[#2C1EE8] font-mono">{currentSession?.score || 0} XP</p>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Soal Tercapai</span>
                        <p className="text-lg font-bold text-slate-900 font-mono">#{currentQuestion?.questionNumber || 1}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsSurrenderModalOpen(false)}
                        className="flex-1 py-2 px-3 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Lanjutkan Kuis
                      </button>

                      <button
                        type="button"
                        disabled={isSurrendering}
                        onClick={handleConfirmSurrender}
                        className="flex-1 py-2 px-3 rounded-none bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSurrendering ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengunci...</span>
                          </>
                        ) : (
                          <>
                            <Flag className="w-3.5 h-3.5" />
                            <span>Kunci Skor</span>
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-none border border-slate-200 shadow-xs p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto"
              >
                <div className="inline-block p-4 bg-slate-900 rounded-none border border-slate-800 pointer-events-none select-none">
                  <BloubMascot size={90} state={mascotState} badge={false} />
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none bg-amber-50 text-amber-800 border border-amber-200 text-[10.5px] font-bold uppercase tracking-wider">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    Sesi Kuis Selesai
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 uppercase">
                    Performa Sangat Baik!
                  </h2>
                  <p className="text-xs text-slate-600 font-normal">
                    Anda telah menyelesaikan tantangan kuis hari ini. Skor Anda telah dikunci ke papan peringkat.
                  </p>
                </div>

                {/* Score Summary Box */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-none bg-slate-50 border border-slate-200 text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Skor Sesi Ini</span>
                    <p className="text-xl font-bold text-[#2C1EE8] font-mono">{currentSession?.score || 0} XP</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Soal Tercapai</span>
                    <p className="text-xl font-bold text-slate-900 font-mono">#{currentSession?.currentQuestionNumber || 1}</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => {
                      setGamePhase("lobby");
                      loadQuizInfo();
                    }}
                    className="py-2.5 px-4 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Kembali ke Lobby
                  </button>

                  <button
                    onClick={() => {
                      setMainTab("leaderboard");
                    }}
                    className="py-2.5 px-5 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5" />
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
          <div className="space-y-4 text-left">
            {/* Header & Switch */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-none shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase">
                  {leaderboardType === "all-time" ? "Hall of Fame RPL" : "Papan Peringkat Harian"}
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  {leaderboardType === "all-time"
                    ? "Catatan kehormatan siswa dengan akumulasi skor XP tertinggi sepanjang masa"
                    : "Siswa berprestasi dengan pemahaman logika dan skor tertinggi hari ini"}
                </p>
              </div>

              {/* Daily vs Hall of Fame Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-none border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLeaderboardType("daily")}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    leaderboardType === "daily" ? "bg-[#2C1EE8] text-white border-[#2C1EE8]" : "text-slate-700 hover:bg-slate-200 border-transparent"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardType("all-time")}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1.5 ${
                    leaderboardType === "all-time" ? "bg-[#2C1EE8] text-white border-[#2C1EE8]" : "text-slate-700 hover:bg-slate-200 border-transparent"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Hall of Fame</span>
                </button>
              </div>
            </div>

            {/* Podium Top 3 */}
            {leaderboardData.length >= 3 && (
              <div ref={podiumRef} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {/* Juara 2 (Perak) */}
                <div className="podium-card order-2 md:order-1 bg-white rounded-none border border-slate-200 p-4 text-center space-y-2 relative shadow-2xs">
                  <div className="w-8 h-8 mx-auto rounded-none bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                    <Medal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {leaderboardData[1]?.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">{leaderboardData[1]?.className || "RPL"}</p>
                  </div>
                  <div className="text-lg font-bold text-slate-800 font-mono">
                    {leaderboardData[1]?.score} XP
                  </div>
                </div>

                {/* Juara 1 (Emas) */}
                <div className="podium-card order-1 md:order-2 bg-white rounded-none border-2 border-[#2C1EE8] p-5 text-center space-y-2 relative shadow-xs">
                  <div className="w-9 h-9 mx-auto rounded-none bg-amber-400 text-white flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                      {leaderboardData[0]?.fullName}
                    </h3>
                    <p className="text-xs text-[#2C1EE8] font-mono font-bold">{leaderboardData[0]?.className || "RPL"}</p>
                  </div>
                  <div className="text-xl font-bold text-[#2C1EE8] font-mono">
                    {leaderboardData[0]?.score} XP
                  </div>
                </div>

                {/* Juara 3 (Perunggu) */}
                <div className="podium-card order-3 md:order-3 bg-white rounded-none border border-slate-200 p-4 text-center space-y-2 relative shadow-2xs">
                  <div className="w-8 h-8 mx-auto rounded-none bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-200">
                    <Medal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {leaderboardData[2]?.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">{leaderboardData[2]?.className || "RPL"}</p>
                  </div>
                  <div className="text-lg font-bold text-slate-800 font-mono">
                    {leaderboardData[2]?.score} XP
                  </div>
                </div>
              </div>
            )}

            {/* Full Table Leaderboard */}
            <div className="bg-white rounded-none border border-slate-200 shadow-xs overflow-hidden">
              {leaderboardLoading ? (
                <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-wider space-y-2">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#2C1EE8]" />
                  <p>Memuat data peringkat...</p>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="p-10 text-center space-y-1">
                  <Trophy className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="font-bold text-xs sm:text-sm text-slate-700 uppercase">Belum Ada Catatan Peringkat</p>
                  <p className="text-xs text-slate-400">Jadilah siswa pertama yang menyelesaikan kuis hari ini!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {leaderboardData.map((item, index) => {
                    const isCurrentUser = user && item.userId === user.id;

                    return (
                      <div
                        key={item.userId || index}
                        className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                          isCurrentUser ? "bg-blue-50/70 font-semibold" : "hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-none flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              index === 0
                                ? "bg-amber-400 text-slate-900"
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
                                <span className="px-1.5 py-0.2 rounded-none text-[9.5px] font-bold uppercase bg-[#2C1EE8] text-white">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono truncate">
                              {item.className || "PPLG"} · Streak: {item.maxStreak || 0}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-xs sm:text-sm text-[#2C1EE8] font-mono">
                            {item.score} XP
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
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
          <div className="space-y-4 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-none shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase">
                  Pengajuan & Voting Tema Harian
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  Ajukan tema materi RPL untuk kuis besok dan berikan suara pada tema terbaik
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomTopicInput(quizInfo?.topic || "");
                    setCustomTopicDescInput(quizInfo?.topicDescription || "");
                    setIsAdminSettingsModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-none font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pengaturan AI</span>
                </button>
              )}
            </div>

            {/* Form Pengajuan Tema Baru */}
            <form
              onSubmit={handleProposeTopic}
              className="bg-white p-4 sm:p-5 rounded-none border border-slate-200 shadow-xs space-y-3"
            >
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#2C1EE8]" />
                Ajukan Tema Baru untuk Besok
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Tema Materi
                  </label>
                  <input
                    type="text"
                    required
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Contoh: REST API Authentication"
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 text-xs font-semibold focus:border-[#2C1EE8] focus:bg-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deskripsi Ringkas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    placeholder="Contoh: JWT Token, Refresh Token, dan Middleware"
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 text-xs font-semibold focus:border-[#2C1EE8] focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isProposing || !newTopicName.trim()}
                  className="px-5 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isProposing ? "Mengajukan..." : "Ajukan Tema"}</span>
                </button>
              </div>
            </form>

            {/* List Tema & Voting Room */}
            <div className="bg-white rounded-none border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span>Daftar Pengajuan Tema untuk Besok</span>
                <span className="text-slate-400 font-normal font-mono">Voting 18:00 – 21:00 WIB</span>
              </div>

              {topicsLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5 text-[#2C1EE8]" />
                  Memuat daftar tema...
                </div>
              ) : topicsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-1">
                  <p>Belum ada pengajuan tema untuk besok.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topicsList.map((t) => (
                    <div key={t.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {t.topicName}
                          </h4>
                          {t.status === "Selected" && (
                            <span className="px-1.5 py-0.2 rounded-none text-[9.5px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Terpilih
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 font-normal">{t.description}</p>
                        )}
                        <p className="text-[10.5px] text-slate-400 font-mono">
                          Diajukan oleh: {t.proposedByUserName || "Guru RPL"} · {t.votesCount} Suara
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVoteTopic(t.id)}
                        className={`px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                          t.hasVotedByMe
                            ? "bg-emerald-600 text-white"
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

        {/* ── Admin Action Progress Modal ── */}
        <AnimatePresence>
          {adminProgress.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-md bg-white border border-slate-200 rounded-none p-5 sm:p-6 shadow-xl space-y-4 text-left"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-none bg-[#2C1EE8] flex items-center justify-center text-white font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight uppercase">
                        {adminProgress.title}
                      </h3>
                      <span className="text-[10px] font-bold text-[#2C1EE8] uppercase tracking-wider font-mono">
                        Bitdeer AI Engine
                      </span>
                    </div>
                  </div>

                  <span className="text-base font-bold text-slate-900 font-mono">
                    {adminProgress.percent}%
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-none overflow-hidden relative">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${adminProgress.percent}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="h-full bg-[#2C1EE8] rounded-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                      {adminProgress.isComplete ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-[#2C1EE8] animate-spin" />
                      )}
                      {adminProgress.stepText}
                    </span>
                    <span className="font-mono text-slate-400">
                      {adminProgress.percent < 100 ? "Memproses..." : "Selesai!"}
                    </span>
                  </div>
                </div>

                {/* Step Breakdown Cards */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-1.5 text-xs">
                  <div className={`flex items-center justify-between ${adminProgress.percent >= 25 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono">1.</span>
                      Pembersihan Database
                    </span>
                    {adminProgress.percent >= 25 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>

                  <div className={`flex items-center justify-between ${adminProgress.percent >= 60 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono">2.</span>
                      Inisialisasi Tema AI
                    </span>
                    {adminProgress.percent >= 60 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>

                  <div className={`flex items-center justify-between ${adminProgress.percent >= 85 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono">3.</span>
                      Generate 30 Soal AI
                    </span>
                    {adminProgress.percent >= 85 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>

                  <div className={`flex items-center justify-between ${adminProgress.percent >= 100 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono">4.</span>
                      Simpan ke Database
                    </span>
                    {adminProgress.percent >= 100 && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Admin Settings & AI Topic Generator Modal ── */}
        <AnimatePresence>
          {isAdminSettingsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-2xl bg-white border border-slate-200 rounded-none p-5 sm:p-7 shadow-xl space-y-4 text-left my-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-none bg-[#2C1EE8] flex items-center justify-center text-white font-bold">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 uppercase">
                        Pengaturan & Generator Kuis Harian
                      </h3>
                      <p className="text-xs text-slate-500 font-normal">
                        Ketik topik mandiri, pilih rekomendasi kurikulum AI, dan buat 30 soal otomatis
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAdminSettingsModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Input Topik */}
                <form onSubmit={handleSaveAndGenerateCustomTopic} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Topik Materi Kuis (Bebas / Kustom)
                    </label>
                    <input
                      type="text"
                      required
                      value={customTopicInput}
                      onChange={(e) => setCustomTopicInput(e.target.value)}
                      placeholder="Contoh: Next.js Server Actions, PostgreSQL Indexing, Docker..."
                      className="w-full px-3.5 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#2C1EE8] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Deskripsi Ringkas Materi (Opsional)
                    </label>
                    <input
                      type="text"
                      value={customTopicDescInput}
                      onChange={(e) => setCustomTopicDescInput(e.target.value)}
                      placeholder="Contoh: Pengujian pemahaman sintaks, logika, dan analisis error..."
                      className="w-full px-3.5 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-700 outline-none focus:border-[#2C1EE8] transition"
                    />
                  </div>

                  {/* AI Smart Suggestions Section */}
                  <div className="p-3.5 rounded-none bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#2C1EE8]" />
                        Saran Topik Unggulan AI:
                      </span>

                      <button
                        type="button"
                        onClick={handlePickRandomSuggestion}
                        className="px-2.5 py-1 rounded-none bg-blue-50 text-[#2C1EE8] border border-blue-200 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                        title="Pilihkan 1 topik rekomendasi secara acak"
                      >
                        <Dice5 className="w-3 h-3" />
                        <span>Acak Saran AI</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {AI_TOPIC_SUGGESTIONS.map((item, idx) => {
                        const isSelected = customTopicInput.toLowerCase() === item.name.toLowerCase();
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCustomTopicInput(item.name);
                              setCustomTopicDescInput(item.desc);
                            }}
                            className={`px-2.5 py-1 rounded-none text-xs font-medium transition-colors cursor-pointer text-left border ${
                              isSelected
                                ? "bg-[#2C1EE8] text-white border-[#2C1EE8] font-bold"
                                : "bg-white text-slate-700 border-slate-200 hover:border-[#2C1EE8]"
                            }`}
                          >
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="pt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleResetQuizData}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-none bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Reset seluruh riwayat sesi, leaderboard, dan data kuis"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Database Kuis</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAdminSettingsModalOpen(false)}
                        className="px-4 py-2 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Batal
                      </button>

                      <button
                        type="submit"
                        disabled={!customTopicInput.trim()}
                        className="px-5 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Buat 30 Soal AI</span>
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
    <div className="rounded-none bg-[#0d1117] border border-slate-800 shadow-xs overflow-hidden text-left font-mono">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-slate-800 text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-none bg-[#ff5f56]" />
            <span className="w-2 h-2 rounded-none bg-[#ffbd2e]" />
            <span className="w-2 h-2 rounded-none bg-[#27c93f]" />
          </div>
          <span className="text-[10.5px] font-bold text-slate-400 ml-1.5 flex items-center gap-1">
            <Code2 className="w-3 h-3 text-blue-400" />
            Cuplikan Kode / Analisis Logika
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-2 py-0.5 rounded-none bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
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
      <div className="p-3 sm:p-4 overflow-x-auto max-h-96">
        <table className="w-full border-collapse font-mono text-xs sm:text-sm leading-relaxed">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="w-7 pr-3 text-right text-slate-600 select-none font-mono font-bold text-[10.5px] align-top border-r border-slate-800/80">
                  {idx + 1}
                </td>
                <td className="pl-3.5 text-emerald-300 whitespace-pre font-mono align-top text-left selection:bg-[#2C1EE8] selection:text-white">
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
