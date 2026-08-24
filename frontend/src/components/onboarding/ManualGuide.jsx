"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Sparkles, Compass, CheckCircle2, Ban, Mail } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import BloubMascot from "@/components/BloubMascot";
import EmailOtpVerificationModal from "@/components/profile/EmailOtpVerificationModal";

/**
 * Web Audio API Synthesizer for zero-latency, pleasant UI Sound Effects (SFX)
 */
const playSoundEffect = (type = "step") => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "prompt") {
      // Soft cheerful chime (E5 -> B5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "step") {
      // Subtle UI click tick (C6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "finish") {
      // Victory chime chord (C5 -> E5 -> G5)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.3);
      });
    }
  } catch (e) {
    // Ignore autoplay restriction blocks
  }
};

const GUIDE_STEPS = [
  {
    id: "welcome",
    title: "Kenalan Sama Replyz",
    subtitle: "Langkah 1 dari 10",
    content: "Halo! Aku Replyz, maskot dan AI Assistant di PPLG Center SMKN 2 Surakarta. Yuk kenali seluruh alur dan fitur utama di website ini!",
    emotion: "happy",
    targetId: "ai-chat-modal",
    route: null,
    cardPlacement: "bottom-right",
  },
  {
    id: "navigation",
    title: "Bar Navigasi Utama",
    subtitle: "Langkah 2 dari 10",
    content: "Melalui bar navigasi di bagian atas, kamu bisa langsung mengakses Beranda, Kelas & Jadwal, Pengumuman Sekolah, hingga Fasilitas dengan satu klik.",
    emotion: "thinking",
    targetId: "nav-primary",
    route: "/",
    cardPlacement: "top-center",
  },
  {
    id: "kelas",
    title: "Kelas & Jadwal Pelajaran",
    subtitle: "Langkah 3 dari 10",
    content: "Di halaman ini kamu dapat mengecek jadwal KBM harian, struktur kepengurusan kelas, serta jadwal piket kebersihan siswa.",
    emotion: "thinking",
    targetId: "kelas-header-card",
    route: "/kelas",
    cardPlacement: "bottom-center",
  },
  {
    id: "pengumuman",
    title: "Pengumuman PPLG Center",
    subtitle: "Langkah 4 dari 10",
    content: "Pusat berita resmi sekolah, pemberitahuan ujian akademik, serta informasi kegiatan jurusan PPLG terkini.",
    emotion: "notif",
    targetId: "pengumuman-header-card",
    route: "/pengumuman",
    cardPlacement: "bottom-center",
  },
  {
    id: "fasilitas",
    title: "Katalog Sarana & Fasilitas",
    subtitle: "Langkah 5 dari 10",
    content: "Katalog reservasi lab komputer, peminjaman aula serbaguna, sarana olahraga, hingga fitur Simulasi 3D PC Lab.",
    emotion: "side",
    targetId: "fasilitas-header-card",
    route: "/fasilitas",
    cardPlacement: "bottom-center",
  },
  {
    id: "komunitas",
    title: "Ruang Komunitas PPLG",
    subtitle: "Langkah 6 dari 10",
    content: "Tempat berkumpulnya siswa & guru PPLG untuk mempublikasikan karya di Mading Digital serta berdiskusi dalam Circle minat coding & game dev.",
    emotion: "peek",
    targetId: "komunitas-header-card",
    route: "/komunitas",
    cardPlacement: "bottom-center",
  },
  {
    id: "notifications",
    title: "Pusat Notifikasi Real-Time",
    subtitle: "Langkah 7 dari 10",
    content: "Tombol lonceng di atas memberitahumu secara instant bila ada pengumuman baru, tugas, atau balasan diskusi.",
    emotion: "notif",
    targetId: "notif_button",
    route: null,
    cardPlacement: "top-right",
  },
  {
    id: "email_notif",
    title: "Tautkan Email Notifikasi",
    subtitle: "Langkah 8 dari 10",
    content: "Hubungkan email aktifmu sekarang agar update tugas, nilai guru, dan pengumuman sekolah langsung terkirim ke kotak masukmu secara instan!",
    emotion: "love",
    targetId: "profile-nav-btn",
    route: null,
    cardPlacement: "top-right",
  },
  {
    id: "ai_assistant",
    title: "Replyz AI Virtual Assistant",
    subtitle: "Langkah 9 dari 10",
    content: "Cukup klik aku di pojok kanan bawah untuk bertanya atau meminta aksi otomatis seperti cari pengumuman & cek jadwal!",
    emotion: "love",
    targetId: "ai-chat-modal",
    route: null,
    cardPlacement: "bottom-right",
  },
  {
    id: "finish",
    title: "Tur Selesai! Selamat Berkreasi!",
    subtitle: "Langkah 10 dari 10",
    content: "Selamat! Kamu sudah paham seluruh alur & fitur PPLG Center. Kamu bisa klik tombol 'Panduan manual' kapan saja jika ingin mengulang tur ini.",
    emotion: "wink",
    targetId: "ai-chat-modal",
    route: null,
    cardPlacement: "bottom-right",
  },
];

