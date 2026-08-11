"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { Newspaper, ArrowRight, Sparkles } from "lucide-react";
import MadingCollage from "./MadingCollage";
import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementSkeleton from "@/features/announcement/components/AnnouncementSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorAlert from "@/components/common/ErrorAlert";

export default function MadingSection() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Fetch real backend data for homepage Mading section using TanStack Query
  const { data, isLoading, isError, error, refetch } = useAnnouncements({
    page: 1,
    pageSize: 5,
  });

  const articles = data?.data || [];
  const featuredArticle = articles[0];
  const highlightArticle = articles[1];

  return (
    <section
      id="mading"
      className="w-full bg-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Header Section: Left Collage, Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Mading Image Collage */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-start">
            <MadingCollage articles={articles} />
          </div>

          {/* Right Column: Title & Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* Section Kicker */}
            <span className="text-xs font-bold tracking-wider text-[#2c1ee8] uppercase mb-2">
              Informasi & Berita
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
              Mading Digital Sekolah
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl text-left font-normal">
              Pusat kearsipan berita, prestasi, pengumuman resmi, serta karya
              kreatif siswa-siswi SMK Negeri 2 Surakarta. Dapatkan informasi
              terkini secara cepat, tepat, dan terintegrasi.
            </p>
          </motion.div>
        </div>

        {/* Middle Section: Cards Grid */}
        <div className="mt-10 sm:mt-12">
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
                  className="px-5 py-2 bg-[#2c1ee8] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Featured Card (Left) */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-slate-300 transition-all duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-5 relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-200 border border-slate-200/60">
                    <Image
                      src={
                        featuredArticle.image ||
                        featuredArticle.imageUrl ||
                        "/images/dummypic.jpg"
                      }
                      alt={featuredArticle.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 240px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>

                  <div className="sm:col-span-7 flex flex-col justify-between h-full">
                    <div>
                      <span className="inline-block bg-blue-50 text-[#2c1ee8] border border-blue-100/80 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5">
                        {featuredArticle.category || "Berita Utama"}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2 tracking-tight line-clamp-2">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-4 line-clamp-3">
                        {featuredArticle.summary}
                      </p>
                    </div>

                    <Link
                      href={`/mading/${featuredArticle.id || 1}`}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#2c1ee8] hover:text-blue-700 transition-colors self-start group/btn"
                    >
                      <span>Baca Artikel</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Highlight Card (Right) */}
              {highlightArticle && (
                <Link
                  href={`/mading/${highlightArticle.id || 2}`}
                  className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-xs border border-slate-200/90 group cursor-pointer min-h-[240px] flex flex-col justify-end p-5 sm:p-6 hover:shadow-md transition-all duration-300"
                >
                  <Image
                    src={
                      highlightArticle.image ||
                      highlightArticle.imageUrl ||
                      "/images/dummypic.jpg"
                    }
                    alt={highlightArticle.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent z-10" />

                  <div className="relative z-20">
                    <span className="inline-block bg-white/90 text-slate-900 text-[11px] font-bold px-2.5 py-0.5 rounded-md mb-2">
                      {highlightArticle.category || "Pengumuman"}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
                      {highlightArticle.title}
                    </h3>
                  </div>
                </Link>
              )}
            </motion.div>
          )}
        </div>

        {/* Bottom Action Button */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/mading"
            className="inline-flex items-center justify-center gap-2 bg-[#2c1ee8] hover:bg-blue-700 text-white font-semibold text-sm sm:text-base px-6 py-3 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <span>Jelajahi Seluruh Mading Digital</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col my-auto border border-gray-100 text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 sm:h-60 w-full bg-gray-900">
              <Image
                src={
                  selectedArticle.image ||
                  selectedArticle.imageUrl ||
                  "/images/dummypic.jpg"
                }
                alt={selectedArticle.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur-md transition-colors cursor-pointer"
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
                <span className="bg-[#2c1ee8] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-1.5 inline-block">
                  {selectedArticle.category}
                </span>
                <h3 className="text-lg sm:text-xl font-bold leading-snug drop-shadow-md">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-2.5">
                <span>
                  Penulis:{" "}
                  <strong className="text-gray-800">
                    {selectedArticle.author || "Redaksi"}
                  </strong>
                </span>
              </div>
              <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-line text-justify">
                {selectedArticle.content || selectedArticle.summary}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <Link
                href={`/mading/${selectedArticle.id}`}
                className="text-xs font-bold text-[#2c1ee8] hover:underline"
              >
                Buka Halaman Penuh →
              </Link>
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-[#2c1ee8] hover:bg-[#2013ce] text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors cursor-pointer"
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
