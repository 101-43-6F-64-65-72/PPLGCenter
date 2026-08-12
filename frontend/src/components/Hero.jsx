"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { Trophy, ShieldCheck, GraduationCap, MapPin, Sparkles } from "lucide-react";
import PrimaryButton from "./PrimaryButton";
import { resolveImageUrl } from "@/lib/utils";

const HERO_STATS = [
  {
    icon: ShieldCheck,
    title: "Akreditasi Unggul",
    subtitle: "Nilai A (Sangat Baik)",
  },
  {
    icon: Trophy,
    title: "Berprestasi",
    subtitle: "Tingkat Nasional",
  },
  {
    icon: GraduationCap,
    title: "Kurikulum Industri",
    subtitle: "Diselaraskan DUDI",
  },
];

export default function Hero() {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 3D Parallax Tilt Effect on Mouse Move
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 16, y: -y * 16 });
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      id="home"
      className="w-full bg-gradient-to-b from-blue-50/40 via-white to-white py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-grid-pattern select-none"
    >
      {/* Background ambient lighting blur */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Heading, Subtitle & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="lg:col-span-6 flex flex-col items-start"
        >
          {/* Live Status Pill Kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2c1ee8] text-[11px] font-mono tracking-wider uppercase mb-6 shadow-2xs select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2c1ee8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2c1ee8]" />
            </span>
            <span className="font-semibold">Student Center SMKN 2 Surakarta</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-5">
            Mencetak Lulusan Unggul &{" "}
            <span className="text-[#2c1ee8] underline decoration-blue-500/40 decoration-wavy decoration-2 underline-offset-4">
              Ready-to-Work
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl text-left font-normal">
            Program pengembangan sekolah kejuruan terdepan untuk menghasilkan
            lulusan kompeten dan berkarakter, diselaraskan secara mendalam
            dengan kebutuhan dunia usaha, industri, dan kerja (DUDI).
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
            <PrimaryButton text="Jelajahi Portal" href="/ekstrakurikuler" />
            <Link
              href="/fasilitas"
              className="inline-flex items-center justify-center font-semibold text-sm sm:text-base px-6 py-3.5 rounded-2xl border border-slate-200/90 text-slate-800 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.97] select-none"
            >
              Katalog Fasilitas
            </Link>
          </div>

          {/* Integrated Highlights / Stats Grid */}
          <div className="w-full grid grid-cols-3 gap-3 sm:gap-4 border-t border-slate-200/80 pt-6">
            {HERO_STATS.map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <div key={idx} className="flex flex-col items-start gap-1.5 p-2 rounded-xl hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-1.5 text-slate-900 text-xs font-semibold">
                    <div className="p-1 rounded-md bg-blue-50 text-[#2c1ee8] border border-blue-100 shrink-0">
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-900 font-bold text-xs sm:text-sm truncate">
                      {stat.title}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 truncate pl-0.5">
                    {stat.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column: Interactive 3D Cursor Parallax Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="lg:col-span-6 w-full flex justify-center lg:justify-end"
        >
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl cursor-pointer"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              animate={{
                rotateY: tilt.x,
                rotateX: tilt.y,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative w-full h-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-2xl shadow-blue-900/15 group"
            >
              {/* Dynamic Interactive Spotlight Flare */}
              <div
                className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20"
                style={{
                  background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.15), transparent 80%)`,
                }}
              />

              {/* School Cover Image */}
              <Image
                src={resolveImageUrl("/images/smknegeri2surakarta_cover.webp")}
                alt="SMK Negeri 2 Surakarta"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
              
              {/* Top Floating Glass Badge with 3D Depth */}
              <div className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold tracking-wide shadow-md inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>SMKN 2 Surakarta</span>
              </div>

              {/* Bottom Info Lockup */}
              <div className="absolute bottom-5 left-5 right-5 text-white z-20 flex flex-col gap-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-blue-300 tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Area Sekolah Utama</span>
                </div>
                <span className="text-lg sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  SMK Negeri 2 Surakarta
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
