"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import quizService from "@/services/quizService";
import {
  Zap,
  RefreshCw,
  Sparkles,
  RotateCcw,
  Plus,
  ThumbsUp,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Send,
  Trash2,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Activity,
  Crown,
  TrendingUp,
  Sliders,
  Cpu,
  Eye,
  FileCode2,
  Copy,
  Check,
  X,
  Code2,
  Filter,
} from "lucide-react";

const AI_MODELS = [
  {
    id: "bitdeer-deepseek",
    name: "Bitdeer AI — DeepSeek V4 Flash",
    provider: "bitdeer",
    model: "deepseek-ai/DeepSeek-V4-Flash",
    badge: "Rekomendasi Utama",
    desc: "Kualitas penalaran tinggi, pemahaman kurikulum SMK mutakhir, dan responsif."
  },
  {
    id: "bitdeer-qwen",
    name: "Bitdeer AI — Qwen 27B",
    provider: "bitdeer",
    model: "Qwen/Qwen3.8-27B",
    badge: "Reasoning CoT",
    desc: "Pemahaman logika algoritma mendalam dengan penalaran bertingkat."
  },
  {
    id: "groq-llama8b",
    name: "Groq — Llama 3.1 8B Instant",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    badge: "Super Kilat",
    desc: "Kecepatan ekstra cepat (<1s), format JSON presisi hemat token."
  },
  {
    id: "groq-llama70b",
    name: "Groq — Llama 3.3 70B Versatile",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    badge: "Akurasi Tinggi",
    desc: "Akurasi tinggi untuk materi analisis arsitektur kejuruan sulit."
  }
];

const CURRICULUM_SUGGESTIONS = [
  { name: "Clean Code & Refactoring Best Practices", desc: "Prinsip SOLID, penamaan variabel bersih, dan debugging efektif" },
  { name: "Cyber Security & OWASP Top 10", desc: "Keamanan web, SQL Injection, XSS, CSRF, dan sanitasi input" },
  { name: "RESTful API & JWT Authentication", desc: "Endpoint REST, status code HTTP, Token JWT, dan middleware auth" },
  { name: "SQL Indexing, JOIN & Query Optimization", desc: "Relasi database, normalisasi data, query tuning, dan indexing" },
  { name: "Git Branching & Workflow Kolaborasi", desc: "Git merge, conflict resolution, rebase, pull request, dan commit" },
  { name: "React Hooks, State & Component Lifecycle", desc: "useState, useEffect, custom hooks, dan render lifecycle" },
  { name: "OOP Inheritance & Clean Architecture", desc: "Pewarisan, polimorfisme, enkapsulasi, dan separation of concerns" },
  { name: "HTML5 Semantic & Modern CSS Flexbox/Grid", desc: "Struktur web semantik, tata letak responsif modern, dan UI/UX" },
];

