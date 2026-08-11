"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { Trophy, ShieldCheck, GraduationCap } from "lucide-react";
import PrimaryButton from "./PrimaryButton";

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
  return (
    <section
      id="home"
      className="w-full bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Heading, Subtitle & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="lg:col-span-6 flex flex-col items-start"
        >
          {/* Section Kicker / Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/80 text-[#2c1ee8] text-xs font-semibold tracking-wide uppercase mb-5">
            <span>Student Center SMKN 2 Surakarta</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-5">
            Mencetak Lulusan Unggul & Ready-to-Work
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-xl text-left font-normal">
            Program pengembangan sekolah kejuruan terdepan untuk menghasilkan
            lulusan kompeten dan berkarakter, diselaraskan secara mendalam
            dengan kebutuhan dunia usaha, industri, dan kerja (DUDI).
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
            <PrimaryButton text="Jelajahi Portal" href="/ekstrakurikuler" />
            <Link
              href="/fasilitas"
              className="inline-flex items-center justify-center font-semibold text-sm sm:text-base px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
            >
              Katalog Fasilitas
            </Link>
          </div>

          {/* Clean Integrated Highlights / Stats Grid */}
          <div className="w-full grid grid-cols-3 gap-3 sm:gap-4 border-t border-slate-100 pt-6">
            {HERO_STATS.map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <div key={idx} className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold">
                    <IconComp className="w-4 h-4 shrink-0 text-[#2c1ee8]" />
                    <span className="text-slate-900 font-bold text-xs sm:text-sm truncate">
                      {stat.title}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 truncate">
                    {stat.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column: Hero Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="lg:col-span-6 w-full flex justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-[480px] aspect-[4/3] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
            <Image
              src="/images/smknegeri2surakarta_cover.webp"
              alt="SMK Negeri 2 Surakarta"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-xs font-medium text-slate-200 uppercase tracking-wider block">
                Kampus Utama
              </span>
              <span className="text-sm sm:text-base font-bold text-white">
                SMK Negeri 2 Surakarta
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
