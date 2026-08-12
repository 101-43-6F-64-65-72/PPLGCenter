"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Users, Award, ArrowUpRight, Compass } from "lucide-react";

export default function Ekstrakurikuler({ data }) {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  const sectionData = data || {
    sectionLabel: "EKSTRAKURIKULER",
    title: "Wadah Minat, Bakat & Kepemimpinan",
    description:
      "Kembangkan potensi non-akademik, karakter kepemimpinan, dan keahlian spesifik melalui beragam kegiatan ekstrakurikuler unggulan SMK Negeri 2 Surakarta.",
    ctaText: "Daftar Ekstrakurikuler",
    ctaLink: "/ekstrakurikuler",
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
      id="ekstrakurikuler"
      ref={sectionRef}
      className="relative py-20 lg:py-28 bg-slate-900 text-white overflow-hidden"
    >
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6 border-b border-slate-800 pb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wider uppercase mb-3">
              <Compass className="w-3.5 h-3.5" />
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
              href={sectionData.ctaLink || "/ekstrakurikuler"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <span>{sectionData.ctaText}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {sectionData.items?.map((item, index) => (
            <div
              key={item.id || index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="group relative rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/50 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
            >
              {/* Image Container */}
              <div className="relative w-full h-52 bg-slate-900 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onLoad={handleImageLoad}
                  className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Badge Overlay */}
                {item.badge && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-blue-500/30 text-[11px] font-semibold text-blue-300 flex items-center gap-1.5 shadow-md">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>{item.badge}</span>
                  </div>
                )}

                {/* Category Overlay */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-blue-600/90 text-[11px] font-bold text-white shadow">
                  {item.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>{item.members}</span>
                  </div>

                  <Link
                    href={`/ekstrakurikuler#${item.id}`}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 group/btn"
                  >
                    <span>Detail</span>
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
