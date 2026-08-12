"use client";

import React from "react";
import { motion } from "@/lib/motion";
import ExtracurricularCollage from "./ExtracurricularCollage";
import PrimaryButton from "./PrimaryButton";
import { Compass, Sparkles, Users } from "lucide-react";

export default function ExtracurricularSection() {
  return (
    <section
      id="extracurricular"
      className="w-full bg-slate-50/70 border-y border-slate-200/60 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-dots-pattern"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Image Collage */}
        <div className="lg:col-span-6 w-full flex justify-center lg:justify-start">
          <ExtracurricularCollage />
        </div>

        {/* Right Column: Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="lg:col-span-6 flex flex-col items-start"
        >
          {/* Section Kicker */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-mono tracking-widest uppercase mb-4 select-none">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold">Ekstrakurikuler</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
            Pengembangan Diri & Potensi Siswa
          </h2>

          <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-xl text-left font-normal">
            SMKN 2 Surakarta menyediakan wadah kegiatan ekstrakurikuler
            komprehensif mulai dari olahraga, seni budaya, teknologi, hingga
            organisasi kepemimpinan. Dirancang untuk membentuk karakter tangguh,
            mengasah minat bakat, serta membangun semangat kolaborasi siswa.
          </p>

          {/* Quick Highlight Badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-blue-600" /> 20+ Ekstrakurikuler Active
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Pembinaan Prestasi
            </span>
          </div>

          <div className="w-full sm:w-auto">
            <PrimaryButton
              href="/ekstrakurikuler"
              text="Daftar Ekstrakurikuler"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

