"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, Home, ShieldAlert, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BloubMascot from "@/components/BloubMascot";

/**
 * Universal Error & Unauthorized Fallback Component (Pure JavaScript / JSX)
 * Production-ready, dynamic error fallback system supporting HTTP codes, API JSON responses, and empty states.
 * 
 * Props Schema (Plain JS):
 * @param {Object} props
 * @param {number|string} [props.statusCode=401] - Status code (e.g. 401, 403, 404, 500, "Empty", "ERR_EMPTY")
 * @param {string} [props.title] - Main error heading title override
 * @param {string} [props.description] - Detailed error message override
 * @param {{ label: string, onClick?: () => void, href?: string }} [props.primaryAction] - Primary button config
 * @param {{ label: string, onClick?: () => void, href?: string }} [props.secondaryAction] - Secondary button config
 * @param {boolean} [props.showHomeButton=true] - Auto-render home action if secondaryAction is omitted
 * @param {Object} [props.error] - Backend error object, Axios error, or response payload
 * @param {Array<string>} [props.errors] - Additional error messages or details array
 * @param {boolean} [props.fullPage=true] - Render with Navbar & Footer or standalone container
 * @param {string} [props.mascotStateOverride] - Force mascot expression state ("sad" | "happy" | "idle" | "closed" | "shock")
 * @param {string} [props.className=""] - Additional wrapper CSS classes
 */
