"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useAuth from "@/hooks/useAuth";
import announcementService from "@/services/announcementService";
import AnnouncementCard from "@/features/announcement/components/AnnouncementCard";
import AnnouncementSkeleton from "@/features/announcement/components/AnnouncementSkeleton";
import AnnouncementShowcaseSlider from "@/features/announcement/components/AnnouncementShowcaseSlider";
import CreateAnnouncementModal from "@/features/announcement/components/CreateAnnouncementModal";
import ManageShowcaseModal from "@/features/announcement/components/ManageShowcaseModal";
import LoginModal from "@/features/auth/components/LoginModal";
import {
  Search,
  Filter,
  X,
  Plus,
  TrendingUp,
  Pin,
  ChevronDown,
  Layers,
  SlidersHorizontal,
} from "lucide-react";

const OFFICIAL_PPLG_CLASSES = [
  "Semua Kelas",
  "X PPLG A",
  "X PPLG B",
  "XI PPLG A",
  "XI PPLG B",
  "XII PPLG A",
  "XII PPLG B",
];

const CATEGORIES = [
  "Semua",
  "Akademik",
  "OSIS",
  "Ekstrakurikuler",
  "Ujian",
  "Libur",
  "Prestasi",
  "General",
];

export default function PengumumanPage() {
  const router = useRouter();
  const { user, role, memberships, isAuthenticated } = useAuth();

  const userRole = (role || user?.role || "").toString().toLowerCase();
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

  const canCreateAnnouncement = isAuthenticated && (isAdmin || isTeacher || isOsisMember);

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeClassFilter, setActiveClassFilter] = useState("Semua");
  const [sortFilter, setSortFilter] = useState("terbaru"); // 'terbaru' | 'populer' | 'disematkan'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isManageShowcaseOpen, setIsManageShowcaseOpen] = useState(false);
  const [showcaseRefreshKey, setShowcaseRefreshKey] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await announcementService.getAnnouncements({ page: 1, pageSize: 60 });
      let items = res?.data?.items || res?.data || res?.items || [];
      if (Array.isArray(items)) {
        setAnnouncements(items);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) loadAnnouncements();
    });
    return () => {
      isMounted = false;
    };
  }, [loadAnnouncements]);

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ann) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setEditingAnnouncement(ann);
    setIsModalOpen(true);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;
    try {
      await announcementService.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      console.error("Failed to delete announcement", err);
      alert(err?.response?.data?.message || "Gagal menghapus pengumuman.");
    }
  };

  // Filter and sort items
  const filteredAnnouncements = useMemo(() => {
    let list = announcements.filter((ann) => {
      const titleStr = (ann?.title || "").toLowerCase();
      const contentStr = (ann?.content || ann?.summary || "").toLowerCase();
      const authorStr = (ann?.createdByUserName || ann?.author || "").toLowerCase();
      const catStr = (ann?.category || "").toLowerCase();
      const targetStr = (ann?.targetClasses || "").toLowerCase();
      const combined = `${titleStr} ${contentStr} ${authorStr} ${catStr} ${targetStr}`;

      const matchesSearch = combined.includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;

      if (activeCategory !== "Semua") {
        if (!catStr.includes(activeCategory.toLowerCase())) return false;
      }

      if (activeClassFilter !== "Semua") {
        if (
          targetStr &&
          !targetStr.includes("semua") &&
          !targetStr.includes(activeClassFilter.toLowerCase())
        ) {
          return false;
        }
      }

      if (sortFilter === "disematkan" && !ann.isPinned) {
        return false;
      }

      return true;
    });

    if (sortFilter === "populer") {
      list.sort((a, b) => {
        const scoreA =
          (a.reactionCount || a.ReactionCount || a.reactionsCount || a.ReactionsCount || 0) +
          (a.commentCount || a.CommentCount || a.commentsCount || a.CommentsCount || 0);
        const scoreB =
          (b.reactionCount || b.ReactionCount || b.reactionsCount || b.ReactionsCount || 0) +
          (b.commentCount || b.CommentCount || b.commentsCount || b.CommentsCount || 0);
        return scoreB - scoreA;
      });
    } else {
      // Default: sort pinned first, then by date newest
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    }

    return list;
  }, [announcements, searchQuery, activeCategory, activeClassFilter, sortFilter]);

  const isFilterActive =
    searchQuery.trim().length > 0 ||
    activeCategory !== "Semua" ||
    activeClassFilter !== "Semua" ||
    sortFilter !== "terbaru";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        {/* Top Direct Action & Filter Toolbar */}
        <div className="bg-white px-5 py-3.5 sm:py-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Search & Category Filter Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul pengumuman, kategori, atau materi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2C1EE8] focus:outline-hidden text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  aria-label="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative shrink-0 min-w-[160px]">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2C1EE8] pointer-events-none" />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:border-[#2C1EE8] focus:outline-hidden text-xs font-bold text-slate-700 cursor-pointer transition-all shadow-2xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "Semua" ? "Semua Kategori" : cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Target Class Dropdown */}
            <div className="relative shrink-0 min-w-[150px]">
              <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={activeClassFilter}
                onChange={(e) => setActiveClassFilter(e.target.value)}
                className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:border-[#2C1EE8] focus:outline-hidden text-xs font-bold text-slate-700 cursor-pointer transition-all shadow-2xs"
              >
                <option value="Semua">Semua Kelas</option>
                {OFFICIAL_PPLG_CLASSES.filter((c) => c !== "Semua Kelas").map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons & Sort Filters */}
          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            {/* Quick Sort Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSortFilter("terbaru")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortFilter === "terbaru"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Terbaru
              </button>
              <button
                type="button"
                onClick={() => setSortFilter("populer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortFilter === "populer"
                    ? "bg-white text-[#2C1EE8] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Populer</span>
              </button>
              <button
                type="button"
                onClick={() => setSortFilter("disematkan")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortFilter === "disematkan"
                    ? "bg-white text-amber-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Pin className="w-3 h-3" />
                <span>Pin</span>
              </button>
            </div>

            {/* Showcase & Create Actions for Admin */}
            {canCreateAnnouncement && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManageShowcaseOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#2C1EE8]" />
                  <span>Kelola Showcase</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2C1EE8] text-white hover:bg-[#2013ce] active:scale-[0.98] transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Pengumuman</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Featured Showcase Slider with Smooth Collapse/Expand Transition */}
        <AnimatePresence>
          {!isFilterActive && (announcements.length > 0 || isLoading) && (
            <motion.div
              key="announcement-showcase-slider"
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{
                opacity: 1,
                height: "auto",
                scale: 1,
                transition: {
                  height: { duration: 0.45, ease: [0.25, 1, 0.5, 1] },
                  opacity: { duration: 0.3, delay: 0.1 },
                  scale: { duration: 0.35, ease: "easeOut" },
                },
              }}
              exit={{
                opacity: 0,
                height: 0,
                scale: 0.97,
                transition: {
                  opacity: { duration: 0.2, ease: "easeIn" },
                  scale: { duration: 0.25, ease: "easeIn" },
                  height: { duration: 0.4, ease: [0.25, 1, 0.5, 1], delay: 0.05 },
                },
              }}
              className="overflow-hidden"
            >
              <AnnouncementShowcaseSlider
                isLoading={isLoading}
                canManage={canCreateAnnouncement}
                onOpenManageShowcase={() => setIsManageShowcaseOpen(true)}
                refreshKey={showcaseRefreshKey}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section: Main Announcement Catalog */}
        <section className="w-full py-4 sm:py-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {activeCategory === "Semua" ? "Daftar Pengumuman Resmi" : `Pengumuman: ${activeCategory}`}
              </h2>
              {!isLoading && (
                <span className="bg-blue-50 text-[#2C1EE8] border border-blue-200/80 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {filteredAnnouncements.length} Pengumuman
                </span>
              )}
            </div>
          </div>

          {/* Grid Content */}
          {isLoading ? (
            <AnnouncementSkeleton count={6} />
          ) : filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {filteredAnnouncements.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  announcement={ann}
                  onClick={() => router.push(`/pengumuman/${ann.id}`)}
                  canManage={canCreateAnnouncement}
                  onEdit={(item) => handleOpenEditModal(item)}
                  onDelete={(id) => handleDeleteAnnouncement(id)}
                />
              ))}
            </div>
          ) : (
            <div className="w-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2C1EE8] mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <p className="text-slate-900 font-bold text-sm">Tidak ada pengumuman yang sesuai</p>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Coba gunakan kata kunci pencarian yang lain atau sesuaikan filter kategori dan kelas.
              </p>
              {isFilterActive && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("Semua");
                    setActiveClassFilter("Semua");
                    setSortFilter("terbaru");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Create / Edit Modal Dialog */}
      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadAnnouncements()}
        editData={editingAnnouncement}
      />

      {/* Manage Showcase Modal Dialog */}
      <ManageShowcaseModal
        isOpen={isManageShowcaseOpen}
        onClose={() => setIsManageShowcaseOpen(false)}
        allAnnouncements={announcements}
        onRefresh={() => {
          loadAnnouncements();
          setShowcaseRefreshKey((k) => k + 1);
        }}
      />

      {/* Login Prompt Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}
