"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { Award, Trophy, Briefcase, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function Hero({ data }) {
  const containerRef = useRef(null);
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const ctaRef = useRef(null);
  const featuresRef = useRef(null);
  const imageWrapperRef = useRef(null);

  // Fallback data if data prop is undefined or empty
  const heroData = data || {
    badge: "STUDENT CENTER SMKN 2 SURAKARTA",
    headline: "Mencetak Lulusan Unggul & Ready-to-Work",
    description:
      "Pusat kegiatan siswa terpadu SMK Negeri 2 Surakarta. Akses informasi mading digital, pendaftaran ekstrakurikuler, dan layanan katalog peminjaman fasilitas sekolah secara real-time.",
    campusImage:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
    ctaPrimary: { text: "Jelajahi Portal", href: "#ekstrakurikuler" },
    ctaSecondary: { text: "Katalog Fasilitas", href: "#fasilitas" },
    features: [
      { id: "f1", title: "Akreditasi A", subtitle: "Unggul & Terpercaya", icon: "Award" },
      { id: "f2", title: "Berprestasi", subtitle: "Tingkat Kota & Nasional", icon: "Trophy" },
      { id: "f3", title: "Kurikulum Industri", subtitle: "Siap Kerja & Wirausaha", icon: "Briefcase" },
    ],
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.4"
        )
        .fromTo(
          descRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          featuresRef.current ? featuresRef.current.children : [],
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.15 },
          "-=0.3"
        )
        .fromTo(
          imageWrapperRef.current,
          { opacity: 0, scale: 0.9, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 1, ease: "power2.out" },
          "-=0.8"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case "Award":
        return <Award className="w-5 h-5 text-blue-400" />;
      case "Trophy":
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case "Briefcase":
        return <Briefcase className="w-5 h-5 text-emerald-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <section
      id="beranda"
      ref={containerRef}
      className="relative min-h-[90vh] pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-slate-950 text-white flex items-center"
    >
      {/* Background Decorative Gradients & Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* Badge */}
            <div ref={badgeRef} className="inline-flex items-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg shadow-blue-500/10">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{heroData.badge}</span>
              </div>
            </div>

            {/* Headline */}
            <h1
              ref={titleRef}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]"
            >
              Mencetak Lulusan{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
                Unggul
              </span>{" "}
              & Ready-to-Work
            </h1>

            {/* Description */}
            <p
              ref={descRef}
              className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal"
            >
              {heroData.description}
            </p>

            {/* CTA Buttons */}
            <div
              ref={ctaRef}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href={heroData.ctaPrimary?.href || "#ekstrakurikuler"}
                className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                <span>{heroData.ctaPrimary?.text || "Jelajahi Portal"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={heroData.ctaSecondary?.href || "#fasilitas"}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 hover:border-slate-500/80 backdrop-blur-md transition-all duration-200 shadow-md"
              >
                <span>{heroData.ctaSecondary?.text || "Katalog Fasilitas"}</span>
              </Link>
            </div>

            {/* Feature Badges */}
            <div
              ref={featuresRef}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-800/80"
            >
              {heroData.features?.map((feat) => (
                <div
                  key={feat.id || feat.title}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-slate-800/80 shrink-0">
                    {getIconComponent(feat.icon)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-100 truncate">
                      {feat.title}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {feat.subtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Campus Image */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div
              ref={imageWrapperRef}
              className="relative w-full max-w-lg aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] rounded-3xl p-2 bg-gradient-to-tr from-blue-500/30 via-indigo-500/20 to-purple-500/30 border border-white/10 shadow-2xl shadow-blue-500/20 group"
            >
              <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-slate-900">
                <Image
                  src={heroData.campusImage}
                  alt="Kampus SMKN 2 Surakarta"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                {/* Floating Overlay Card */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Student Center Live Portal
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        SMK Negeri 2 Surakarta
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
