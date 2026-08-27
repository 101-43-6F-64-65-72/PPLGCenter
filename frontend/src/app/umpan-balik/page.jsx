"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BloubMascot from "@/components/BloubMascot";
import useAuth from "@/hooks/useAuth";
import feedbackService from "@/services/feedbackService";
import {
  Star,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Bug,
  Palette,
  Heart,
  MessageSquare,
  ShieldCheck,
  User,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  History,
  Shield,
  MessageCircle,
} from "lucide-react";

const CATEGORIES = [
  { id: "Fitur", label: "Saran Fitur", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
  { id: "Bug", label: "Laporkan Bug", icon: Bug, color: "text-rose-500", bg: "bg-rose-50 border-rose-200" },
  { id: "UI/UX", label: "Desain UI/UX", icon: Palette, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200" },
  { id: "Apresiasi", label: "Apresiasi", icon: Heart, color: "text-pink-500", bg: "bg-pink-50 border-pink-200" },
  { id: "Lainnya", label: "Lainnya", icon: MessageSquare, color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
];

const RATING_LABELS = {
  1: { label: "Sangat Kurang", mascot: "sad", moodColor: "text-rose-500" },
  2: { label: "Kurang Puas", mascot: "side", moodColor: "text-orange-500" },
  3: { label: "Cukup Baik", mascot: "thinking", moodColor: "text-amber-500" },
  4: { label: "Sangat Puas", mascot: "happy", moodColor: "text-blue-500" },
  5: { label: "Luar Biasa / Keren!", mascot: "love", moodColor: "text-emerald-500" },
};

export default function UmpanBalikPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Active top tab: "create" | "history"
  const [activeTab, setActiveTab] = useState("create");

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("Fitur");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mascotState, setMascotState] = useState("happy");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // User feedback history states
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Sync mascot reaction when rating or category changes
  useEffect(() => {
    const activeRating = hoverRating || rating;
    if (RATING_LABELS[activeRating]) {
      setMascotState(RATING_LABELS[activeRating].mascot);
    }
  }, [rating, hoverRating]);

  const fetchMyFeedbacks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setHistoryLoading(true);
      const res = await feedbackService.getMyFeedbacks();
      const data = res?.data || res;
      setMyFeedbacks(data.items || []);
    } catch (e) {
      console.error("Gagal mengambil riwayat masukan:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchMyFeedbacks();
    }
  }, [activeTab, fetchMyFeedbacks]);

  const handleCategorySelect = (catId) => {
    setCategory(catId);
    if (catId === "Bug") {
      setMascotState("shock");
    } else if (catId === "Apresiasi") {
      setMascotState("love");
    } else if (catId === "Fitur") {
      setMascotState("thinking");
    } else {
      setMascotState("happy");
    }
  };

  const handleContentFocus = () => {
    setMascotState("thinking");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!content.trim()) {
      setErrorMessage("Mohon tuliskan isi umpan balik Anda terlebih dahulu.");
      setMascotState("sad");
      return;
    }

    if (content.trim().length < 5) {
      setErrorMessage("Umpan balik minimal 5 karakter.");
      setMascotState("sad");
      return;
    }

    setIsSubmitting(true);
    setMascotState("peek");

    try {
      const payload = {
        category,
        rating,
        content: content.trim(),
        isAnonymous,
      };

      await feedbackService.createFeedback(payload);
      setIsSuccess(true);
      setMascotState("happy");
      fetchMyFeedbacks();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Gagal mengirim umpan balik. Silakan coba lagi.";
      setErrorMessage(msg);
      setMascotState("sad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setRating(5);
    setCategory("Fitur");
    setIsAnonymous(false);
    setIsSuccess(false);
    setErrorMessage("");
    setMascotState("happy");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-none text-[10px] font-bold font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> Menunggu</span>;
      case "Reviewed":
        return <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-none text-[10px] font-bold font-mono uppercase bg-blue-50 text-[#2C1EE8] border border-blue-200"><CheckCircle className="w-3 h-3" /> Ditinjau</span>;
      case "Resolved":
        return <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-none text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Selesai</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-none text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full flex flex-col space-y-4 text-left">
        {/* Navigation Tabs between Form & My History */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-none p-1.5 shadow-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 border ${
                activeTab === "create"
                  ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                  : "bg-white text-slate-600 hover:bg-slate-100 border-transparent"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Kirim Masukan</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 border ${
                  activeTab === "history"
                    ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                    : "bg-white text-slate-600 hover:bg-slate-100 border-transparent"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat & Tanggapan</span>
                {myFeedbacks.some((f) => f.adminReply) && (
                  <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
                )}
              </button>
            )}
          </div>

          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold pr-2 hidden sm:inline">
            Kotak Aspirasi PPLG
          </span>
        </div>

        {/* Tab 1: Form Umpan Balik */}
        {activeTab === "create" && (
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <div
                key="form"
                className="bg-white rounded-none border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 1. Header with Mascot & Title */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pb-4 border-b border-slate-100">
                    {/* Passive Mascot */}
                    <div className="p-2 bg-slate-900 rounded-none border border-slate-800 shrink-0 pointer-events-none select-none">
                      <BloubMascot size={56} state={mascotState} badge={false} />
                    </div>

                    <div className="space-y-0.5">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
                        Kotak Saran & Aspirasi Siswa/Guru
                      </h2>
                      <p className="text-xs text-slate-500 font-normal">
                        Ceritakan secara terbuka kritik, saran, maupun laporan kendala sistem untuk kemajuan PPLG Center.
                      </p>
                    </div>
                  </div>

                  {/* Error Banner */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-none text-xs text-rose-700 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* 2. Rating Selector (Stars with Labels) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Penilaian Pengalaman Penggunaan:
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 sm:p-3 rounded-none border border-slate-200">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const isFilled = (hoverRating || rating) >= starValue;
                          return (
                            <button
                              key={starValue}
                              type="button"
                              onClick={() => setRating(starValue)}
                              onMouseEnter={() => setHoverRating(starValue)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 focus:outline-none cursor-pointer"
                              aria-label={`Beri rating ${starValue} bintang`}
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  isFilled
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300 hover:text-slate-400"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <span className={`text-xs font-bold font-mono uppercase px-2.5 py-1 rounded-none bg-white border border-slate-200 ${RATING_LABELS[hoverRating || rating]?.moodColor}`}>
                          {RATING_LABELS[hoverRating || rating]?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Category Filter Chips */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Kategori Masukan:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {CATEGORIES.map((cat) => {
                        const IconComp = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategorySelect(cat.id)}
                            className={`p-2.5 rounded-none text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border cursor-pointer ${
                              isSelected
                                ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-white" : cat.color}`} />
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Textarea Feedback Content */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Isi Umpan Balik / Deskripsi <span className="text-rose-500">*</span>:
                      </label>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {content.length}/1000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={content}
                      onFocus={handleContentFocus}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tuliskan masukan, saran, atau kendala Anda secara detail..."
                      className="w-full rounded-none border border-slate-200 bg-slate-50 p-3 text-xs sm:text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#2C1EE8] transition-colors outline-none resize-y min-h-[100px]"
                    />
                  </div>

                  {/* 5. Anonymous Toggle & User Identity Preview */}
                  <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="anon-checkbox"
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-3.5 h-3.5 text-[#2C1EE8] rounded-none border-slate-300 focus:ring-[#2C1EE8] cursor-pointer"
                      />
                      <label htmlFor="anon-checkbox" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                        Kirim sebagai Anonim
                      </label>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      {isAnonymous ? (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Identitas & nama Anda disembunyikan.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#2C1EE8] font-semibold">
                          <User className="w-3.5 h-3.5" />
                          Pengirim: <strong>{user?.fullName || user?.name || "Pengguna Terdaftar"}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 6. Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-5 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengirim Masukan...</span>
                      </div>
                    ) : (
                      <>
                        <span>Kirim Masukan</span>
                        <Send className="w-3.5 h-3.5 text-blue-200" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Post-Submission Celebration Card */
              <div
                key="success"
                className="bg-white rounded-none border border-slate-200 shadow-xs p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto"
              >
                <div className="inline-block p-3 bg-slate-900 rounded-none border border-slate-800 pointer-events-none select-none">
                  <BloubMascot size={72} state="love" badge={false} />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold font-mono uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Masukan Berhasil Dikirim
                  </span>
                  <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">
                    Terima Kasih!
                  </h2>
                  <p className="text-xs text-slate-600 font-normal leading-relaxed">
                    Umpan balikmu telah tersimpan dan diteruskan ke tim pengurus. Anda dapat mengecek status tindak lanjut di tab riwayat.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-2.5 px-4 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                  >
                    Kirim Masukan Baru
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleReset();
                      setActiveTab("history");
                    }}
                    className="py-2.5 px-5 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] text-white font-bold uppercase tracking-wider text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Lihat Riwayat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Tab 2: User Section - Riwayat & Tanggapan Admin */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-none">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#2C1EE8]" />
                <span>Riwayat Masukan & Tanggapan</span>
              </h2>
              <button
                onClick={fetchMyFeedbacks}
                disabled={historyLoading}
                className="px-3 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${historyLoading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {historyLoading ? (
              <div className="bg-white p-10 rounded-none border border-slate-200 text-center space-y-2 text-xs font-bold uppercase text-slate-400">
                <RefreshCw className="w-5 h-5 text-[#2C1EE8] animate-spin mx-auto" />
                <p>Memuat riwayat masukan...</p>
              </div>
            ) : myFeedbacks.length === 0 ? (
              <div className="bg-white p-10 rounded-none border border-slate-200 text-center space-y-3 shadow-xs">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold uppercase text-slate-800">Belum Ada Masukan</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                  Anda belum pernah mengirim umpan balik yang terhubung dengan akun ini.
                </p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                >
                  <span>Kirim Masukan Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              myFeedbacks.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 sm:p-5 rounded-none border border-slate-200 shadow-xs space-y-3 text-left"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.2 rounded-none text-[10px] font-bold font-mono uppercase bg-blue-50 text-[#2C1EE8] border border-blue-200">
                        {item.category}
                      </span>
                      {getStatusBadge(item.status)}

                      {item.isAnonymous && (
                        <span className="px-2 py-0.2 rounded-none text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Anonim</span>
                        </span>
                      )}

                      <div className="flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-50 rounded-none border border-amber-200">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-2.5 h-2.5 ${
                              s <= item.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(item.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  {/* User Message */}
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                      Isi Masukan:
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                      &quot;{item.content}&quot;
                    </p>
                  </div>

                  {/* Official Admin Reply (If Available) */}
                  {item.adminReply ? (
                    <div className="p-3 rounded-none bg-blue-50/70 border border-blue-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2C1EE8] uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />
                          Tanggapan Resmi ({item.repliedByAdminName || "Administrator"})
                        </span>
                        {item.repliedAt && (
                          <span className="text-[9.5px] font-mono text-blue-600 font-bold">
                            {new Date(item.repliedAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-normal text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {item.adminReply}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-none bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Masukan sedang dalam antrean peninjauan oleh tim Administrator.</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
