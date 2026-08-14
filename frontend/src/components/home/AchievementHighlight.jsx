"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { Award, Trophy, Star, Medal, Sparkles, ArrowRight } from "lucide-react";

const ACHIEVEMENTS = [
  {
    category: "LKS Keahlian 2025",
    title: "Juara 1 Lomba Kompetensi Siswa Bidang Software Engineering",
    student: "Tim Rekayasa Perangkat Lunak",
    level: "Tingkat Provinsi Jawa Tengah",
    badge: "Emas",
    bg: "from-amber-500/10 to-orange-500/5 border-amber-200/80",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    category: "Olimpiade Sains & Teknologi",
    title: "Medali Perak Web Technologies & Cyber Security",
    student: "Siswa Teknik Komputer Jaringan",
    level: "Tingkat Nasional",
    badge: "Perak",
    bg: "from-blue-500/10 to-indigo-500/5 border-blue-200/80",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    category: "Seni & Kepramukaan",
    title: "Juara Umum Kemah Karakter & Pentas Seni Pelajar",
    student: "Ambalan Pramuka SMKN 2 Surakarta",
    level: "Kota Surakarta",
    badge: "Juara Umum",
    bg: "from-emerald-500/10 to-teal-500/5 border-emerald-200/80",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
];

export default function AchievementHighlight() {
  return (
    <section className="w-full bg-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#2c1ee8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Kebanggaan Sekolah</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Prestasi & Karya Unggulan Siswa
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md font-normal">
            Bukti nyata dedikasi dan kerja keras siswa-siswi SMK Negeri 2 Surakarta di berbagai ajang kompetisi keahlian, akademik, dan non-akademik.
          </p>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ACHIEVEMENTS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`bg-gradient-to-b ${item.bg} bg-slate-800/80 border rounded-2xl p-6 flex flex-col justify-between backdrop-blur-sm hover:border-slate-600 transition-all duration-300 group`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white leading-snug mb-3 group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
              </div>

              <div className="pt-4 border-t border-slate-700/60 mt-4 flex justify-between items-end text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">{item.student}</span>
                  <span className="text-slate-300 font-semibold">{item.level}</span>
                </div>
                <Medal className="w-5 h-5 text-amber-400 shrink-0 opacity-80" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Student Voice Quote Strip */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 bg-slate-700">
              <Image
                src="/images/smknegeri2surakarta_cover.webp"
                alt="SMKN 2 Student"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-200 italic font-medium leading-relaxed">
                &ldquo;Student Center memudahkan organisasi kami berkolaborasi, mengurus pendaftaran ekskul, dan membagikan informasi berita dengan cepat.&rdquo;
              </p>
              <span className="text-xs font-bold text-amber-400 mt-1 block">
                — Pengurus OSIS SMKN 2 Surakarta
              </span>
            </div>
          </div>

          <Link
            href="/mading"
            className="inline-flex items-center justify-center gap-2 shrink-0 bg-[#2c1ee8] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md"
          >
            <span>Jelajahi Mading & Prestasi</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
