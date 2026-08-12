"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Building2, ArrowUpRight, CheckCircle2, Layers, ShieldCheck } from "lucide-react";

export default function Fasilitas({ data }) {
  const sectionRef = useRef(null);
  const leftColRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const cardsRef = useRef([]);

  const sectionData = data || {
    sectionLabel: "FASILITAS SEKOLAH",
    title: "Katalog & Peminjaman Fasilitas",
    description:
      "Akses mudah ke berbagai fasilitas unggulan sekolah. Dari laboratorium berteknologi tinggi hingga ruang serbaguna, semua siap digunakan untuk mendukung kegiatan akademik & ekstrakurikuler.",
    ctaText: "Jelajahi Fasilitas",
    ctaLink: "/fasilitas",
    items: [],
  };

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      // Use matchMedia for clean mobile degradation vs desktop pinned stacking
      ScrollTrigger.matchMedia({
        // Desktop (>768px): Pinned stacking animation
        "(min-width: 769px)": function () {
          const cardCount = cards.length;
          const pinDistance = cardCount * 420;

          // Main timeline pinning the left column while right column cards animate
          const mainTl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              pin: leftColRef.current,
              start: "top top+=100",
              end: () => `+=${pinDistance}`,
              pinSpacing: true,
              scrub: 1,
              anticipatePin: 1,
              refreshPriority: 1,
            },
          });

          // Loop cards to create stack overlay effect
          cards.forEach((card, i) => {
            if (i === 0) return; // First card is base

            // Previous cards scale down and reduce opacity
            for (let j = 0; j < i; j++) {
              mainTl.to(
                cards[j],
                {
                  scale: 1 - (i - j) * 0.05,
                  opacity: Math.max(0.4, 1 - (i - j) * 0.25),
                  duration: 1,
                  ease: "none",
                },
                i - 1
              );
            }

            // Target card slides up into position
            mainTl.fromTo(
              card,
              { yPercent: 100, opacity: 0.5 },
              { yPercent: 0, opacity: 1, duration: 1, ease: "none" },
              i - 1
            );
          });
        },

        // Mobile (<=768px): Standard clean vertical scroll without pin/stack
        "(max-width: 768px)": function () {
          cards.forEach((card) => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                scrollTrigger: {
                  trigger: card,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [sectionData.items]);

  const handleImageLoad = () => {
    if (typeof window !== "undefined" && ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  };

  return (
    <section
      id="fasilitas"
      ref={sectionRef}
      className="relative py-20 lg:py-28 bg-slate-950 text-white overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Pinned Text Info */}
          <div
            ref={leftColRef}
            className="lg:col-span-5 flex flex-col justify-between space-y-6 pt-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wider uppercase mb-4">
                <Building2 className="w-3.5 h-3.5" />
                <span>{sectionData.sectionLabel}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {sectionData.title}
              </h2>

              <p className="mt-4 text-base text-slate-300 leading-relaxed font-normal">
                {sectionData.description}
              </p>
            </div>

            {/* Sub Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Sistem peminjaman online terpadu & cepat</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Peralatan & laboratorium standar industri global</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Dampingan instruktur & penanggung jawab lab</span>
              </div>
            </div>

            {/* CTA Link Button */}
            <div className="pt-4">
              <Link
                href={sectionData.ctaLink || "/fasilitas"}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <span>{sectionData.ctaText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Stacked Facility Cards */}
          <div
            ref={cardsContainerRef}
            className="lg:col-span-7 relative min-h-[500px] sm:min-h-[560px] flex flex-col gap-6 lg:gap-0"
          >
            {sectionData.items?.map((item, index) => {
              const bgGradient =
                item.gradient || "from-blue-600 via-indigo-700 to-slate-900";

              return (
                <div
                  key={item.id || index}
                  ref={(el) => (cardsRef.current[index] = el)}
                  className={`w-full rounded-[24px] bg-gradient-to-br ${bgGradient} p-6 sm:p-8 border border-white/15 shadow-2xl shadow-slate-950/80 flex flex-col justify-between overflow-hidden relative group transform-gpu ${
                    index > 0 ? "lg:absolute lg:top-0 lg:left-0 lg:h-full" : "relative h-full"
                  }`}
                  style={{
                    zIndex: index + 1,
                  }}
                >
                  {/* Subtle Top Inner Glow */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                  {/* Card Header Info */}
                  <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        {item.status || "Tersedia"}
                      </span>
                      <h3 className="mt-3 text-2xl sm:text-3xl font-black text-white leading-tight">
                        {item.name}
                      </h3>
                    </div>

                    <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md text-xs font-medium text-white/80 border border-white/10">
                      {item.capacity}
                    </span>
                  </div>

                  {/* Image & Detail Content Container */}
                  <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-6 items-end mt-auto">
                    {/* Facility Spec Bullet Points */}
                    <div className="sm:col-span-7 space-y-2">
                      {item.specs?.map((spec, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs font-medium text-white/90 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 w-fit"
                        >
                          <Layers className="w-3.5 h-3.5 text-blue-300" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>

                    {/* Facility Preview Thumbnail */}
                    <div className="sm:col-span-5 relative h-40 sm:h-44 rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        onLoad={handleImageLoad}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3 text-[11px] font-bold text-white tracking-wide truncate">
                        {item.label}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Label */}
                  <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm font-black tracking-wide text-white uppercase drop-shadow-sm">
                      {item.label}
                    </span>
                    <Link
                      href={`/fasilitas#${item.id}`}
                      className="text-xs font-bold text-white/90 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/20"
                    >
                      <span>Lihat Detail</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
