"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MadingCollage from "./MadingCollage";
import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AnnouncementSkeleton from "@/features/announcement/components/AnnouncementSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorAlert from "@/components/common/ErrorAlert";

export default function MadingSection() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Fetch real backend data for homepage Mading section using TanStack Query
  const { data, isLoading, isError, error, refetch } = useAnnouncements({ page: 1, pageSize: 5 });

  const articles = data?.data || [];
  const featuredArticle = articles[0];
  const highlightArticle = articles[1];

  return (
    <section
      id="mading"
      className="w-full bg-white py-10 sm:py-14 lg:py-16 px-4 sm:px-8 lg:px-12"
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Header Section: Left Collage, Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Mading Image Collage */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-start">
            <MadingCollage />
          </div>

          {/* Right Column: Title & Text */}
          <div className="lg:col-span-7 flex flex-col items-start pr-0 lg:pr-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black leading-tight mb-4 uppercase">
              MADING
            </h2>

            <p className="text-sm sm:text-base text-gray-800 leading-relaxed max-w-xl">
              SMK Negeri 2 Surakarta menyediakan beragam kegiatan ekstrakurikuler yang dirancang untuk mengembangkan potensi siswa di luar kegiatan akademik. Mulai dari bidang olahraga, seni dan budaya, sains dan teknologi, hingga organisasi.
            </p>
          </div>
        </div>

        {/* Middle Section: Cards Grid */}
        <div className="mt-8 sm:mt-10">
          {isLoading && <AnnouncementSkeleton count={2} />}

          {isError && (
            <div className="p-6">
              <ErrorAlert
                title="Gagal Memuat Mading"
                message={error?.message || "Terjadi kesalahan saat menghubungi server."}
              />
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => refetch()}
                  className="px-5 py-2 bg-[#1d4ed8] text-white rounded-full text-xs font-semibold"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && articles.length === 0 && (
            <EmptyState
              title="Ups... Belum Ada Mading Terpublikasi"
              description="Saat ini belum ada artikel atau pengumuman mading yang dipublikasikan oleh sekolah."
            />
          )}

          {!isLoading && !isError && featuredArticle && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
              {/* Featured Card (Left) */}
              <div className="lg:col-span-7 bg-gradient-to-br from-[#0a1931] via-[#102a5c] to-[#1d4ed8] rounded-[22px] sm:rounded-[28px] p-4 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5 items-center relative z-10 my-auto">
                  <div className="sm:col-span-5 relative aspect-[4/3] sm:aspect-square w-full rounded-[16px] sm:rounded-[18px] overflow-hidden shadow-sm">
                    <Image
                      src={featuredArticle.image || "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop"}
                      alt={featuredArticle.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 240px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>

                  <div className="sm:col-span-7 flex flex-col justify-between h-full py-0.5">
                    <div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white leading-snug mb-2 tracking-tight line-clamp-2">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal mb-4 line-clamp-3">
                        {featuredArticle.summary}
                      </p>
                    </div>

                    <Link
                      href={`/mading/${featuredArticle.id || 1}`}
                      className="inline-flex items-center justify-center gap-1.5 bg-white text-[#1d4ed8] hover:bg-blue-50 font-bold text-xs sm:text-sm px-5 py-2 rounded-full shadow transition-all duration-200 active:scale-95 cursor-pointer self-start"
                    >
                      <span>Lihat</span>
                      <svg
                        className="w-4 h-4 stroke-[2.5] transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Highlight Card (Right) */}
              {highlightArticle && (
                <Link
                  href={`/mading/${highlightArticle.id || 2}`}
                  className="lg:col-span-5 relative rounded-[22px] sm:rounded-[28px] overflow-hidden shadow-md group cursor-pointer min-h-[250px] sm:min-h-[280px] lg:min-h-full flex flex-col justify-end p-5 sm:p-6 hover:shadow-xl transition-all duration-300"
                >
                  <Image
                    src={highlightArticle.image || "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop"}
                    alt={highlightArticle.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 transition-opacity duration-300" />

                  <div className="relative z-20">
                    <span className="inline-block bg-blue-600/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2">
                      {highlightArticle.category}
                    </span>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white leading-snug drop-shadow-md tracking-tight line-clamp-2">
                      {highlightArticle.title}
                    </h3>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Button ("Selengkapnya") */}
        <div className="mt-5 sm:mt-6 w-full">
          <Link
            href="/mading"
            className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] active:bg-[#1e3a8a] text-white font-semibold text-base sm:text-lg lg:text-xl py-3 sm:py-3.5 rounded-[16px] sm:rounded-[20px] shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.003] active:scale-[0.99] flex items-center justify-center cursor-pointer tracking-wide"
          >
            Jelajahi Seluruh Mading Digital
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
                src={selectedArticle.image || "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop"}
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="absolute bottom-3 left-5 right-5 text-white">
                <span className="bg-[#1d4ed8] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-1.5 inline-block">
                  {selectedArticle.category}
                </span>
                <h3 className="text-lg sm:text-xl font-bold leading-snug drop-shadow-md">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-2.5">
                <span>Penulis: <strong className="text-gray-800">{selectedArticle.author || "Redaksi"}</strong></span>
              </div>
              <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                {selectedArticle.content || selectedArticle.summary}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <Link
                href={`/mading/${selectedArticle.id}`}
                className="text-xs font-bold text-[#1d4ed8] hover:underline"
              >
                Buka Halaman Penuh →
              </Link>
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors cursor-pointer"
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
