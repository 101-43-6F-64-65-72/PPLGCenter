"use client";

import React from "react";
import { motion } from "@/lib/motion";
import ExtracurricularCollage from "./ExtracurricularCollage";
import PrimaryButton from "./PrimaryButton";

export default function ExtracurricularSection() {
  return (
    <section
      id="extracurricular"
      className="w-full bg-slate-50/60 border-y border-slate-100 py-14 sm:py-18 lg:py-22 px-4 sm:px-8 lg:px-12 relative overflow-hidden"
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
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-4"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 leading-tight mb-5">
            Pengembangan Diri Lewat Ekstrakurikuler
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed mb-6 lg:mb-8 max-w-xl font-normal text-justify">
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

