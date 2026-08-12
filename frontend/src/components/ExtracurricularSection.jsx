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
  const wheelRef = useRef(null);
  const cardsRef = useRef([]);

  // GSAP ScrollTrigger Pinned Showcase with refreshPriority & 100% Upright Images & Full Overflow Visible
  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const wheel = wheelRef.current;
      const cardEls = cardsRef.current.filter(Boolean);
      if (!wheel || cardEls.length < 4) return;

      // Pinned GSAP ScrollTrigger Timeline with refreshPriority: 1 & Silky Smooth Reveal
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=1600",
          pin: true,
          pinSpacing: true,
          scrub: 1.4,
          anticipatePin: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. Orbital Pivot Sweep (-50deg to 0deg)
      tl.fromTo(
        wheel,
        { rotation: -50 },
        {
          rotation: 0,
          ease: "power2.out",
          force3D: true,
        },
        0
      );

      // 2. Card 0 (Top-Left): Fluid reveal counter-rotation (+50deg -> 0deg)
      tl.fromTo(
        cardEls[0],
        { rotation: 50, scale: 0.75, x: "15px", y: "15px", opacity: 0.3 },
        {
          rotation: 0,
          scale: 1.05,
          x: "-35px",
          y: "-20px",
          opacity: 1,
          ease: "power3.out",
          force3D: true,
        },
        0
      );

      // 3. Card 1 (Top-Right): Fluid reveal counter-rotation (+50deg -> 0deg)
      tl.fromTo(
        cardEls[1],
        { rotation: 50, scale: 0.72, x: "-15px", y: "15px", opacity: 0.3 },
        {
          rotation: 0,
          scale: 0.9,
          x: "40px",
          y: "-18px",
          opacity: 1,
          ease: "power3.out",
          force3D: true,
        },
        0
      );

      // 4. Card 2 (Bottom-Left): Fluid reveal counter-rotation (+50deg -> 0deg)
      tl.fromTo(
        cardEls[2],
        { rotation: 50, scale: 0.72, x: "15px", y: "-15px", opacity: 0.3 },
        {
          rotation: 0,
          scale: 0.92,
          x: "-30px",
          y: "25px",
          opacity: 1,
          ease: "power3.out",
          force3D: true,
        },
        0
      );

      // 5. Card 3 (Bottom-Right): Fluid reveal counter-rotation (+50deg -> 0deg)
      tl.fromTo(
        cardEls[3],
        { rotation: 50, scale: 0.75, x: "-15px", y: "-15px", opacity: 0.3 },
        {
          rotation: 0,
          scale: 1.08,
          x: "35px",
          y: "22px",
          opacity: 1,
          ease: "power3.out",
          force3D: true,
        },
        0
      );

      // 6. Centered Text smooth scale & float reveal
      if (textContentRef.current) {
        tl.fromTo(
          textContentRef.current,
          { scale: 0.92, y: "24px", opacity: 0.5 },
          { scale: 1, y: "0px", opacity: 1, ease: "power2.out" },
          0
        );
      }

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);

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
      className="w-full bg-slate-50/70 border-t border-slate-200/80 relative overflow-visible bg-dots-pattern select-none z-10 py-24 sm:py-32"
    >
      {/* Background SVG Morphing Ambient Star Element */}
      <MorphingSvg
        preset="star"
        size={680}
        duration={2}
        gradientId="extraStarGrad"
        triggerRef={sectionRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-0 min-h-[580px] flex items-center justify-center relative overflow-visible">
        <div className="relative max-w-6xl mx-auto min-h-[560px] w-full flex items-center justify-center overflow-visible">
          
          {/* Encircling Orbiting Biang Lala Image Collage (Surrounding Center Text) */}
          <ExtracurricularCollage
            wheelRef={wheelRef}
            cardsRef={cardsRef}
          />

          {/* Centered Main Text Content */}
          <div
            ref={textContentRef}
            className="flex flex-col items-center text-center max-w-2xl mx-auto relative z-20 pointer-events-auto px-4"
          >
            {/* Section Kicker */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2c1ee8] text-[11px] font-mono tracking-widest uppercase mb-5 shadow-2xs select-none">
              <Compass className="w-3.5 h-3.5 text-[#2c1ee8]" />
              <span className="font-semibold">Ekstrakurikuler</span>
            </div>

            {/* Centered Main Heading */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-6 drop-shadow-2xs">
              Pengembangan Diri & <br />
              <span className="text-[#2c1ee8]">Potensi Siswa</span>
            </h2>

            {/* Centered Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl font-normal">
              SMKN 2 Surakarta menyediakan wadah kegiatan ekstrakurikuler
              komprehensif mulai dari olahraga, seni budaya, teknologi, hingga
              organisasi kepemimpinan. Dirancang untuk membentuk karakter tangguh,
              mengasah minat bakat, serta membangun semangat kolaborasi siswa.
            </p>

            {/* Quick Highlight Badges Row */}
            <div className="flex flex-wrap justify-center gap-3 mb-9">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-[#2c1ee8]" /> 20+ Ekstrakurikuler Active
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 shadow-2xs">
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
      </div>
    </section>
  );
}
