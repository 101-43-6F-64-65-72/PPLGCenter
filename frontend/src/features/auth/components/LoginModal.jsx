"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "@/components/common/Icons";
import { ArrowLeft } from "lucide-react";
import BloubMascot from "@/components/BloubMascot";
import LoginForm from "./LoginForm";
import useAuth from "@/hooks/useAuth";
import gsap from "gsap";

export const LoginModal = ({ isOpen, onClose, onSuccess, mandatory = false }) => {
  const [mascotState, setMascotState] = useState("idle");

  // DOM Refs for GSAP
  const fullScreenContainerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightHeroRef = useRef(null);
  const bgImageRef = useRef(null);
  const mascotRef = useRef(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setMascotState("idle");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // GSAP Full Screen Entrance Animation
  useEffect(() => {
    if (!isOpen || !fullScreenContainerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Right hero background zoom & fade in
      if (bgImageRef.current) {
        tl.fromTo(
          bgImageRef.current,
          { scale: 1.08, opacity: 0.7 },
          { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" },
          0
        );
      }

      // 2. Left panel slide-in
      if (leftPanelRef.current) {
        tl.fromTo(
          leftPanelRef.current,
          { xPercent: -100, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.75, ease: "expo.out" },
          0.05
        );
      }

      // 3. Large Replyz Mascot Pop-in with Elastic Overshoot
      if (mascotRef.current) {
        tl.fromTo(
          mascotRef.current,
          { scale: 0, rotate: -30, opacity: 0 },
          { scale: 1, rotate: 0, opacity: 1, duration: 0.85, ease: "elastic.out(1, 0.55)" },
          0.35
        );

        // Continuous subtle float
        gsap.to(mascotRef.current, {
          y: "-=10",
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, fullScreenContainerRef);

    return () => ctx.revert();
  }, [isOpen]);

  const handleClose = () => {
    if (leftPanelRef.current && fullScreenContainerRef.current) {
      gsap.to(leftPanelRef.current, {
        xPercent: -100,
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
      });
      gsap.to(fullScreenContainerRef.current, {
        opacity: 0,
        duration: 0.35,
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  const handleSuccess = (res) => {
    if (onSuccess) onSuccess(res);
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={fullScreenContainerRef}
      className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-white text-slate-900 flex flex-col md:flex-row select-none font-sans overflow-hidden"
    >
      {/* ─── LEFT FULL-HEIGHT PANEL: Pure White #ffffff ─── */}
      <div
        ref={leftPanelRef}
        className="w-full md:w-[380px] lg:w-[420px] xl:w-[460px] h-full min-h-screen bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-12 z-20 relative shrink-0 border-r border-slate-200 overflow-visible shadow-sm"
      >
        {/* Top Bar: Close / Back Action */}
        <div className="w-full flex items-center justify-between mb-4">
          {!mandatory ? (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-black transition-colors duration-200 group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1 text-[#2c1ee8]" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {!mandatory && (
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black flex items-center justify-center transition-colors cursor-pointer border border-slate-300 z-30"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center: In-Place LoginForm with 3D Perspective Slide Transitions */}
        <div className="w-full my-auto py-2">
          <LoginForm
            onSuccess={handleSuccess}
            mascotState={mascotState}
            setMascotState={setMascotState}
          />
        </div>

        {/* Bottom Footer */}
        <footer className="w-full pt-4 mt-auto text-[11px] text-slate-400">
          <span>&copy; {new Date().getFullYear()} PPLG SMKN 2 Surakarta</span>
        </footer>

        {/* ─── Replyz Mascot: 50% on White Left Panel & 50% on Right Image (Not Clickable) ─── */}
        <div
          ref={mascotRef}
          className="absolute bottom-10 right-0 translate-x-1/2 z-30 hidden md:flex items-center justify-center pointer-events-none select-none"
        >
          <BloubMascot size={150} state={mascotState} badge={false} />
        </div>
      </div>

      {/* ─── RIGHT FULL-HEIGHT PANEL: Bright Natural School Hero Image ─── */}
      <div
        ref={rightHeroRef}
        className="hidden md:block flex-1 h-full min-h-screen relative bg-slate-100 overflow-hidden"
      >
        <div ref={bgImageRef} className="absolute inset-0 w-full h-full">
          <Image
            src="/images/tempat/halamandepansmkn2ska.jpg"
            alt="Gedung SMKN 2 Surakarta"
            fill
            sizes="70vw"
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-black/5" />
      </div>
    </div>
  );
};

export default LoginModal;
