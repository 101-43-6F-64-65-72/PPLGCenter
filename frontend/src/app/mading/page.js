"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementCard from "@/features/announcement/components/AnnouncementCard";
import AnnouncementHeroCarousel from "@/features/announcement/components/AnnouncementHeroCarousel";
import AnnouncementSkeleton from "@/features/announcement/components/AnnouncementSkeleton";
import ErrorAlert from "@/components/common/ErrorAlert";
import EmptyState from "@/components/common/EmptyState";
import { Search, ChevronLeft, ChevronRight } from "@/components/common/Icons";
import { useRouter } from "next/navigation";

let motionImport = null;
let animatePresenceImport = null;

try {
  const m = require("motion/react");
  motionImport = m.motion;
  animatePresenceImport = m.AnimatePresence;
} catch (e) {
  try {
    const f = require("framer-motion");
    motionImport = f.motion;
    animatePresenceImport = f.AnimatePresence;
  } catch (e2) {}
}

const FallbackDiv = React.forwardRef(({ children, className, style, onClick }, ref) => (
  <div ref={ref} className={className} style={style} onClick={onClick}>
    {children}
  </div>
));
FallbackDiv.displayName = "FallbackDiv";

const MotionDiv = motionImport?.div || FallbackDiv;
const AnimatePresenceComponent = animatePresenceImport || (({ children }) => <>{children}</>);

export default function MadingPage() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pageSize = 6;
  const router = useRouter();

  // Scroll listener for floating scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const announcements = data?.data || [];
  const meta = data?.meta || { totalPages: 1, totalItems: announcements.length, page: currentPage };

  const categories = [
    "Semua",
    "Olahraga",
    "Sains & Teknologi",
    "Seni & Budaya",
    "Organisasi",
  ];

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <Navbar />

      {/* Hero Banner Section with Motion Animations */}
      <section className="w-full h-screen relative flex flex-col justify-center overflow-hidden">
        <AnnouncementHeroCarousel items={announcements.slice(0, 3)} />
      </section>

      {/* Main Catalog Section */}
      <section id="mading-catalog" className="w-full bg-white text-gray-900 py-16 sm:py-20 px-4 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-gray-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-[#1d4ed8] font-bold text-xs uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1d4ed8] animate-pulse" />
                <span>KATALOG MADING DIGITAL</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-gray-900 tracking-tight uppercase leading-tight">
                BERITA & PUBLIKASI SISWA
              </h2>
            </div>

            <form onSubmit={handleSearchSubmit} className="w-full md:w-72 relative flex items-center">
              <input
                type="text"
                placeholder="Cari pengumuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#1d4ed8] focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
            </form>
          </div>

          {/* Sticky Category Filter Pills */}
          <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-md py-3 mb-8 transition-all border-b border-gray-100/60 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    activeCategory === cat
                      ? "bg-[#1d4ed8] text-white shadow-md shadow-blue-500/20 scale-105"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isError && (
            <div className="my-8">
              <ErrorAlert
                title="Gagal Memuat Pengumuman"
                message={error?.message || "Terjadi kesalahan saat memuat data dari server."}
              />
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2.5 bg-[#1d4ed8] text-white rounded-full text-sm font-semibold hover:bg-blue-800 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {isLoading && <AnnouncementSkeleton count={pageSize} />}

          {!isLoading && !isError && announcements.length === 0 && (
            <EmptyState
              title="Ups... Data Tidak Ditemukan"
              description={`Maaf, tidak ada pengumuman yang sesuai dengan filter "${activeCategory}" ${debouncedSearch ? `dan pencarian "${debouncedSearch}"` : ""}.`}
              onReset={() => {
                setActiveCategory("Semua");
                setSearchQuery("");
                setDebouncedSearch("");
                setCurrentPage(1);
              }}
            />
          )}

          {/* Motion Layout Animations for Search, Filter, and Pagination */}
          {!isLoading && !isError && announcements.length > 0 && (
            <MotionDiv layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <AnimatePresenceComponent mode="popLayout">
                {announcements.map((item) => (
                  <MotionDiv
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -15 }}
                    transition={{
                      layout: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.25 },
                      scale: { duration: 0.25 },
                    }}
                  >
                    <AnnouncementCard
                      announcement={item}
                      onClick={() => router.push(`/mading/${item.id}`)}
                    />
                  </MotionDiv>
                ))}
              </AnimatePresenceComponent>
            </MotionDiv>
          )}

          {!isLoading && !isError && meta.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-xs text-gray-500 font-medium">
                Halaman {currentPage} dari {meta.totalPages} ({meta.totalItems} Total Pengumuman)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: meta.totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pNum
                          ? "bg-[#1d4ed8] text-white shadow-sm"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage >= meta.totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, meta.totalPages))}
                  className="p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  aria-label="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Floating Scroll to Top Action Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3.5 rounded-full bg-[#1d4ed8] hover:bg-blue-800 text-white shadow-2xl shadow-blue-600/40 border border-white/20 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="Kembali ke atas"
        >
          <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