export default function ManualGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, refreshUser } = useAuth();

  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const currentStep = GUIDE_STEPS[currentStepIndex];
  const isEmailLinked = Boolean(user?.emailNotif && (user?.emailVerifiedAt || user?.isEmailNotifVerified));

  // Detect login & show non-intrusive mascot bubble at bottom-right AI location
  useEffect(() => {
    if (typeof window === "undefined" || !isAuthenticated) return;

    try {
      const hasCompleted = localStorage.getItem("sc_has_completed_manual_guide");
      const hasSeenPrompt = sessionStorage.getItem("sc_prompt_shown_session");

      if (!hasCompleted && !hasSeenPrompt) {
        const timer = setTimeout(() => {
          setIsPromptVisible(true);
          sessionStorage.setItem("sc_prompt_shown_session", "true");
          playSoundEffect("prompt");
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [isAuthenticated, user?.id]);

  // Listen for custom trigger event (e.g. from pill button click)
  useEffect(() => {
    const handleStartGuide = () => {
      setIsPromptVisible(false);
      setCurrentStepIndex(0);
      setIsTourActive(true);
      playSoundEffect("step");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("app:start-manual-guide", handleStartGuide);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("app:start-manual-guide", handleStartGuide);
      }
    };
  }, []);

  // Pure target rect position calculation
  const updateTargetPosition = useCallback(() => {
    if (!isTourActive || !currentStep?.targetId) {
      setTargetRect(null);
      return;
    }

    const elem = document.getElementById(currentStep.targetId);
    if (elem) {
      const rect = elem.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      const navElem = document.getElementById("nav-primary");
      if (navElem) {
        const rect = navElem.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    }
  }, [isTourActive, currentStep?.targetId]);

  // Update target rect on active tour changes, step navigation, path changes, resize & scroll
  useEffect(() => {
    if (!isTourActive) return;

    updateTargetPosition();

    const t1 = setTimeout(updateTargetPosition, 150);
    const t2 = setTimeout(updateTargetPosition, 400);

    const handleScrollOrResize = () => {
      updateTargetPosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isTourActive, currentStepIndex, pathname, updateTargetPosition]);

  // If the step has a route that isn't current, navigate to it
  useEffect(() => {
    if (!isTourActive) return;

    if (currentStep?.route && pathname !== currentStep.route) {
      router.push(currentStep.route);
    }
  }, [isTourActive, currentStepIndex, currentStep?.route, pathname, router]);

  const handleStartTour = () => {
    setIsPromptVisible(false);
    setCurrentStepIndex(0);
    setIsTourActive(true);
    playSoundEffect("step");
  };

  const handleDismissPrompt = () => {
    setIsPromptVisible(false);
  };

  const handleNextStep = () => {
    if (currentStepIndex < GUIDE_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      playSoundEffect("step");
    } else {
      // Finished
      setIsTourActive(false);
      try {
        localStorage.setItem("sc_has_completed_manual_guide", "true");
      } catch (e) {}
      playSoundEffect("finish");
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      playSoundEffect("step");
    }
  };

  const handleCancelTour = () => {
    setIsTourActive(false);
    try {
      localStorage.setItem("sc_has_completed_manual_guide", "true");
    } catch (e) {}
  };

  // Dynamic card placement style based on step config
  const getCardPlacementStyle = () => {
    switch (currentStep?.cardPlacement) {
      case "top-center":
        return "top-20 left-1/2 -translate-x-1/2 items-start";
      case "bottom-center":
        return "bottom-8 left-1/2 -translate-x-1/2 items-end";
      case "top-left":
        return "top-24 left-6 sm:left-12 items-start";
      case "top-right":
        return "top-20 right-6 sm:right-12 items-end";
      case "bottom-right":
        return "bottom-24 right-6 sm:right-12 items-end";
      default:
        return "bottom-24 right-6 sm:right-12 items-end";
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated) return null;

  return createPortal(
    <>
      <EmailOtpVerificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialEmail={user?.emailNotif || ""}
        onSuccess={() => {
          setIsEmailModalOpen(false);
          if (refreshUser) refreshUser();
        }}
        onVerified={() => {
          setIsEmailModalOpen(false);
          if (refreshUser) refreshUser();
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. BOTTOM-RIGHT MASCOT PROMPT BUBBLE (AFTER LOGIN)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPromptVisible && !isTourActive && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              position: "fixed",
              bottom: "6rem",
              right: "1.5rem",
              left: "auto",
              top: "auto",
              zIndex: 99998,
            }}
            className="w-88 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.18)] rounded-[26px] p-4.5 flex flex-col gap-3 font-sans text-slate-900 ring-4 ring-blue-500/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="relative p-1 bg-slate-900 border border-slate-700/80 rounded-xl shrink-0 shadow-xs">
                  <BloubMascot size={44} state="wink" badge={false} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-extrabold tracking-wider text-[#2C1EE8] uppercase bg-blue-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-1 border border-blue-100">
                    <Compass className="w-3 h-3 text-[#2C1EE8]" />
                    {!isEmailLinked ? "Tautkan Email Notifikasi" : "Panduan Manual Replyz"}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    {!isEmailLinked
                      ? `Halo ${user?.fullName?.split(" ")[0] || "Sobat"}! Tautkan Email Notifikasi?`
                      : "Halo! Mau tur singkat PPLG Center?"}
                  </h4>
                </div>
              </div>

              <button
                onClick={handleDismissPrompt}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Tutup prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {!isEmailLinked
                ? "Biar kamu gak ketinggalan update tugas, nilai guru, dan pengumuman sekolah, yuk tautkan email aktifmu sekarang!"
                : "Aku Replyz, maskot & AI Assistant kamu! Biar makin mudah navigasi, ikuti panduan alur singkat ini."}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              {!isEmailLinked ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsPromptVisible(false);
                      setIsEmailModalOpen(true);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Tautkan Email</span>
                  </motion.button>
                  <button
                    onClick={handleStartTour}
                    className="bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tur</span>
                  </button>
                  <button
                    onClick={handleDismissPrompt}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs py-2 px-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Nanti
                  </button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartTour}
                    className="flex-1 bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mulai Panduan</span>
                  </motion.button>
                  <button
                    onClick={handleDismissPrompt}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Nanti Dulu
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. SPOTLIGHT OVERLAY WITHOUT BLUR & CREATIVE MATCHING CARD UI
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTourActive && (
          <div className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden">
            {/* Clear Spotlight Cutout Overlay (NO BLUR, Darkened background, target stays crystal clear) */}
            {targetRect ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  top: targetRect.top - 8,
                  left: targetRect.left - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="absolute rounded-2xl ring-4 ring-[#2C1EE8] ring-offset-2 ring-offset-transparent pointer-events-none z-10"
                style={{
                  boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.78)",
                }}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/78 pointer-events-none z-10"
              />
            )}

            {/* Creative Positioned Guide Card Matching Web Aesthetics */}
            <div className={`absolute z-20 pointer-events-none p-4 max-w-full flex ${getCardPlacementStyle()}`}>
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="w-[400px] max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[28px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] p-5 sm:p-6 flex flex-col gap-4 pointer-events-auto font-sans text-slate-900 border-b-4 border-b-[#2C1EE8]"
              >
                {/* Header: Progress Bar, Step Badge & Close Button */}
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-3">
                  {/* Top Animated Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-[#2C1EE8] h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((currentStepIndex + 1) / GUIDE_STEPS.length) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-50 border border-blue-100 text-[#2C1EE8] font-mono font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Compass className="w-3 h-3 text-[#2C1EE8]" />
                        Langkah {currentStepIndex + 1} dari {GUIDE_STEPS.length}
                      </span>
                      <span className="text-slate-500 text-xs font-semibold truncate max-w-[160px]">
                        {currentStep.subtitle}
                      </span>
                    </div>

                    <button
                      onClick={handleCancelTour}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
                      title="Batalkan Panduan"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Body: Animated Replyz Mascot + Clean Description */}
                <div className="flex items-start gap-3.5">
                  <div className="relative p-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl shrink-0 shadow-xs flex items-center justify-center">
                    <BloubMascot
                      size={68}
                      state={currentStep.emotion}
                      badge={currentStepIndex === GUIDE_STEPS.length - 1}
                      badgeColor="#10b981"
                      badgePulse={true}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {currentStep.content}
                    </p>

                    {currentStep.id === "email_notif" && (
                      <div className="pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => setIsEmailModalOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Tautkan Email Sekarang</span>
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Cancel (Batal), Previous (Kembali), Next (Lanjut/Selesai) */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
                  <button
                    onClick={handleCancelTour}
                    className="text-xs font-bold text-slate-400 hover:text-rose-600 cursor-pointer transition-colors flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg"
                  >
                    <Ban className="w-3 h-3 text-slate-400 group-hover:text-rose-600" />
                    <span>Batal</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentStepIndex > 0 && (
                      <button
                        onClick={handlePrevStep}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-slate-200/80"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Kembali</span>
                      </button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNextStep}
                      className="bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>
                        {currentStepIndex === GUIDE_STEPS.length - 1 ? "Selesai" : "Lanjut"}
                      </span>
                      {currentStepIndex === GUIDE_STEPS.length - 1 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
