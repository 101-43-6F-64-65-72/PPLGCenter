"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Calendar, User, ArrowUpRight, Newspaper, Bookmark } from "lucide-react";

export default function MadingDigital({ data }) {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  const sectionData = data || {
    sectionLabel: "MADING DIGITAL",
    title: "Informasi, Karya & Pengumuman Sekolah",
    description:
      "Portal berita sekolah modern. Temukan pengumuman resmi akademik, prestasi terbaru siswa, artikel inspiratif, dan galeri karya kreatif terpopuler.",
    ctaText: "Jelajahi Seluruh Mading Digital",
    ctaLink: "/mading",
    items: [],
  };

  useEffect(() => {
    if (!cardsRef.current.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
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
      id="mading"
      ref={sectionRef}
      className="relative py-20 lg:py-28 bg-slate-950 text-white overflow-hidden border-t border-slate-800/80"
    >
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6 border-b border-slate-800 pb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-3">
              <Newspaper className="w-3.5 h-3.5" />
              <span>{sectionData.sectionLabel}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {sectionData.title}
            </h2>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              {sectionData.description}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href={sectionData.ctaLink || "/mading"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 hover:border-slate-500 transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <span>{sectionData.ctaText}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Mading Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sectionData.items?.map((item, index) => (
            <div
              key={item.id || index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="group rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 p-5 lg:p-6 flex flex-col sm:flex-row gap-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              {/* Image Container */}
              <div className="relative w-full sm:w-48 h-48 sm:h-auto rounded-2xl overflow-hidden shrink-0 bg-slate-950">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 200px"
                  onLoad={handleImageLoad}
                  className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                {/* Category Tag */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-indigo-500/30 text-[11px] font-bold text-indigo-300 flex items-center gap-1 shadow">
                  <Bookmark className="w-3 h-3 text-indigo-400" />
                  <span>{item.category}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      {item.author}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
                  <Link
                    href={`/mading#${item.id}`}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/btn"
                  >
                    <span>Baca Selengkapnya</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
