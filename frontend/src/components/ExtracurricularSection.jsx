"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "@/lib/motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ExtracurricularCollage from "./ExtracurricularCollage";
import PrimaryButton from "./PrimaryButton";
import { Compass, Sparkles, Users } from "lucide-react";
import MorphingSvg from "@/components/common/MorphingSvg";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ExtracurricularSection() {
  const sectionRef = useRef(null);
  const textContentRef = useRef(null);

  // GSAP Text Parallax Motion on Scroll
  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current || !textContentRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // Smooth text parallax movement
      tl.to(textContentRef.current, {
        y: "-25px",
        ease: "power1.out",
      });

      return () => {
        tl.kill();
      };
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="extracurricular"
      className="w-full bg-slate-50/70 border-y border-slate-200/60 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-visible bg-dots-pattern select-none z-10"
    >
      {/* Background SVG Morphing Ambient Star Element */}
      <MorphingSvg
        preset="star"
        size={580}
        duration={2}
        gradientId="extraStarGrad"
        triggerRef={sectionRef}
        className="absolute top-1/2 -left-24 -translate-y-1/2 opacity-35 pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center overflow-visible">
        
        {/* Left Column: Revolving Biang Lala Image Collage */}
        <div className="lg:col-span-6 w-full flex justify-center lg:justify-start overflow-visible">
          <ExtracurricularCollage containerRef={sectionRef} />
        </div>

        {/* Right Column: Text Content */}
        <div
          ref={textContentRef}
          className="lg:col-span-6 flex flex-col items-start relative z-20"
        >
          {/* Section Kicker */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-[#2c1ee8] text-[11px] font-mono tracking-widest uppercase mb-4 select-none">
            <Compass className="w-3.5 h-3.5 text-[#2c1ee8]" />
            <span className="font-semibold">Ekstrakurikuler</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-4 drop-shadow-2xs">
            Pengembangan Diri & <br className="hidden sm:inline" />
            Potensi Siswa
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 max-w-xl text-left font-normal">
            SMKN 2 Surakarta menyediakan wadah kegiatan ekstrakurikuler
            komprehensif mulai dari olahraga, seni budaya, teknologi, hingga
            organisasi kepemimpinan. Dirancang untuk membentuk karakter tangguh,
            mengasah minat bakat, serta membangun semangat kolaborasi siswa.
          </p>

          {/* Quick Highlight Badges Row */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#2c1ee8]" /> 20+ Ekstrakurikuler Active
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2c1ee8]" /> Pembinaan Prestasi
            </span>
          </div>

          {/* Primary CTA */}
          <div className="w-full sm:w-auto">
            <PrimaryButton
              href="/ekstrakurikuler"
              text="Daftar Ekstrakurikuler"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
