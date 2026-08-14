"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import LoginForm from "./LoginForm";
import { X } from "@/components/common/Icons";

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

export const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  // Lock body scroll when overlay is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresenceComponent mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 select-none font-sans">
          {/* 1. TOP SPLIT PANEL (Slides in smoothly from TOP with dark overlay) */}
          <MotionDiv
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 h-1/2 z-50 overflow-hidden bg-[#071329] border-b border-white/10"
          >
            <Image
              src="/images/tempat/halamandepansmkn2ska.jpg"
              alt="Halaman Depan SMK Negeri 2 Surakarta"
              fill
              sizes="100vw"
              className="object-cover object-top brightness-60 scale-105 transition-transform duration-1000"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#071329]/95 via-[#071329]/80 to-[#071329]" />
          </MotionDiv>

          {/* 2. BOTTOM SPLIT PANEL (Slides in smoothly from BOTTOM) */}
          <MotionDiv
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 h-1/2 z-50 overflow-hidden bg-[#0a1931]"
          >
            <Image
              src="/images/tempat/halamandepansmkn2ska.jpg"
              alt="Halaman Depan SMK Negeri 2 Surakarta"
              fill
              sizes="100vw"
              className="object-cover object-bottom brightness-60 scale-105 transition-transform duration-1000"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071329] via-[#0a1931]/95 to-[#0a1931]/80" />
          </MotionDiv>

          {/* 3. LOGIN CARD OVERLAY WITH SPRING ANIMATION & GLOW ORBS */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 [perspective:1200px]"
            onClick={onClose}
          >
            <MotionDiv
              initial={{ opacity: 0, scale: 0.82, y: 35, rotateX: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25, rotateX: 6 }}
              transition={{ delay: 0.25, duration: 0.45, type: "spring", stiffness: 320, damping: 26 }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-full max-w-md rounded-[36px] border border-white/25 bg-[#2c1ee8]/95 p-7 sm:p-8 text-white shadow-2xl shadow-slate-950/80 backdrop-blur-2xl font-sans my-auto pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glowing Ambient Background Accents */}
              <div className="absolute -top-16 -left-16 w-60 h-60 bg-blue-400/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-indigo-400/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 cursor-pointer border border-white/20 hover:scale-110 hover:rotate-90 active:scale-95 z-20 shadow-md"
                aria-label="Tutup Modal Login"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header / Logo Branding */}
              <div className="mb-6 flex flex-row items-center gap-3.5 py-1 relative z-10">
                <div className="flex h-15 w-15 items-center justify-center rounded-2xl bg-white/15 border border-white/30 shadow-inner backdrop-blur-md shrink-0 transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/images/logo.png"
                    alt="Logo SMKN 2 Surakarta"
                    width={40}
                    height={40}
                    style={{ width: "auto", height: "auto" }}
                    className="object-contain drop-shadow-md"
                    priority
                  />
                </div>
                <div>
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-blue-200 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20 mb-1">
                    SMK NEGERI 2 SURAKARTA
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                    Student Center
                  </h1>
                </div>
              </div>

              {/* Form Container */}
              <div className="relative z-10">
                <LoginForm onSuccess={onSuccess} />
              </div>
            </MotionDiv>
          </div>
        </div>
      )}
    </AnimatePresenceComponent>
  );
};

export default LoginModal;
