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
          {/* 1. TOP SPLIT PANEL (Slides in from RIGHT) */}
          <MotionDiv
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 h-1/2 z-50 overflow-hidden bg-[#071329] border-b border-white/10"
          >
            <Image
              src="/images/tempat/halamandepansmkn2ska.jpg"
              alt="Halaman Depan SMK Negeri 2 Surakarta"
              fill
              sizes="100vw"
              className="object-cover object-top brightness-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#071329]/90 via-[#071329]/75 to-[#071329]" />
          </MotionDiv>

          {/* 2. BOTTOM SPLIT PANEL (Slides in from LEFT) */}
          <MotionDiv
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 h-1/2 z-50 overflow-hidden bg-[#0a1931]"
          >
            <Image
              src="/images/tempat/halamandepansmkn2ska.jpg"
              alt="Halaman Depan SMK Negeri 2 Surakarta"
              fill
              sizes="100vw"
              className="object-cover object-bottom brightness-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071329] via-[#0a1931]/90 to-[#0a1931]/75" />
          </MotionDiv>

          {/* 3. LOGIN CARD OVERFLOW (Appears centered on top of split background) */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
          >
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-[32px] border border-white/20 bg-[#2c1ee8]/95 p-8 text-white shadow-2xl shadow-slate-950/80 backdrop-blur-xl font-sans my-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 cursor-pointer border border-white/20 hover:scale-105 active:scale-95"
                aria-label="Tutup Modal Login"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header / Logo Branding (Exact Original Blue Card Design) */}
              <div className="mb-6 flex flex-col items-start gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 border border-white/20 shadow-inner">
                  <Image
                    src="/images/logo.png"
                    alt="Logo SMKN 2 Surakarta"
                    width={42}
                    height={42}
                    style={{ width: "auto", height: "auto" }}
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

              {/* Form Container */}
              <LoginForm onSuccess={onSuccess} />
            </MotionDiv>
          </div>
        </div>
      )}
    </AnimatePresenceComponent>
  );
};

export default LoginModal;