export default function AdminQuizTab() {
  const [todayInfo, setTodayInfo] = useState(null);
  const [topics, setTopics] = useState([]);
  const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
  const [hallOfFame, setHallOfFame] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Model Selection State (Default: Groq Llama 3.1 8B Instant for ultra-fast generation)
  const [selectedModel, setSelectedModel] = useState("llama-3.1-8b-instant");
  const [selectedProvider, setSelectedProvider] = useState("groq");

  // Live Questions Inspector Modal States
  const [liveQuestions, setLiveQuestions] = useState([]);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [filterDiff, setFilterDiff] = useState("all");
  const [copiedJson, setCopiedJson] = useState(false);

  // Custom Topic Form
  const [customTopicName, setCustomTopicName] = useState("");
  const [customTopicDesc, setCustomTopicDesc] = useState("");

  // New Proposal Form
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");

  // Action status state
  const [actionProgress, setActionProgress] = useState({
    active: false,
    label: "",
    progress: 0,
  });
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const loadAllQuizData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [todayRes, topicsRes, dailyRes, allTimeRes] = await Promise.allSettled([
        quizService.getTodayInfo(),
        quizService.getTopics(),
        quizService.getDailyLeaderboard(null, 20),
        quizService.getAllTimeLeaderboard(20),
      ]);

      if (todayRes.status === "fulfilled") {
        setTodayInfo(todayRes.value?.data?.data || todayRes.value?.data || todayRes.value);
      }
      if (topicsRes.status === "fulfilled") {
        const topicsData = topicsRes.value?.data?.data || topicsRes.value?.data || topicsRes.value || [];
        setTopics(Array.isArray(topicsData) ? topicsData : []);
      }
      if (dailyRes.status === "fulfilled") {
        const dailyData = dailyRes.value?.data?.data || dailyRes.value?.data || dailyRes.value || [];
        setDailyLeaderboard(Array.isArray(dailyData) ? dailyData : []);
      }
      if (allTimeRes.status === "fulfilled") {
        const allTimeData = allTimeRes.value?.data?.data || allTimeRes.value?.data || allTimeRes.value || [];
        setHallOfFame(Array.isArray(allTimeData) ? allTimeData : []);
      }
    } catch (err) {
      console.error("Failed to load quiz admin data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllQuizData();
  }, [loadAllQuizData]);

  // Real-time polling progress helper for AI Generation
  const runWithProgress = async (label, actionFn) => {
    setActionProgress({ active: true, label, progress: 5 });
    setFeedback({ type: "", text: "" });

    // Start polling generation status every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await quizService.getGenerationStatus();
        const status = statusRes?.data || statusRes;
        if (status?.inProgress && status.total > 0) {
          const pct = Math.round((status.completed / status.total) * 85) + 5; // 5–90%
          setActionProgress({ active: true, label, progress: pct });
        }
      } catch {
        // Polling errors are non-fatal, keep showing last known progress
      }
    }, 2000);

    try {
      const res = await actionFn();
      clearInterval(pollInterval);
      setActionProgress({ active: true, label, progress: 100 });
      setTimeout(() => {
        setActionProgress({ active: false, label: "", progress: 0 });
      }, 800);

      const data = res?.data || res;
      const msg = data?.message || "Operasi kuis berhasil dieksekusi.";
      setFeedback({ type: "success", text: msg });

      // Automatically open Live Questions modal if questions were returned
      if (data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setLiveQuestions(data.questions);
        setIsLiveModalOpen(true);
      }

      await loadAllQuizData();
    } catch (err) {
      clearInterval(pollInterval);
      setActionProgress({ active: false, label: "", progress: 0 });
      const errText = err?.response?.data?.message || err?.message || "Gagal memproses aksi kuis.";
      setFeedback({ type: "error", text: errText });
    }
  };

  // 1. Acak Topik Baru & Generate 30 Soal
  const handleRefreshRandomTopic = () => {
    runWithProgress(`Mengacak Topik & Men-generate 30 Soal AI (${selectedModel})`, () =>
      quizService.refreshRandomTopic(selectedModel, selectedProvider)
    );
  };

  // 2. Refresh Soal dengan Topik yang Sama
  const handleRefreshQuestions = () => {
    runWithProgress(`Men-generate Ulang 30 Soal AI (${selectedModel})`, () =>
      quizService.refreshQuestions(selectedModel, selectedProvider)
    );
  };

  // 3. Set Topik Kustom & Generate Soal
  const handleSetCustomTopic = (e) => {
    if (e) e.preventDefault();
    if (!customTopicName.trim()) {
      setFeedback({ type: "error", text: "Nama topik kuis wajib diisi." });
      return;
    }

    runWithProgress(`Menerapkan Topik "${customTopicName}" & Generate 30 Soal (${selectedModel})`, () =>
      quizService.setTopicAndGenerate(customTopicName.trim(), customTopicDesc.trim(), selectedModel, selectedProvider)
    );
  };

  // 4. Reset Seluruh Database Kuis
  const handleResetAllQuizData = () => {
    if (
      !window.confirm(
        "PERINGATAN: Apakah Anda yakin ingin me-reset seluruh data kuis harian, sesi aktif, dan skor leaderboard?"
      )
    )
      return;

    runWithProgress("Mereset Seluruh Database & Generate Soal Awal", () =>
      quizService.resetAllQuizData()
    );
  };

  // 5. Ajukan Usulan Tema Baru
  const handleProposeTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      await quizService.proposeTopic({
        topicName: newTopicName.trim(),
        description: newTopicDesc.trim(),
      });
      setNewTopicName("");
      setNewTopicDesc("");
      setFeedback({ type: "success", text: "Usulan tema kuis berhasil ditambahkan." });
      const tRes = await quizService.getTopics();
      setTopics(tRes?.data?.data || tRes?.data || []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Gagal mengajukan tema.",
      });
    }
  };

  // 6. Vote Tema
  const handleVoteTopic = async (topicId) => {
    try {
      await quizService.voteTopic(topicId);
      const tRes = await quizService.getTopics();
      setTopics(tRes?.data?.data || tRes?.data || []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Gagal memberikan vote.",
      });
    }
  };

  // 7. Finalisasi Tema Menjadi Kuis Aktif
  const handleFinalizeTopic = () => {
    runWithProgress("Memfinalisasi Tema Terpilih & Menyiapkan Soal Kuis", () =>
      quizService.finalizeTopic()
    );
  };

  // Copy all questions to clipboard
  const handleCopyAllQuestionsJson = () => {
    if (!liveQuestions || liveQuestions.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(liveQuestions, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const todayTopic = todayInfo?.topic || todayInfo?.currentTopic || todayInfo?.todayTopic || "Belum Ditentukan";
  const todayTopicDesc = todayInfo?.description || todayInfo?.topicDescription || "Kuis harian belum diinisialisasi.";
  const totalQuestions = todayInfo?.totalQuestions || 30;
  const participantCount = todayInfo?.participantCount || dailyLeaderboard.length || 0;

  // ─── Kalkulasi Rekomendasi Vote & Persentase Terbesar ───
  const totalVotes = topics.reduce(
    (sum, t) => sum + (t.voteCount || t.votes || t.votesCount || 0),
    0
  );

  const topicsWithStats = topics
    .map((t) => {
      const vCount = t.voteCount || t.votes || t.votesCount || 0;
      const percentage = totalVotes > 0 ? Math.round((vCount / totalVotes) * 100) : 0;
      return {
        ...t,
        voteCount: vCount,
        percentage,
      };
    })
    .sort((a, b) => b.voteCount - a.voteCount);

  const topVotedTopic = topicsWithStats.length > 0 ? topicsWithStats[0] : null;

  return (
    <div className="space-y-6 font-sans text-left">
      {/* ─── Top Header Card ─── */}
      <div className="bg-white border border-slate-200 rounded-none p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#2C1EE8]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
              Kontrol Kuis Harian RPL
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Pusat kendali topik harian, generator soal AI, voting guru, dan monitoring peringkat siswa.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <Link
            href="/dev/ai-test"
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Tes API AI</span>
          </Link>

          <button
            type="button"
            onClick={loadAllQuizData}
            disabled={isLoading || actionProgress.active}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-none border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleResetAllQuizData}
            disabled={actionProgress.active}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider rounded-none border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* ─── Action Progress Bar (When AI is generating questions) ─── */}
      {actionProgress.active && (
        <div className="bg-white border-2 border-[#2C1EE8] rounded-none p-4 space-y-3 shadow-sm">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2C1EE8] animate-spin shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wide text-[#2C1EE8] leading-tight">
                {actionProgress.label}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#2C1EE8] shrink-0 ml-2">
              {actionProgress.progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-none overflow-hidden border border-slate-200">
            <div
              className="bg-[#2C1EE8] h-full transition-all duration-500 ease-out rounded-none"
              style={{ width: `${actionProgress.progress}%` }}
            />
          </div>

          {/* Chunk Status Labels */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {[
              { label: "EASY  (10 soal)", idx: 1 },
              { label: "MEDIUM (10 soal)", idx: 2 },
              { label: "HARD  (10 soal)", idx: 3 },
            ].map(({ label, idx }) => {
              const chunksDone = actionProgress.progress >= 100
                ? 3
                : Math.floor(((actionProgress.progress - 5) / 85) * 3);
              const done = chunksDone >= idx;
              const active = chunksDone === idx - 1 && actionProgress.progress > 5;
              return (
                <span
                  key={idx}
                  className={`flex items-center gap-1 ${
                    done
                      ? "text-emerald-600 font-bold"
                      : active
                      ? "text-[#2C1EE8] font-bold animate-pulse"
                      : "text-slate-400"
                  }`}
                >
                  {done ? "✓" : active ? "›" : "·"} {label}
                </span>
              );
            })}
          </div>
        </div>
      )}


      {/* ─── Feedback Notification ─── */}
      {feedback.text && (
        <div
          className={`p-3.5 rounded-none text-xs font-semibold border flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: "", text: "" })}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Grid 1: Status Kuis Hari Ini & Tombol Cepat Generator ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Kolom Kiri: Status Kuis Aktif */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-none p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
              STATUS KUIS HARI INI
            </span>
            <span className="px-2 py-0.5 bg-blue-50 text-[#2C1EE8] border border-blue-200 text-[10px] font-mono font-bold uppercase rounded-none">
              Live
            </span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              {todayTopic}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {todayTopicDesc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 border border-slate-200 rounded-none">
              <span className="text-slate-400 text-[10px] uppercase block font-bold">Pool Soal</span>
              <strong className="text-slate-900 text-sm">{totalQuestions} Soal AI</strong>
            </div>
            <div className="bg-slate-50 p-2.5 border border-slate-200 rounded-none">
              <span className="text-slate-400 text-[10px] uppercase block font-bold">Peserta Hari Ini</span>
              <strong className="text-[#2C1EE8] text-sm">{participantCount} Siswa</strong>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 space-y-2">
            {liveQuestions && liveQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsLiveModalOpen(true)}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-black"
              >
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Lihat Live Output Soal ({liveQuestions.length} Soal)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRefreshRandomTopic}
              disabled={actionProgress.active}
              className="w-full py-2.5 px-3 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acak Topik & Generate 30 Soal</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshQuestions}
              disabled={actionProgress.active}
              className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-none border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Generate Ulang Soal (Topik Sama)</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Atur Topik Kustom & Generator Soal */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-none p-5 space-y-4 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#2C1EE8]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Atur Topik Kustom & Generate Soal
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Smart Recommendation</span>
          </div>

          {/* ─── REKOMENDASI TERPOPULER (PERSENTASE TERBESAR) ─── */}
          {topVotedTopic ? (
            <div className="bg-amber-50/80 border border-amber-300 p-3.5 space-y-2 text-left">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-800 fill-amber-800" />
                  <span>Rekomendasi Vote Tertinggi ({topVotedTopic.percentage}% Suara)</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-900">
                  {topVotedTopic.voteCount} dari {totalVotes} Suara Guru
                </span>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-black text-black uppercase">
                  {topVotedTopic.topicName || topVotedTopic.name}
                </h4>
                {topVotedTopic.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {topVotedTopic.description}
                  </p>
                )}
              </div>

              {/* Progress Bar Persentase */}
              <div className="w-full bg-amber-200 h-1.5 rounded-none overflow-hidden">
                <div
                  className="bg-amber-600 h-full transition-all duration-300"
                  style={{ width: `${Math.max(topVotedTopic.percentage, 5)}%` }}
                />
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomTopicName(topVotedTopic.topicName || topVotedTopic.name);
                    setCustomTopicDesc(topVotedTopic.description || "");
                  }}
                  className="px-3 py-1.5 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Gunakan Topik Rekomendasi Ini ({topVotedTopic.percentage}%)</span>
                </button>
                <span className="text-[10px] text-slate-500 font-mono">1-Klik Terapkan</span>
              </div>
            </div>
          ) : null}

          {/* Form Input Topik */}
          <form onSubmit={handleSetCustomTopic} className="space-y-3.5">
            {/* Pilihan Engine & Model AI */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Pilih Model AI Engine
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AI_MODELS.map((m) => {
                  const isSelected = selectedModel === m.model;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.model);
                        setSelectedProvider(m.provider);
                      }}
                      className={`p-2.5 text-left border rounded-none transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isSelected
                          ? "border-[#2C1EE8] bg-blue-50/70 ring-1 ring-[#2C1EE8]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-slate-900 leading-tight truncate">{m.name}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 shrink-0 ${
                          isSelected ? "bg-[#2C1EE8] text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nama Topik / Materi Kuis
              </label>
              <input
                type="text"
                required
                value={customTopicName}
                onChange={(e) => setCustomTopicName(e.target.value)}
                placeholder="Pilih dari rekomendasi di atas atau ketik topik kustom..."
                className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#2C1EE8] outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Deskripsi / Instruksi Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={customTopicDesc}
                onChange={(e) => setCustomTopicDesc(e.target.value)}
                placeholder="Fokuskan pertanyaan pada routing, dependency injection, dan HTTP status codes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs font-normal text-slate-900 focus:bg-white focus:border-[#2C1EE8] outline-none transition-colors resize-none"
              />
            </div>

            {/* Quick Pills Kurikulum Merdeka RPL */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Pilihan Cepat Topik Kurikulum RPL:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CURRICULUM_SUGGESTIONS.map((item, idx) => {
                  const isSelected = customTopicName.toLowerCase() === item.name.toLowerCase();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomTopicName(item.name);
                        setCustomTopicDesc(item.desc);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer rounded-none border ${
                        isSelected
                          ? "bg-[#2C1EE8] text-white border-[#2C1EE8] font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#2C1EE8] hover:bg-white"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={actionProgress.active || !customTopicName.trim()}
              className="w-full py-2.5 px-4 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Terapkan Topik & Generate 30 Soal AI ({selectedModel.split("/").pop()})</span>
            </button>
          </form>
        </div>
      </div>

      {/* ─── Grid 2: Pipeline Usulan Tema Guru & Leaderboard Monitoring ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Pipeline Usulan Tema Guru */}
        <div className="bg-white border border-slate-200 rounded-none p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#2C1EE8]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Usulan Tema Dari Guru ({topics.length})
              </h3>
            </div>
            {topics.length > 0 && (
              <button
                type="button"
                onClick={handleFinalizeTopic}
                disabled={actionProgress.active}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer"
              >
                Finalisasi Tema Terpilih
              </button>
            )}
          </div>

          {/* Form Tambah Usulan Cepat */}
          <form onSubmit={handleProposeTopic} className="flex gap-2">
            <input
              type="text"
              required
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Usulkan topik baru..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#2C1EE8] outline-none"
            />
            <button
              type="submit"
              disabled={!newTopicName.trim()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-[#2C1EE8] hover:text-white border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              + Usulkan
            </button>
          </form>

          {/* List Topics dengan Persentase & Vote Progress Bar */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {topicsWithStats.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium border border-dashed border-slate-200 p-4">
                Belum ada usulan tema untuk hari mendatang.
              </div>
            ) : (
              topicsWithStats.map((t, rankIdx) => {
                const isTop1 = rankIdx === 0 && t.voteCount > 0;
                return (
                  <div
                    key={t.id || t.topicName}
                    className={`p-3 border rounded-none space-y-2 text-xs transition-all ${
                      isTop1
                        ? "bg-amber-50/50 border-amber-300"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isTop1 && (
                            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5" />
                              <span>Top 1</span>
                            </span>
                          )}
                          <h4 className="font-bold text-slate-900 truncate uppercase">
                            {t.topicName || t.name}
                          </h4>
                        </div>
                        {t.description && (
                          <p className="text-slate-500 text-[11px] truncate font-normal mt-0.5">
                            {t.description}
                          </p>
                        )}
                        <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5">
                          Diusulkan: {t.creatorName || t.proposedBy || "Guru"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Vote Button */}
                        <button
                          type="button"
                          onClick={() => handleVoteTopic(t.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-[#2C1EE8] border border-slate-200 rounded-none text-xs font-bold cursor-pointer transition-colors"
                          title="Beri vote untuk topik ini"
                        >
                          <ThumbsUp className="w-3 h-3 text-[#2C1EE8]" />
                          <span>{t.voteCount}</span>
                        </button>

                        {/* Use Topic Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomTopicName(t.topicName || t.name);
                            setCustomTopicDesc(t.description || "");
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-[#2C1EE8] text-white text-[10.5px] font-bold uppercase rounded-none transition-colors cursor-pointer"
                          title="Isi topik ini ke form generator"
                        >
                          Pilih
                        </button>
                      </div>
                    </div>

                    {/* Persentase Bar Suara */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400 font-bold uppercase">Dukungan Guru</span>
                        <span className={`font-black ${isTop1 ? "text-amber-800" : "text-slate-700"}`}>
                          {t.percentage}% ({t.voteCount} Suara)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-none overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isTop1 ? "bg-amber-500" : "bg-[#2C1EE8]"
                          }`}
                          style={{ width: `${Math.max(t.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Monitoring Leaderboard Harian */}
        <div className="bg-white border border-slate-200 rounded-none p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#2C1EE8]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Leaderboard Harian ({dailyLeaderboard.length} Siswa)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Top 20</span>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {dailyLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium border border-dashed border-slate-200 p-4">
                Belum ada siswa yang menyelesaikan kuis hari ini.
              </div>
            ) : (
              dailyLeaderboard.map((item, idx) => (
                <div
                  key={item.userId || idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-none flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 flex items-center justify-center rounded-none font-mono font-bold text-[10px] shrink-0 ${
                        idx === 0
                          ? "bg-amber-400 text-slate-950"
                          : idx === 1
                          ? "bg-slate-300 text-slate-900"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 truncate block">
                        {item.fullName || item.userName || "Siswa"}
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-400">
                        {item.className || "Siswa RPL"} · Akurasi: {item.accuracy || "100"}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <strong className="text-[#2C1EE8] font-mono font-bold text-xs block">
                      +{item.score || item.xpGained || 0} XP
                    </strong>
                    <span className="text-[9px] font-mono text-slate-400">
                      {item.timeTakenSeconds ? `${item.timeTakenSeconds}s` : "Selesai"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── LIVE OUTPUT SOAL AI MODAL ─── */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-white border border-black shadow-2xl p-5 sm:p-7 space-y-4 text-left my-6 max-h-[90vh] flex flex-col rounded-none">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-[#2C1EE8] text-white text-[10px] font-mono font-bold uppercase">
                    Live Output Soal AI
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Model: {selectedModel}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-black uppercase tracking-tight">
                  Output Soal: {todayTopic || customTopicName || "Topik Kuis"} ({liveQuestions.length} Butir)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsLiveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Copy Action */}
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-1.5">
                {[
                  { id: "all", label: `Semua (${liveQuestions.length})` },
                  { id: "easy", label: `Mudah (${liveQuestions.filter(q => q.difficulty?.toLowerCase() === "easy").length})` },
                  { id: "medium", label: `Menengah (${liveQuestions.filter(q => q.difficulty?.toLowerCase() === "medium").length})` },
                  { id: "hard", label: `Sulit (${liveQuestions.filter(q => q.difficulty?.toLowerCase() === "hard").length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterDiff(f.id)}
                    className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border rounded-none cursor-pointer transition-all ${
                      filterDiff === f.id
                        ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyAllQuestionsJson}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-300 rounded-none transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? "Tersalin" : "Salin JSON Soal"}</span>
              </button>
            </div>

            {/* Questions List (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              {liveQuestions.filter(q => filterDiff === "all" || q.difficulty?.toLowerCase() === filterDiff.toLowerCase()).length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium border border-dashed border-slate-200 p-4">
                  Belum ada soal pada filter ini.
                </div>
              ) : (
                liveQuestions
                  .filter(q => filterDiff === "all" || q.difficulty?.toLowerCase() === filterDiff.toLowerCase())
                  .map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-none space-y-2.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-none bg-black text-white font-mono font-bold text-xs flex items-center justify-center">
                            {q.questionNumber || idx + 1}
                          </span>
                          <span className="font-black text-slate-900 uppercase">
                            Soal #{q.questionNumber || idx + 1}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider border ${
                          q.difficulty?.toLowerCase() === "easy"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : q.difficulty?.toLowerCase() === "medium"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}>
                          {q.difficulty || "Easy"}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                        {q.questionText || q.question}
                      </p>

                      {q.codeSnippet && (
                        <pre className="p-2.5 bg-[#0a0f1d] text-emerald-400 font-mono text-[11px] overflow-x-auto rounded-none border border-slate-800">
                          {q.codeSnippet}
                        </pre>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options?.map((opt, optIdx) => {
                          const isCorrect = optIdx === q.correctAnswerIndex;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 border text-xs flex items-center justify-between gap-2 ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-400 font-bold text-emerald-950 ring-1 ring-emerald-300"
                                  : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-4 h-4 bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="truncate">{opt}</span>
                              </div>
                              {isCorrect && (
                                <span className="text-[9px] font-black uppercase text-emerald-700 shrink-0">
                                  Kunci Benar
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="p-2.5 bg-blue-50/60 border border-blue-100 text-[11px] text-slate-700">
                          <strong className="text-[#2C1EE8] block mb-0.5 uppercase text-[10px] tracking-wider">
                            Pembahasan Jawaban:
                          </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsLiveModalOpen(false)}
                className="px-5 py-2 bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-colors"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
