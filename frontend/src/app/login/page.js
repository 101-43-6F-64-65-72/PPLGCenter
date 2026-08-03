"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LoginForm from "@/features/auth/components/LoginForm";
import { useRouter } from "next/navigation";

let motionImport = null;

try {
  const m = require("motion/react");
  motionImport = m.motion;
} catch (e) {
  try {
    const f = require("framer-motion");
    motionImport = f.motion;
  } catch (e2) {}
}

const FallbackDiv = React.forwardRef(({ children, className, style, onClick }, ref) => (
  <div ref={ref} className={className} style={style} onClick={onClick}>
    {children}
  </div>
));
FallbackDiv.displayName = "FallbackDiv";

const MotionDiv = motionImport?.div || FallbackDiv;

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/profile");
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* 1. TOP SPLIT PANEL (Slide in from RIGHT) */}
      <MotionDiv
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 h-1/2 z-10 overflow-hidden bg-[#071329] border-b border-white/10"
      >
        <Image
          src="/images/hero-building.png"
          alt="SMK Negeri 2 Surakarta Building"
          fill
          className="object-cover object-top brightness-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071329]/80 via-[#071329]/60 to-[#071329]" />
      </MotionDiv>

      {/* 2. BOTTOM SPLIT PANEL (Slide in from LEFT) */}
      <MotionDiv
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 right-0 h-1/2 z-10 overflow-hidden bg-[#0a1931]"
      >
        <Image
          src="/images/hero-building.png"
          alt="SMK Negeri 2 Surakarta Building"
          fill
          className="object-cover object-bottom brightness-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071329] via-[#0a1931]/80 to-[#0a1931]/60" />
      </MotionDiv>

      {/* Main Content & Login Card (Fade & Pop In after split transition) */}
      <div className="relative z-20 w-full min-h-screen flex flex-col items-center justify-center px-4 py-24 sm:py-28">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md rounded-[32px] border border-white/20 bg-[#2c1ee8]/95 p-8 text-white shadow-2xl shadow-slate-950/70 backdrop-blur-xl transition-all font-sans my-auto"
        >
          {/* Top Back Link */}
          <div className="mb-6 flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              ← Kembali ke Beranda
            </Link>
          </div>

          {/* Header / Logo Branding (Original Design) */}
          <div className="mb-6 flex flex-col items-start gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 border border-white/20 shadow-inner">
              <Image
                src="/images/logo.png"
                alt="Logo SMKN 2 Surakarta"
                width={42}
                height={42}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                SMK NEGERI 2 SURAKARTA
              </h1>
              <p className="text-xs sm:text-sm text-white/80">
                Student Center Information & Services System
              </p>
            </div>
          </div>

          {/* Login Form inside Suspense boundary */}
          <React.Suspense fallback={
            <div className="p-6 text-center text-sm font-medium text-white/80 animate-pulse">
              Memuat formulir login...
            </div>
          }>
            <LoginForm onSuccess={handleSuccess} />
          </React.Suspense>
        </MotionDiv>
      </div>
    </div>
  );
}
