"use client";

import React from "react";
import DesktopComputerViewer3D from "@/components/common/DesktopComputerViewer3D";
import { motion } from "@/lib/motion";
import { Monitor, Cpu, HardDrive, ShieldCheck, Sparkles, Layers, Terminal, ArrowRight } from "lucide-react";
import Link from "next/link";

const COMPUTER_FEATURES = [
  {
    icon: Cpu,
    title: "Prosesor High-Performance",
    description: "Multi-core processor generasi terbaru untuk kompilasi cepat dan beban komputasi berat.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Monitor,
    title: "Display IPS High Refresh Rate",
    description: "Visual tajam dengan akurasi warna tinggi untuk pengembangan software dan UI/UX.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: HardDrive,
    title: "Storage Ultra NVMe SSD",
    description: "Kecepatan read/write tinggi untuk instant boot dan load environment proyek seketika.",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: Terminal,
    title: "Environment Ready-to-Code",
    description: "Terinstal alat pengembangan modern: VS Code, Docker, Git, Node.js, .NET SDK, & DB Tools.",
    color: "from-cyan-500 to-blue-600",
  },
];

export default function Desktop3DShowcaseSection() {
  return (
    <section className="w-full bg-slate-950 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-white select-none">
      {/* Background Glows & Accent Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>INTERACTIVE 3D EXPERIENCE</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight"
          >
            Simulasi 3D Desktop Computer{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Lab PPLG
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-sm sm:text-base leading-relaxed"
          >
            Eksplorasi unit komputer standar industri yang digunakan siswa Pengembangan Perangkat Lunak dan Gim (PPLG) SMKN 2 Surakarta secara 360 derajat.
          </motion.p>
        </div>

        {/* 3D Model Interactive Canvas Component */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <DesktopComputerViewer3D
            glbPath="/desktop_computer.glb"
            title="Desktop PC Station — Workstation PPLG"
            subtitle="Gunakan mouse/touch untuk memutar, zoom, dan berpindah sudut pandang"
          />
        </motion.div>

        {/* Specs & Hardware Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
          {COMPUTER_FEATURES.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-blue-500/40 hover:bg-slate-900 transition-all duration-300 shadow-lg hover:-translate-y-1"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} p-2.5 text-white shadow-md mb-4 flex items-center justify-center`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white group-hover:text-blue-300 transition-colors mb-1.5">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {feat.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA Card */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/80 border border-blue-500/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-lg font-bold text-white">Ingin Pinjam Lab Komputer atau Perangkat Sarpras?</h4>
            <p className="text-xs text-slate-300">Lihat jadwal ketersediaan lab dan ajukan peminjaman secara transparan lewat SIM Sarpras.</p>
          </div>
          <Link
            href="/fasilitas"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/30 shrink-0 cursor-pointer active:scale-95"
          >
            <span>Katalog Lab & Sarpras</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
