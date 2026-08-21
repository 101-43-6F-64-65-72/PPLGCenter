"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Newspaper, ArrowRight, Sparkles, Flame, BellRing } from "lucide-react";
import MadingCollage from "./MadingCollage";
import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementSkeleton from "@/features/announcement/components/AnnouncementSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorAlert from "@/components/common/ErrorAlert";
import { resolveImageUrl } from "@/lib/utils";
import MorphingSvg from "@/components/common/MorphingSvg";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MadingSection() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const featuredCardRef = useRef(null);
  const sectionRef = useRef(null);

  // Fetch real backend data for homepage Mading section using TanStack Query
  const { data, isLoading, isError, error, refetch } = useAnnouncements({
    page: 1,
    pageSize: 5,
  });

  const articles = data?.data || [];
  const featuredArticle = articles[0];
  const highlightArticle = articles[1];

  // Helper for resolving announcement images with fallbacks
  const getArticleImage = (
    art,
    fallback = "/images/tempat/aulasmkn2ska.jpg",
  ) => {
    if (!art) return fallback;
    const raw =
      art.coverImageUrl ||
      art.imageUrl ||
      art.image ||
      art.photoUrl ||
      art.photo;
    return resolveImageUrl(raw, fallback);
  };

  // Interactive mouse tracking spotlight effect
  const handleMouseMove = (e) => {
    if (!featuredCardRef.current) return;
    const rect = featuredCardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // GSAP ScrollTrigger reveal animation for Mading Cards
  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const items = sectionRef.current?.querySelectorAll(".mading-animate-item");
      if (items && items.length > 0) {
        gsap.from(items, {
          opacity: 0,
          y: 35,
          rotationX: 8,
          duration: 0.7,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [articles]);

  return (
    <section
      ref={sectionRef}
      id="mading"
      className="w-full bg-slate-50/80 border-t border-slate-200/80 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none"
    >
      {/* Background SVG Morphing Shard Element */}
      <MorphingSvg
        preset="shard"
        size={600}
        duration={11}
        gradientId="madingShardGrad"
        className="absolute top-10 -right-24 opacity-50 pointer-events-none -z-10"
      />
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-dots-pattern opacity-60 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* INNOVATIVE INFINITE MARQUEE TICKER */}
        <div className="mb-10 w-full overflow-hidden rounded-2xl bg-blue-50/70 border border-blue-100/90 py-2.5 px-4 backdrop-blur-xs select-none">
          <div className="flex whitespace-nowrap animate-marquee gap-8 items-center text-xs font-mono font-semibold text-[#2c1ee8] uppercase tracking-widest">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2c1ee8] animate-pulse" />
              MADING DIGITAL SMKN 2 SURAKARTA
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              PENGUMUMAN RESMI SEKOLAH
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              PRESTASI & KARYA INOVASI SISWA
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2c1ee8] animate-pulse" />
              MADING DIGITAL SMKN 2 SURAKARTA
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              PENGUMUMAN RESMI SEKOLAH
            </span>
          </div>
        </div>

        {/* Top Header Section: Left Collage, Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: 3D Floating Collage */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-start mading-animate-item">
            <MadingCollage articles={articles} />
          </div>

          {/* Right Column: Title & Text */}
          <div className="lg:col-span-7 flex flex-col items-start mading-animate-item">
            {/* Section Kicker */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-[#2c1ee8] text-[11px] font-mono tracking-widest uppercase mb-4 select-none">
              <Newspaper className="w-3.5 h-3.5 text-[#2c1ee8]" />
              <span className="font-semibold">Informasi & Berita</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-4">
              Mading Digital Sekolah
            </h2>

            <p className="text-base text-slate-600 leading-relaxed max-w-xl text-left font-normal">
              Pusat kearsipan berita, prestasi, pengumuman resmi, serta karya
              kreatif siswa-siswi SMK Negeri 2 Surakarta. Dapatkan informasi
              terkini secara cepat, tepat, dan terintegrasi.
            </p>
          </div>
        </div>

        {/* Middle Section: Cards Grid */}
        <div className="mt-12 sm:mt-14">
          {isLoading && <AnnouncementSkeleton count={2} />}

          {isError && (
            <div className="p-6">
              <ErrorAlert
                title="Gagal Memuat Mading"
                message={
                  error?.message ||
                  "Gagal memuat pengumuman. Silakan coba lagi."
                }
              />
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => refetch()}
                  className="px-5 py-2.5 bg-[#2c1ee8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.97]"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && articles.length === 0 && (
            <EmptyState
              title="Belum Ada Mading Terpublikasi"
              description="Saat ini belum ada artikel atau pengumuman mading yang dipublikasikan."
            />
          )}

          {!isLoading && !isError && featuredArticle && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mading-animate-item">
              {/* Featured Card (Left) with Spotlight Flare Effect */}
              <div
                ref={featuredCardRef}
                onMouseMove={handleMouseMove}
                className="relative lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-md flex flex-col justify-between group hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
              >
                {/* Dynamic Spotlight Glow Backdrop */}
                <div
                  className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(44, 30, 232, 0.08), transparent 80%)`,
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center relative z-10">
                  <div className="sm:col-span-5 relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs">
                    <Image
                      src={getArticleImage(
                        featuredArticle,
                        "/images/tempat/aulasmkn2ska.jpg",
                      )}
                      alt={featuredArticle.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 260px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                    />
                  </div>

                  <div className="sm:col-span-7 flex flex-col justify-between h-full">
                    <div>
                      <span className="inline-block bg-blue-50 text-[#2c1ee8] border border-blue-100 px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider mb-3 shadow-2xs">
                        {featuredArticle.category || "Berita Utama"}
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug mb-2 tracking-tight line-clamp-2 group-hover:text-[#2c1ee8] transition-colors">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-5 line-clamp-3">
                        {featuredArticle.summary}
                      </p>
                    </div>

                    <Link
                      href={`/pengumuman/${featuredArticle.id || 1}`}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2c1ee8] hover:text-blue-700 transition-colors self-start group/btn"
                    >
                      <span>Baca Pengumuman Selengkapnya</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Highlight Card (Right) */}
              {highlightArticle && (
                <Link
                  href={`/pengumuman/${highlightArticle.id || 2}`}
                  className="lg:col-span-5 relative rounded-3xl overflow-hidden shadow-md border border-slate-200/90 group cursor-pointer min-h-[260px] flex flex-col justify-end p-6 sm:p-7 hover:shadow-xl transition-all duration-300 bg-slate-900"
                >
                  <Image
                    src={getArticleImage(
                      highlightArticle,
                      "/images/tempat/halamandepansmkn2ska.jpg",
                    )}
                    alt={highlightArticle.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                    unoptimized
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent z-10" />

                  <div className="relative z-20">
                    <span className="inline-block bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold px-3 py-1 rounded-lg mb-2.5 shadow-2xs">
                      {highlightArticle.category || "Pengumuman"}
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-2 drop-shadow-xs">
                      {highlightArticle.title}
                    </h3>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Button */}
        <div className="mt-12 flex justify-center mading-animate-item">
          <Link
            href="/pengumuman"
            className="inline-flex items-center justify-center gap-2.5 bg-[#2c1ee8] hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm sm:text-base px-7 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.97]"
          >
            <span>Jelajahi Seluruh Pengumuman Resmi</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col my-auto border border-slate-200 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 sm:h-60 w-full bg-slate-900">
              <Image
                src={resolveImageUrl(
                  selectedArticle.image || selectedArticle.imageUrl,
                )}
                alt={selectedArticle.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-3 right-3 bg-slate-950/60 hover:bg-slate-950/90 text-white rounded-full p-1.5 backdrop-blur-md transition-colors cursor-pointer border border-white/20"
                aria-label="Tutup modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="absolute bottom-3 left-5 right-5 text-white">
                <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold px-2.5 py-0.5 rounded-md mb-2 inline-block">
                  {selectedArticle.category}
                </span>
                <h3 className="text-lg sm:text-xl font-bold leading-snug drop-shadow-md">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2.5">
                <span>
                  Penulis:{" "}
                  <strong className="text-slate-800">
                    {selectedArticle.author || "Redaksi"}
                  </strong>
                </span>
              </div>
              <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
                {selectedArticle.content || selectedArticle.summary}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <Link
                href={`/pengumuman/${selectedArticle.id}`}
                className="text-xs font-bold text-[#2c1ee8] hover:text-blue-700 transition-colors"
              >
                Buka Halaman Penuh →
              </Link>
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all cursor-pointer shadow-xs active:scale-[0.97]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
