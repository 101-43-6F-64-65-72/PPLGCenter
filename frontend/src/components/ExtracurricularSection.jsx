"use client";

import React from "react";
import { motion } from "@/lib/motion";
import ExtracurricularCollage from "./ExtracurricularCollage";
import PrimaryButton from "./PrimaryButton";

export default function ExtracurricularSection() {
  return (
    <section
      id="extracurricular"
      className="w-full bg-slate-50/70 border-y border-slate-100 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
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
          <span className="text-xs font-bold tracking-wider text-[#2c1ee8] uppercase mb-2">
            Ekstrakurikuler
          </span>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
            Pengembangan Diri & Potensi Siswa
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-xl text-left font-normal">
            SMKN 2 Surakarta menyediakan wadah kegiatan ekstrakurikuler komprehensif
            mulai dari olahraga, seni budaya, teknologi, hingga organisasi kepemimpinan.
            Dirancang untuk membentuk karakter tangguh, mengasah minat bakat, serta
            membangun semangat kolaborasi siswa.
          </p>

          <div className="w-full sm:w-auto">
            <PrimaryButton href="/ekstrakurikuler" text="Daftar Ekstrakurikuler" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}


