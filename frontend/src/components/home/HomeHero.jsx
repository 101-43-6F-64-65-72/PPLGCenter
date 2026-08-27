"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import useAuth from "@/hooks/useAuth";
import gsap from "gsap";

const DYNAMIC_MESSAGES = [
  "Wujudkan inovasi teknologi dan keahlian software engineering kelas dunia.",
  "PPLG Center — Pusat Kolaborasi, Kreativitas, dan Keunggulan Digital Kejuruan.",
  "Pantau jadwal pelajaran harian, materi praktikum, dan agenda akademik sekolah.",
  "Hari ini adalah langkah baru untuk terus mengasah skill pemrograman dan logika.",
  "Eksplorasi modul pembelajaran, kuis harian, dan informasi terkini di portal PPLG.",
];

export default function HomeHero() {
  const { user, isAuthenticated } = useAuth();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const heroRef = useRef(null);
  const textRef = useRef(null);
  const dynamicMsgRef = useRef(null);

  // Determine user display name
  const userName = isAuthenticated && user?.fullName
    ? user.fullName.split(" ")[0]
    : isAuthenticated && user?.name
    ? user.name.split(" ")[0]
    : "Siswa";

  // Rotating dynamic texts with GSAP fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      if (dynamicMsgRef.current) {
        gsap.to(dynamicMsgRef.current, {
          y: -6,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            setCurrentMessageIndex((prev) => (prev + 1) % DYNAMIC_MESSAGES.length);
            gsap.fromTo(
              dynamicMsgRef.current,
              { y: 6, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
            );
          },
        });
      } else {
        setCurrentMessageIndex((prev) => (prev + 1) % DYNAMIC_MESSAGES.length);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Entrance animation for hero text
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(textRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out",
        delay: 0.1,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] min-h-[600px] bg-slate-950 overflow-hidden font-sans select-none flex flex-col justify-end"
    >
      {/* ─── Hero Background Image: Gedung PPLG Astra Sinarmas SMKN 2 Surakarta ─── */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/gedung-sinarmas.jpg"
          alt="Gedung PPLG Astra Sinarmas SMKN 2 Surakarta"
          fill
          sizes="100vw"
          className="object-cover object-center lg:object-[center_30%]"
          priority
        />
      </div>

      {/* ─── Clean Subtle Gradient Overlay for Text Contrast ─── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />

      {/* ─── Bottom-Left Typography (Full Screen Viewport with Clean Compact Scale) ─── */}
      <div
        ref={textRef}
        className="relative z-20 pb-12 sm:pb-16 lg:pb-20 px-6 sm:px-10 lg:px-16 max-w-2xl space-y-1.5"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
          Halo {userName}, selamat <br className="hidden sm:inline" />
          datang.
        </h1>

        {/* Dynamic Rotating Message */}
        <p
          ref={dynamicMsgRef}
          className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed drop-shadow pt-0.5 max-w-xl"
        >
          {DYNAMIC_MESSAGES[currentMessageIndex]}
        </p>
      </div>
    </section>
  );
}
