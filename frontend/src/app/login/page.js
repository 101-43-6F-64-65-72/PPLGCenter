"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LoginForm from "@/features/auth/components/LoginForm";
import BloubMascot from "@/components/BloubMascot";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import gsap from "gsap";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [mascotState, setMascotState] = useState("idle");

  const containerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const bgImageRef = useRef(null);
  const mascotRef = useRef(null);

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, router]);

  // GSAP Entrance Timeline Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (bgImageRef.current) {
        tl.fromTo(
          bgImageRef.current,
          { scale: 1.08, opacity: 0.7 },
          { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" },
          0
        );
      }

      if (leftPanelRef.current) {
        tl.fromTo(
          leftPanelRef.current,
          { xPercent: -100, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.75, ease: "expo.out" },
          0.05
        );
      }

      if (mascotRef.current) {
        tl.fromTo(
          mascotRef.current,
          { scale: 0, rotate: -25, opacity: 0 },
          { scale: 1, rotate: 0, opacity: 1, duration: 0.85, ease: "elastic.out(1, 0.55)" },
          0.35
        );

        gsap.to(mascotRef.current, {
          y: "-=10",
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSuccess = () => {
    router.push("/");
  };

  return (
    <main
      ref={containerRef}
      className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans overflow-hidden relative"
    >
      {/* ─── LEFT PANEL: Pure White Background (Naturally Contained, No Scroll Glitch) ─── */}
      <section
        ref={leftPanelRef}
        className="w-full md:w-[420px] lg:w-[460px] xl:w-[480px] min-h-screen bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 z-20 relative shrink-0 border-r border-slate-200 shadow-sm"
      >
        {/* Top Back Navigation */}
        <div className="w-full flex items-center justify-between mb-4 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-black transition-colors duration-200 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1 text-[#2c1ee8]" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="w-full my-auto py-1">
          <React.Suspense
            fallback={
              <div className="p-6 text-center text-xs font-medium text-slate-500 bg-slate-50 rounded animate-pulse">
                Memuat formulir login...
              </div>
            }
          >
            <LoginForm
              onSuccess={handleSuccess}
              mascotState={mascotState}
              setMascotState={setMascotState}
            />
          </React.Suspense>
        </div>

        {/* Bottom Footer */}
        <footer className="w-full pt-4 mt-auto text-[11px] text-slate-400 shrink-0">
          <span>&copy; {new Date().getFullYear()} PPLG SMKN 2 Surakarta</span>
        </footer>

        {/* ─── Replyz Mascot: 50% on White Left Panel & 50% on Right Image (Not Clickable) ─── */}
        <div
          ref={mascotRef}
          className="absolute bottom-8 right-0 translate-x-1/2 z-30 hidden md:flex items-center justify-center pointer-events-none select-none"
        >
          <BloubMascot size={145} state={mascotState} badge={false} />
        </div>
      </section>

      {/* ─── RIGHT HERO PANEL: School Building Photo ─── */}
      <section
        ref={rightPanelRef}
        className="hidden md:block flex-1 min-h-screen relative bg-slate-100 overflow-hidden"
      >
        <div ref={bgImageRef} className="absolute inset-0 w-full h-full">
          <Image
            src="/images/tempat/halamandepansmkn2ska.jpg"
            alt="Gedung SMK Negeri 2 Surakarta"
            fill
            sizes="70vw"
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-black/5" />
      </section>
    </main>
  );
}
