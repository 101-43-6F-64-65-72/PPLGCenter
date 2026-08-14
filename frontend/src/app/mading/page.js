"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementHeroCarousel from "@/features/announcement/components/AnnouncementHeroCarousel";
import AnnouncementSkeleton from "@/features/announcement/components/AnnouncementSkeleton";
import ErrorAlert from "@/components/common/ErrorAlert";
import EmptyState from "@/components/common/EmptyState";
import LoginRequiredFallback from "@/components/common/LoginRequiredFallback";
import useAuth from "@/hooks/useAuth";
import CreateAnnouncementModal from "@/features/announcement/components/CreateAnnouncementModal";
import { Search, ChevronLeft, ChevronRight } from "@/components/common/Icons";
import { Plus, Bookmark, ThumbsUp, MessageSquare, ChevronDown, Eye, Info, TrendingUp, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { resolveImageUrl, formatDate } from "@/lib/utils";
import { stripHtml } from "@/lib/sanitizer";

export default function MadingPage() {
  const { user, role, memberships, isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState("Terbaru");
  const pageSize = 6;
  const router = useRouter();

  const userRole = (role || user?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";
  const isTeacher = userRole === "teacher" || userRole === "guru";
  const isOsisMember =
    userRole === "osis" ||
    (userRole === "student" &&
      Array.isArray(memberships) &&
      memberships.some(
        (m) =>
          m.name?.toLowerCase().includes("osis") ||
          m.category?.toLowerCase().includes("osis")
      ));

  const canCreateMading = isAuthenticated && (isAdmin || isTeacher || isOsisMember);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setDebouncedSearch(searchQuery);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const { data, isLoading, isError, error, refetch } = useAnnouncements({
    page: currentPage,
    pageSize,
    category: activeCategory,
    search: debouncedSearch,
  });

  let announcements = [];
  if (Array.isArray(data?.data?.items)) {
    announcements = data.data.items;
  } else if (Array.isArray(data?.data)) {
    announcements = data.data;
  } else if (Array.isArray(data?.items)) {
    announcements = data.items;
  } else if (Array.isArray(data)) {
    announcements = data;
  }

  if (activeCategory === "Populer" || sortLabel === "Terpopuler") {
    announcements = [...announcements].sort((a, b) => {
      const scoreA = (a.reactionCount || a.ReactionCount || 0) + (a.commentCount || a.CommentCount || 0);
      const scoreB = (b.reactionCount || b.ReactionCount || 0) + (b.commentCount || b.CommentCount || 0);
      return scoreB - scoreA;
    });
  }

  const meta = {
    totalPages: data?.data?.totalPages || data?.meta?.totalPages || 1,
    totalItems: data?.data?.totalCount || data?.meta?.totalItems || announcements.length,
    page: currentPage,
  };

  // Popular sidebar: top 5 sorted by reactions + comments
  const popularItems = [...announcements]
    .sort((a, b) => {
      const scoreA = (a.reactionCount || a.ReactionCount || 0) + (a.commentCount || a.CommentCount || 0);
      const scoreB = (b.reactionCount || b.ReactionCount || 0) + (b.commentCount || b.CommentCount || 0);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const categories = ["Semua", "Populer", "Akademik", "OSIS", "Ekstrakurikuler", "Libur Nasional", "Ujian", "General"];

  // Helper: category badge color
  const getCatStyle = (cat) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("akademik")) return "bg-blue-600 text-white";
    if (c.includes("osis") || c.includes("organisasi")) return "bg-indigo-600 text-white";
    if (c.includes("ekstra")) return "bg-purple-600 text-white";
    if (c.includes("libur")) return "bg-red-600 text-white";
    if (c.includes("ujian")) return "bg-amber-500 text-white";
    if (c.includes("populer")) return "bg-orange-500 text-white";
    return "bg-slate-600 text-white";
  };

  const getCatPillStyle = (cat) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("akademik")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (c.includes("osis") || c.includes("organisasi")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (c.includes("ekstra")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (c.includes("libur")) return "bg-red-50 text-red-700 border-red-200";
    if (c.includes("ujian")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  // Cover image resolver with fallback
  const getCover = (item) => {
    const raw = item?.coverImageUrl || item?.imageUrl || item?.image;
    if (raw && typeof raw === "string" && !raw.includes("dummypic")) return resolveImageUrl(raw);
    const cat = (item?.category || "").toLowerCase();
    if (cat.includes("akademik") || cat.includes("ujian")) return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&auto=format&fit=crop&q=60";
    if (cat.includes("osis") || cat.includes("pramuka")) return "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&auto=format&fit=crop&q=60";
    if (cat.includes("ekstra")) return "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&auto=format&fit=crop&q=60";
    return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop&q=60";
  };

  // Pagination logic
  const buildPaginationItems = () => {
    const total = meta.totalPages;
    const cur = currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (cur > 3) pages.push("...");
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-gray-900 font-sans antialiased">
      <Navbar />

      {/* ── Top Hero Carousel Banner (Bisa bergeser-geser) ── */}
      <section className="w-full h-[85vh] min-h-[550px] max-h-[750px] relative flex flex-col justify-center overflow-hidden bg-[#071329] border-b border-gray-200">
        <AnnouncementHeroCarousel items={Array.isArray(announcements) ? announcements.slice(0, 5) : []} />
      </section>

      <main id="mading-catalog" className="pt-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mading Sekolah</h1>
            <p className="text-base text-gray-600 mt-1">Informasi, berita, dan pengumuman terbaru dari SMK Negeri 2 Surakarta</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berita atau pengumuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64 shadow-sm"
              />
            </form>

            {/* Create button */}
            {canCreateMading && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Buat Mading
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-gray-400" />
              {sortLabel}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
                {["Terbaru", "Terpopuler", "Terlama"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortLabel(opt); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer ${sortLabel === opt ? "text-blue-600 font-semibold bg-blue-50" : "text-gray-700"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Error State ── */}
        {isError && (
          <div className="mb-5">
            {error?.statusCode === 401 || error?.response?.status === 401 || error?.message?.includes("Sesi") || error?.message?.includes("login") ? (
              <LoginRequiredFallback featureName="Mading Digital" />
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-3 shadow-sm">
                <ErrorAlert title="Gagal Memuat" message={error?.message || "Terjadi kesalahan saat memuat data."} />
                <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">Coba Lagi</button>
              </div>
            )}
          </div>
        )}

        {/* ── 2 Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── LEFT: Article Feed ── */}
          <div className="lg:col-span-8 space-y-4">

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse flex gap-4 shadow-sm">
                    <div className="w-44 h-28 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2.5 py-1">
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && announcements.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
                <p className="text-gray-600 text-base font-medium">Tidak ada pengumuman ditemukan.</p>
                <button
                  onClick={() => { setActiveCategory("Semua"); setSearchQuery(""); setDebouncedSearch(""); setCurrentPage(1); }}
                  className="mt-3 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* Artikel List — horizontal cards */}
            {!isLoading && !isError && announcements.map((item) => {
              const totalReactions = item.reactionCount ?? item.ReactionCount ?? item.reactionsCount ?? 0;
              const totalComments = item.commentCount ?? item.CommentCount ?? item.commentsCount ?? 0;
              const views = item.viewCount ?? item.ViewCount ?? item.views ?? 0;
              const authorName = item.author || item.createdBy || "Redaksi Sekolah";
              const date = formatDate(item.createdAt);
              const cover = getCover(item);

              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/mading/${item.id}`)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden flex gap-0 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="relative w-48 sm:w-56 flex-shrink-0 overflow-hidden bg-gray-100">
                    <Image
                      src={cover}
                      alt={item.title || ""}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    {/* Category badge on image */}
                    <span className={`absolute top-2.5 left-2.5 text-xs font-bold px-2.5 py-1 rounded-md ${getCatStyle(item.category)}`}>
                      {item.category || "Umum"}
                    </span>
                    {item.isPinned && (
                      <span className="absolute top-2.5 right-2.5 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white">
                        📌
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Date + Bookmark */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 font-medium">{date}</span>
                        <Bookmark className="w-4 h-4 text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0 cursor-pointer" />
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                        {item.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {stripHtml(item.summary || item.content || "")}
                      </p>
                    </div>

                    {/* Footer: author + stats */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{authorName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                        {views > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-gray-400" />
                            {views}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-gray-400" />
                          {totalReactions}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          {totalComments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── Pagination ── */}
            {!isLoading && !isError && meta.totalPages > 1 && (
              <div className="flex items-center gap-1.5 pt-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {buildPaginationItems().map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold border transition-colors cursor-pointer shadow-sm ${currentPage === item
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  disabled={currentPage >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.totalPages))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="lg:col-span-4 space-y-4">

            {/* Populer Minggu Ini */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Populer Minggu Ini</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                      <div className="w-6 h-6 bg-gray-200 rounded flex-shrink-0" />
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : popularItems.length > 0 ? (
                  popularItems.map((item, idx) => {
                    const views = item.viewCount ?? item.ViewCount ?? item.views ?? 0;
                    const totalReactions = item.reactionCount ?? item.ReactionCount ?? 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => router.push(`/mading/${item.id}`)}
                        className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        {/* Rank number */}
                        <span className={`text-sm font-black flex-shrink-0 w-5 text-center mt-0.5 ${idx === 0 ? "text-blue-600" : "text-gray-400"}`}>
                          {idx + 1}
                        </span>

                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={getCover(item)}
                            alt={item.title || ""}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${item.category ? getCatPillStyle(item.category) : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}>
                              {item.category || "Umum"}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <Eye className="w-3 h-3" />
                              {views > 0 ? views : totalReactions} dilihat
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">
                    Belum ada data populer.
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800 mb-1">Informasi</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Pastikan informasi yang kamu baca berasal dari sumber resmi sekolah.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Floating scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-md transition-all cursor-pointer"
          aria-label="Kembali ke atas"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Create Announcement Modal */}
      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