export function ErrorFallback({
  statusCode: propStatusCode,
  title: propTitle,
  description: propDescription,
  primaryAction,
  secondaryAction,
  showHomeButton = true,
  error = null,
  errors: propErrors = [],
  fullPage = true,
  mascotStateOverride = null,
  className = "",
}) {
  // ─── Backend Error Response Parsing ─────────────────────────────────────
  const backendData = error?.response?.data || error || {};
  
  const rawStatusCode =
    propStatusCode !== undefined && propStatusCode !== null
      ? propStatusCode
      : backendData?.statusCode || backendData?.status || error?.status || 401;

  const backendMessage = backendData?.message || error?.message;

  const errorList =
    Array.isArray(backendData?.errors) && backendData.errors.length > 0
      ? backendData.errors
      : Array.isArray(propErrors)
      ? propErrors
      : [];

  // Format Status Code display string (e.g. 401, 403, 404, 500, ERR_EMPTY)
  const formatCodeBadge = (code) => {
    if (typeof code === "string") {
      const clean = code.trim().toUpperCase();
      if (clean === "EMPTY" || clean === "ERR_EMPTY") return "ERR_EMPTY";
      return clean;
    }
    return String(code);
  };

  const codeBadgeText = formatCodeBadge(rawStatusCode);
  const numericCode = Number(rawStatusCode);

  // Badge Color Style mapping based on status code
  const getBadgeStyle = (codeStr, numCode) => {
    if (numCode === 401) return "bg-indigo-50 text-indigo-700 border-indigo-200/80 ring-indigo-500/10";
    if (numCode === 403) return "bg-amber-50 text-amber-800 border-amber-200/80 ring-amber-500/10";
    if (numCode === 404) return "bg-sky-50 text-sky-700 border-sky-200/80 ring-sky-500/10";
    if (numCode >= 500) return "bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/10";
    if (codeStr === "ERR_EMPTY" || codeStr === "EMPTY") return "bg-slate-100 text-slate-700 border-slate-200/80 ring-slate-500/10";
    return "bg-blue-50 text-blue-700 border-blue-200/80 ring-blue-500/10";
  };

  // Fallback Title Generator
  const getFallbackTitle = (codeStr, numCode) => {
    if (numCode === 401) return "Ups! Halaman Ini Perlu Izin Khusus";
    if (numCode === 403) return "Akses Ditolak (Forbidden)";
    if (numCode === 404) return "Halaman Tidak Ditemukan";
    if (numCode >= 500) return "Terjadi Kesalahan Server";
    if (codeStr === "ERR_EMPTY" || codeStr === "EMPTY") return "Data Belum Tersedia";
    return "Terjadi Kesalahan";
  };

  // Fallback Description Generator
  const getFallbackDesc = (codeStr, numCode) => {
    if (numCode === 401)
      return "Kamu harus masuk (login) dengan akun terdaftar untuk mengakses ekosistem dan modul ini.";
    if (numCode === 403)
      return "Akun Anda tidak memiliki lisensi atau hak akses untuk melihat modul dan data ini.";
    if (numCode === 404)
      return "Maaf, halaman atau resource yang Anda cari tidak dapat ditemukan.";
    if (codeStr === "ERR_EMPTY" || codeStr === "EMPTY")
      return "Belum ada data atau informasi yang dapat ditampilkan saat ini.";
    return "Sistem mendeteksi adanya kendala saat memproses permintaan Anda.";
  };

  const title = propTitle || getFallbackTitle(codeBadgeText, numericCode);
  const description = propDescription || backendMessage || getFallbackDesc(codeBadgeText, numericCode);

  // ─── Mascot Expressions & Hover Reactions ──────────────────────────────
  const getMascotStateForCode = (codeStr, numCode) => {
    if (mascotStateOverride) return mascotStateOverride;
    if (numCode === 403) return "shock";
    return "sad";
  };

  const defaultMascotState = getMascotStateForCode(codeBadgeText, numericCode);
  const [mascotState, setMascotState] = useState(defaultMascotState);

  useEffect(() => {
    setMascotState(getMascotStateForCode(codeBadgeText, numericCode));
  }, [mascotStateOverride, codeBadgeText, numericCode]);

  const handleMouseEnter = () => setMascotState("happy");
  const handleMouseLeave = () => setMascotState(defaultMascotState);

  // ─── Default Action Configurations ─────────────────────────────────────
  const isUnauthorized = numericCode === 401 || numericCode === 403;

  const defaultPrimary = {
    label: isUnauthorized ? "Masuk Akun (Login)" : "Kembali ke Beranda",
    href: isUnauthorized ? "/login" : "/",
  };

  const defaultSecondary = {
    label: "Kembali ke Beranda",
    href: "/",
  };

  const primary = primaryAction !== undefined ? primaryAction : defaultPrimary;
  const secondary =
    secondaryAction !== undefined
      ? secondaryAction
      : showHomeButton && primary?.href !== "/"
      ? defaultSecondary
      : null;

  // Helper to pick button icons dynamically based on action labels
  const getButtonIcon = (label, isPrimaryAction) => {
    const l = (label || "").toLowerCase();
    if (l.includes("login") || l.includes("masuk")) {
      return <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />;
    }
    if (l.includes("beranda") || l.includes("home") || l.includes("utama")) {
      return <Home className="w-4 h-4 transition-transform group-hover:scale-105" />;
    }
    if (l.includes("coba") || l.includes("retry") || l.includes("muat ulang")) {
      return <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-45" />;
    }
    return isPrimaryAction ? (
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
    ) : (
      <Home className="w-4 h-4 text-slate-500" />
    );
  };

  const renderButton = (action, isPrimaryAction) => {
    if (!action) return null;

    const baseClasses = isPrimaryAction
      ? "w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#2c1ee8] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-[#2c1ee8]/20 transition-all duration-200 cursor-pointer group"
      : "w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-sm border border-slate-200 transition-all duration-200 cursor-pointer group";

    const content = (
      <>
        {getButtonIcon(action.label, isPrimaryAction)}
        <span>{action.label}</span>
      </>
    );

    if (action.href) {
      return (
        <Link
          key={action.label}
          href={action.href}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={baseClasses}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={action.label}
        onClick={action.onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={baseClasses}
        type="button"
      >
        {content}
      </button>
    );
  };

  const contentCard = (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`relative z-10 w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-900/5 text-center flex flex-col items-center gap-5 ${className}`}
    >
      {/* 1. Dynamic Prominent Stylized Error Code Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black tracking-wider uppercase ring-1 shadow-xs ${getBadgeStyle(
          codeBadgeText,
          numericCode
        )}`}
      >
        <ShieldAlert className="w-4 h-4" />
        <span>{codeBadgeText.startsWith("ERR_") ? codeBadgeText : `HTTP ${codeBadgeText}`}</span>
      </motion.div>

      {/* 2. Centered Interactive Mascot */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.15,
        }}
        className="my-1 select-none"
      >
        <BloubMascot state={mascotState} size={200} interactiveGaze={true} />
      </motion.div>

      {/* 3. Typography Content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="space-y-2 max-w-md"
      >
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
          {title}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
          {description}
        </p>

        {/* Backend Errors Details List (if present) */}
        {errorList.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-left space-y-1">
            <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Detail Kesalahan:</span>
            </span>
            <ul className="list-disc list-inside text-xs text-rose-700 space-y-0.5 font-mono">
              {errorList.map((err, i) => (
                <li key={i}>{typeof err === "string" ? err : JSON.stringify(err)}</li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* 4. Action Buttons with Hover Mascot Reactions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="w-full pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        {renderButton(primary, true)}
        {renderButton(secondary, false)}
      </motion.div>
    </motion.div>
  );

  if (!fullPage) {
    return contentCard;
  }

  return (
    <div className="min-h-screen bg-gray-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden max-w-full w-full">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        {contentCard}
      </main>
      <Footer />
    </div>
  );
}

export default ErrorFallback;
