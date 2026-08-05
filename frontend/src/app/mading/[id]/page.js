"use client";

import React, { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAnnouncement } from "@/features/announcement/hooks/useAnnouncement";
import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementDetailSkeleton from "@/features/announcement/components/AnnouncementDetailSkeleton";
import { ArrowLeft, FileText, Download, User, Shield, Pin } from "@/components/common/Icons";
import { resolveImageUrl, formatDate } from "@/lib/utils";

export default function AnnouncementDetailPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [readingProgress, setReadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useAnnouncement(id);
  const { data: listData } = useAnnouncements({ page: 1, pageSize: 6 });

  // Article reading progress bar listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Copy article URL handler
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Main announcement article
  const announcement = data?.data?.id ? data.data : (data?.data || data || null);

  if (isLoading || !announcement) {
    return <AnnouncementDetailSkeleton />;
  }

  const formattedDate = formatDate(announcement.createdAt);
  const coverImage = resolveImageUrl(announcement.coverImageUrl || announcement.imageUrl || announcement.image);
  const authorName = announcement.author || announcement.createdBy || announcement.authorName || "Redaksi Sekolah";

  // Calculate dynamic reading time based on word count
  const wordCount = (announcement.content || announcement.summary || "").split(/\s+/).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  // Safely extract allArticles array for recommendations
  let allArticles = [];
  if (Array.isArray(listData?.data?.items)) {
    allArticles = listData.data.items;
  } else if (Array.isArray(listData?.data)) {
    allArticles = listData.data;
  } else if (Array.isArray(listData?.items)) {
    allArticles = listData.items;
  } else if (Array.isArray(listData)) {
    allArticles = listData;
  }

  const relatedArticles = Array.isArray(allArticles)
    ? allArticles
      .filter((item) => String(item.id) !== String(announcement.id))
      .slice(0, 3)
    : [];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
        <div
          className="h-full bg-[#1d4ed8] transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
        {/* Back Link */}
        <Link
          href="/mading"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#1d4ed8] transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Mading Digital</span>
        </Link>

        {isLoading ? (
          <AnnouncementDetailSkeleton />
        ) : (
          <>
            <article className="w-full">
              {/* 1. Article Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-[900] text-gray-900 tracking-tight leading-tight mb-4 font-sans">
                {announcement.title}
              </h1>

              {/* Author & Category Sub-bar (Under Title) */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-gray-500 font-medium mb-6 pb-4 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1d4ed8] font-bold flex items-center justify-center text-xs shadow-xs border border-blue-200/50">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-gray-900 font-semibold">
                      Oleh: {authorName}
                    </span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="bg-blue-50 text-[#1d4ed8] font-semibold text-xs px-3 py-0.5 rounded-full border border-blue-100">
                    {announcement.category || "Pengumuman"}
                  </span>
                  {announcement.isPinned && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="bg-amber-50 text-amber-800 font-extrabold text-xs px-3 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                        <Pin className="w-3 h-3 text-amber-600 fill-current" />
                        Disematkan
                      </span>
                    </>
                  )}
                </div>

                {/* Share Link Action */}
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#1d4ed8] rounded-full border border-gray-200/80 text-xs font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>{copied ? "Link Tersalin! ✓" : "Bagikan Berita"}</span>
                </button>
              </div>

              {/* 2. Hero Image */}
              <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-md mb-8 border border-gray-100 bg-gray-100">
                <Image
                  src={coverImage}
                  alt={announcement.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>

              {/* 3. Article Content */}
              <div className="space-y-6 text-gray-900 text-base sm:text-lg leading-relaxed sm:leading-loose text-left font-sans font-normal">
                {announcement.content ? (
                  announcement.content.split("\n\n").map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))
                ) : (
                  <p>{announcement.summary || "Belum ada konten teks mading."}</p>
                )}
              </div>

              {/* File Attachments (if available) */}
              {announcement.attachments && announcement.attachments.length > 0 && (
                <div className="mt-10 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1d4ed8]" /> Lampiran Berkas
                  </h3>
                  <div className="space-y-2">
                    {announcement.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-sm group"
                      >
                        <div className="flex items-center gap-2.5 text-gray-800 font-medium">
                          <FileText className="w-4 h-4 text-gray-500 group-hover:text-[#1d4ed8]" />
                          <span>{file.name}</span>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-[#1d4ed8]" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Publish Date */}
              <div className="mt-10 pt-4 border-t border-gray-100 flex justify-end text-xs sm:text-sm font-medium text-gray-500">
                <span>{formattedDate}</span>
              </div>
            </article>

            {/* 5. Related News Recommendations Section */}
            {relatedArticles.length > 0 && (
              <section className="mt-16 sm:mt-20 pt-10 border-t border-gray-200/80">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[#1d4ed8] font-bold text-xs uppercase tracking-wider mb-2">
                      <span className="w-2 h-2 rounded-full bg-[#1d4ed8] animate-pulse" />
                      <span>REKOMENDASI BERITA</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Berita & Pengumuman Terkait
                    </h2>
                  </div>

                  <Link
                    href="/mading"
                    className="text-xs sm:text-sm font-bold text-[#1d4ed8] hover:text-blue-800 transition-colors flex items-center gap-1 group"
                  >
                    <span>Lihat Semua Mading</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                {/* Related Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {relatedArticles.map((item) => (
                    <Link
                      key={item.id}
                      href={`/mading/${item.id}`}
                      className="bg-white border border-gray-100 hover:border-blue-300 rounded-[22px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1.5 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                          <Image
                            src={resolveImageUrl(item.imageUrl || item.image)}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                          <span className="absolute top-3 left-3 bg-[#1d4ed8] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                            {item.category || "Pengumuman"}
                          </span>
                        </div>

                        <div className="p-5">
                          <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#1d4ed8] transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-normal">
                            {item.summary}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {item.author || item.createdBy || "Redaksi"}
                        </span>
                        <span className="text-xs font-bold text-[#1d4ed8] group-hover:translate-x-0.5 transition-transform">
                          Baca Artikel →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
