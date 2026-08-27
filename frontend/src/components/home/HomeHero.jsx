"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import gsap from "gsap";
import { ArrowDown, Compass } from "lucide-react";

const DYNAMIC_MESSAGES = [
  "Wujudkan inovasi teknologi dan keahlian software engineering kelas dunia.",
  "Pusat Kolaborasi, Kreativitas, dan Keunggulan Digital Kejuruan RPL.",
  "Pantau jadwal pelajaran harian, materi praktikum, dan agenda akademik sekolah.",
  "Langkah baru untuk terus mengasah skill pemrograman dan logika komputasi.",
  "Eksplorasi modul pembelajaran, kuis harian, dan informasi terkini di portal.",
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

  const handleScrollToSchedule = (e) => {
    e.preventDefault();
    const scheduleSection = document.getElementById("jadwal-hari-ini");
    if (scheduleSection) {
      scheduleSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative w-full h-[70vh] min-h-[460px] sm:min-h-[560px] sm:h-[calc(100vh-5rem)] lg:h-[88vh] bg-slate-950 overflow-hidden font-sans select-none flex flex-col justify-end"
    >
      {/* ─── Hero Background Image: Gedung PPLG Astra Sinarmas SMKN 2 Surakarta ─── */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/gedung-sinarmas.jpg"
          alt="Gedung PPLG Astra Sinarmas SMKN 2 Surakarta"
          fill
          sizes="100vw"
          className="object-cover object-[center_35%] sm:object-center lg:object-[center_30%]"
          priority
        />
      </div>

      {/* ─── Clean Subtle Gradient Overlay for Text Contrast ─── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

      {/* ─── Bottom-Left Typography (Mobile & Desktop Tailored) ─── */}
      <div
        ref={textRef}
        className="relative z-20 pb-8 sm:pb-16 lg:pb-20 px-5 sm:px-10 lg:px-16 max-w-2xl space-y-2.5 sm:space-y-3"
      >
        {/* Overline Tag */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2C1EE8] text-white text-[9.5px] sm:text-xs font-black uppercase tracking-widest rounded-none shadow-xs">
          <span>PPLG Center · SMKN 2 Surakarta</span>
        </div>

        {/* Hero Greeting Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight sm:leading-snug drop-shadow-md">
          Halo {userName}, selamat <br className="inline" />
          datang.
        </h1>

        {/* Dynamic Rotating Message */}
        <p
          ref={dynamicMsgRef}
          className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed drop-shadow-sm max-w-xl line-clamp-2 sm:line-clamp-none min-h-[32px] sm:min-h-0"
        >
          {DYNAMIC_MESSAGES[currentMessageIndex]}
        </p>

        {/* Direct Action Buttons for Mobile & Desktop */}
        <div className="pt-1.5 flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleScrollToSchedule}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-xs"
          >
            <span>Jadwal Hari Ini</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <Link
            href="/kelas"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-none border border-white/20 transition-colors cursor-pointer backdrop-blur-xs"
          >
            <Compass className="w-3.5 h-3.5 text-blue-300" />
            <span>Jelajahi Portal</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
