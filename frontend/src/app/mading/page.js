"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementCard from "@/features/announcement/components/AnnouncementCard";
import AnnouncementHeroCarousel from "@/features/announcement/components/AnnouncementHeroCarousel";
import AnnouncementSkeleton from "@/features/announcement/components/AnnouncementSkeleton";
import ErrorAlert from "@/components/common/ErrorAlert";
import EmptyState from "@/components/common/EmptyState";
import LoginRequiredFallback from "@/components/common/LoginRequiredFallback";
import useAuth from "@/hooks/useAuth";
import CreateAnnouncementModal from "@/features/announcement/components/CreateAnnouncementModal";
import { Search, ChevronLeft, ChevronRight } from "@/components/common/Icons";
import { Plus } from "lucide-react";
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
  } catch (e2) { }
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
  const { user, role, memberships, isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  if (activeCategory === "Populer") {
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

  const categories = [
    "Semua",
    "Populer",
    "Akademik",
    "OSIS",
    "Ekstrakurikuler",
    "Libur Nasional",
    "Ujian",
    "General",
  ];

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <Navbar />

      {/* Hero Banner Section with Motion Animations */}
      <section className="w-full h-screen relative flex flex-col justify-center overflow-hidden">
        <AnnouncementHeroCarousel items={Array.isArray(announcements) ? announcements.slice(0, 3) : []} />
      </section>

      {/* Main Catalog Section */}
      <section id="mading-catalog" className="w-full bg-white text-slate-900 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200/80 pb-5">
            <div>
              <span className="text-xs font-bold text-[#2c1ee8] uppercase tracking-wider block mb-1">
                Publikasi Mading Digital
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Berita & Pengumuman Sekolah
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <form onSubmit={handleSearchSubmit} className="w-full md:w-64 relative flex items-center">
                <input
                  type="text"
                  placeholder="Cari pengumuman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-[#2c1ee8] focus:bg-white transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              </form>

              {canCreateMading && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#2c1ee8] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Mading</span>
                </button>
              )}
            </div>
          </div>

          {/* Sticky Category Filter Pills */}
          <div className="sticky top-18 z-30 bg-white/95 backdrop-blur-md py-2.5 mb-6 transition-all border-b border-slate-100 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === cat
                      ? "bg-[#2c1ee8] text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isError && (
            <div className="my-8">
              {error?.statusCode === 401 || error?.response?.status === 401 || error?.message?.includes("Sesi") || error?.message?.includes("Unauthorized") || error?.message?.includes("login") ? (
                <LoginRequiredFallback featureName="Mading Digital" />
              ) : (
                <>
                  <ErrorAlert
                    title="Gagal Memuat Pengumuman"
                    message={error?.message || "Terjadi kesalahan saat memuat data. Silakan coba lagi."}
                  />
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => refetch()}
                      className="px-5 py-2.5 bg-[#2c1ee8] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {isLoading && <AnnouncementSkeleton count={pageSize} />}

          {!isLoading && !isError && announcements.length === 0 && (
            <EmptyState
              title="Data Tidak Ditemukan"
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
            <MotionDiv layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-6">
              <span className="text-xs text-slate-500 font-medium">
                Halaman {currentPage} dari {meta.totalPages} ({meta.totalItems} Total Pengumuman)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pNum
                          ? "bg-[#2c1ee8] text-white shadow-2xs"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage >= meta.totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, meta.totalPages))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-[#2c1ee8] hover:bg-blue-700 text-white shadow-lg border border-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Kembali ke atas"
        >
          <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      )}
        </button>
      )}

      {/* Create Announcement Modal for Teachers, Admins, and OSIS Members */}
      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
