"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, LogIn, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

/**
 * Reusable Login Required Fallback Component
 * Renders a high-end, friendly prompt when an unauthenticated visitor tries to access protected or restricted API data.
 */
export const LoginRequiredFallback = ({
  title,
  description,
  featureName = "Fitur Ini",
  redirectPath = null,
  className = "",
}) => {
  const pathname = usePathname();
  const targetUrl = redirectPath || pathname || "/";
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(targetUrl)}`;

  const defaultTitle = `Akses ${featureName} Memerlukan Login`;
  const defaultDesc = `Untuk melihat informasi lengkap ${featureName.toLowerCase()} dan berinteraksi di Student Center SMK Negeri 2 Surakarta, silakan masuk terlebih dahulu dengan akun siswa atau guru Anda.`;

  return (
    <div
      className={`my-12 p-8 sm:p-12 lg:p-14 rounded-[32px] bg-gradient-to-b from-blue-50/70 via-white to-indigo-50/40 border border-blue-100/90 shadow-xl shadow-blue-500/5 flex flex-col items-center justify-center text-center max-w-xl mx-auto transition-all duration-300 ${className}`}
    >
      {/* Icon Badge Container */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1d4ed8] to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-all duration-300">
          <Lock className="w-10 h-10 stroke-[2.2]" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white text-[#1d4ed8] border-2 border-blue-100 flex items-center justify-center shadow-md">
          <Sparkles className="w-4 h-4 fill-blue-500 text-blue-500" />
        </div>
      </div>

      {/* Access Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100/80 text-[#1d4ed8] border border-blue-200 text-xs font-extrabold uppercase tracking-wider mb-3">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Satu Pintu Akses Siswa</span>
      </div>

      {/* Heading Title */}
      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
        {title || defaultTitle}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-8 max-w-md font-normal">
        {description || defaultDesc}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-sm">
        <Link
          href={loginUrl}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1d4ed8] hover:bg-[#153e90] active:bg-[#102a5c] text-white font-bold text-sm rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
        >
          <LogIn className="w-4 h-4" />
          <span>Login Sekarang</span>
        </Link>

        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm rounded-full shadow-xs transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
          <span>Ke Beranda</span>
        </Link>
      </div>
    </div>
  );
};

export default LoginRequiredFallback;
