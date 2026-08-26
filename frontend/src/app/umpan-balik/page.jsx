"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

let motionImport = null;
let animatePresenceImport = null;

try {
  const m = require("motion/react");
  motionImport = m.motion;
  animatePresenceImport = m.AnimatePresence;
} catch (e) {
  try {
    const f = require("framer-motion");
    motionImport = f.motion;
    animatePresenceImport = f.AnimatePresence;
  } catch (e2) {}
}

const FallbackDiv = React.forwardRef(({ children, className, style, onClick }, ref) => (
  <div ref={ref} className={className} style={style} onClick={onClick}>
    {children}
  </div>
));
FallbackDiv.displayName = "FallbackDiv";

const MotionDiv = motionImport?.div || FallbackDiv;
const AnimatePresenceComponent = animatePresenceImport || (({ children }) => <>{children}</>);

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

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("Fitur");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mascotState, setMascotState] = useState("happy");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync mascot reaction when rating or category changes
  useEffect(() => {
    const activeRating = hoverRating || rating;
    if (RATING_LABELS[activeRating]) {
      setMascotState(RATING_LABELS[activeRating].mascot);
    }
  }, [rating, hoverRating]);

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 pt-24 lg:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full flex flex-col justify-center">
        {/* Main Interactive Card */}
        <AnimatePresenceComponent mode="wait">
          {!isSuccess ? (
            <MotionDiv
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className="bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-900/5 p-6 sm:p-10 relative overflow-hidden"
            >
              {/* Subtle background gradient tint */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full blur-3xl pointer-events-none" />

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {/* 1. Header with Mascot & Title */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6 border-b border-slate-100">
                  {/* Interactive Mascot Blob */}
                  <div
                    className="relative p-2.5 bg-slate-900 rounded-3xl shadow-lg border border-slate-800 shrink-0 transition-transform duration-300 hover:scale-105 cursor-pointer"
                    onClick={() => {
                      const states = ["happy", "wink", "love", "thinking", "peek"];
                      const nextState = states[(states.indexOf(mascotState) + 1) % states.length];
                      setMascotState(nextState);
                    }}
                    title="Klik maskot untuk melihat ekspresi lainnya!"
                  >
                    <BloubMascot size={72} state={mascotState} badge={false} />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                      Bagaimana pengalamannya? Adakah feedback untuk kami?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Ceritakan secara terbuka agar kami bisa terus berbenah & berinovasi bersama!
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-700 font-bold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 2. Rating Selector (Stars with Labels) */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Beri Penilaian Pengalamanmu
                  </label>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isFilled = (hoverRating || rating) >= starValue;
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1.5 transition-all duration-150 transform hover:scale-125 focus:outline-none cursor-pointer"
                            aria-label={`Beri rating ${starValue} bintang`}
                          >
                            <Star
                              className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-150 ${
                                isFilled
                                  ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                                  : "text-slate-300 hover:text-slate-400"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="sm:ml-auto">
                      <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs ${RATING_LABELS[hoverRating || rating]?.moodColor}`}>
                        {RATING_LABELS[hoverRating || rating]?.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Category Filter Chips */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Kategori Masukan
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CATEGORIES.map((cat) => {
                      const IconComp = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`p-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-200 border cursor-pointer ${
                            isSelected
                              ? "bg-[#2c1ee8] text-white border-[#2c1ee8] shadow-md shadow-blue-500/20 scale-[1.02]"
                              : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                          }`}
                        >
                          <IconComp className={`w-4 h-4 ${isSelected ? "text-white" : cat.color}`} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Textarea Feedback Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Isi Umpan Balik & Masukan
                    </label>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {content.length}/1000
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      rows={5}
                      maxLength={1000}
                      value={content}
                      onFocus={handleContentFocus}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Buat sejujur-jujurnya yaa >???<"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#2c1ee8] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-y min-h-[120px]"
                    />
                  </div>
                </div>

                {/* 5. Anonymous Toggle & User Identity Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      id="anon-checkbox"
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-[#2c1ee8] rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="anon-checkbox" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                      Kirim sebagai Anonim
                    </label>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    {isAnonymous ? (
                      <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Identitas & nama Anda disembunyikan.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                        <User className="w-3.5 h-3.5" />
                        Dikirim sebagai: <strong>{user?.fullName || user?.name || "Pengguna Terdaftar"}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* 6. Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-[#2c1ee8] hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Mengirim Masukan...</span>
                    </div>
                  ) : (
                    <>
                      <span>Kirim Umpan Balik</span>
                      <Send className="w-4 h-4 text-blue-200" />
                    </>
                  )}
                </button>
              </form>
            </MotionDiv>
          ) : (
            /* Post-Submission Celebration Card */
            <MotionDiv
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.45, type: "spring", stiffness: 300 }}
              className="bg-white rounded-[32px] border border-slate-200/80 shadow-2xl p-8 sm:p-12 text-center space-y-6 max-w-lg mx-auto"
            >
              {/* Celebration Mascot */}
              <div className="inline-block p-4 bg-slate-900 rounded-3xl shadow-xl border border-slate-800">
                <BloubMascot size={110} state="love" badge={false} />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Masukan Berhasil Dikirim
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Terima Kasih Banyak!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Umpan balikmu telah diterima oleh tim Administrator PPLG Center SMK Negeri 2 Surakarta untuk ditinjau dan ditindaklanjuti.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Kirim Masukan Lain
                </button>

                <Link
                  href="/"
                  className="py-3 px-6 rounded-2xl bg-[#2c1ee8] hover:bg-blue-700 text-white font-black text-xs transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Kembali ke Beranda</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </MotionDiv>
          )}
        </AnimatePresenceComponent>
      </main>

      <Footer />
    </div>
  );
}
