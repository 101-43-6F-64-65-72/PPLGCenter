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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white relative">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-5">
        
        {/* ── 1. Top Search, Filters & Action Bar (Direct & To-The-Point) ── */}
        <div className="bg-white border border-slate-200 rounded-none p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input & Target Class Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pengumuman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2C1EE8] outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Target Class Dropdown */}
              <div className="relative shrink-0 w-full sm:w-auto sm:min-w-[140px]">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={activeClassFilter}
                  onChange={(e) => setActiveClassFilter(e.target.value)}
                  className="w-full appearance-none pl-8.5 pr-8 py-2 rounded-none border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:border-[#2C1EE8] outline-none text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                >
                  <option value="Semua">Semua Kelas</option>
                  {OFFICIAL_PPLG_CLASSES.filter((c) => c !== "Semua Kelas").map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Quick Sort Pills & Creator Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Sort Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-none border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSortFilter("terbaru")}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    sortFilter === "terbaru"
                      ? "bg-white text-slate-900 border-slate-300 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  Terbaru
                </button>
                <button
                  type="button"
                  onClick={() => setSortFilter("populer")}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 border ${
                    sortFilter === "populer"
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Populer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortFilter("disematkan")}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 border ${
                    sortFilter === "disematkan"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  <Pin className="w-3 h-3" />
                  <span>Disematkan</span>
                </button>
              </div>

              {/* Creator/Admin Action Buttons */}
              {canCreateAnnouncement && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsManageShowcaseOpen(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-none border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#2C1EE8]" />
                    <span>Showcase</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="px-3.5 py-1.5 bg-[#2C1EE8] hover:bg-[#2317be] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Pengumuman</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Category Filter Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer border ${
                    isSelected
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  {cat === "Semua" ? "Semua Kategori" : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Featured Showcase Slider (Collapsible when filtering) ── */}
        <AnimatePresence>
          {!isFilterActive && (announcements.length > 0 || isLoading) && (
            <motion.div
              key="announcement-showcase-slider"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
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

        {/* ── 3. Main Announcement Grid Section ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Daftar Pengumuman</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredAnnouncements.length})
              </span>
            </h2>

            {isFilterActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("Semua");
                  setActiveClassFilter("Semua");
                  setSortFilter("terbaru");
                }}
                className="text-xs font-bold text-[#2C1EE8] hover:underline cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <AnnouncementSkeleton key={idx} />
              ))}
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="py-20 text-center bg-white border border-dashed border-slate-300 rounded-none space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Tidak Ada Pengumuman Ditemukan
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Coba gunakan kata kunci lain atau ubah filter kategori dan kelas yang Anda pilih.
                </p>
              </div>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("Semua");
                    setActiveClassFilter("Semua");
                    setSortFilter("terbaru");
                  }}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAnnouncements.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  announcement={ann}
                  onClick={() => router.push(`/pengumuman/${ann.id}`)}
                  canManage={canCreateAnnouncement}
                  onEdit={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(ann);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleDeleteAnnouncement(ann.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Create / Edit Announcement Modal */}
      {isModalOpen && (
        <CreateAnnouncementModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAnnouncement(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingAnnouncement(null);
            loadAnnouncements();
            setShowcaseRefreshKey((k) => k + 1);
          }}
          initialData={editingAnnouncement}
        />
      )}

      {/* Manage Showcase Modal */}
      {isManageShowcaseOpen && (
        <ManageShowcaseModal
          isOpen={isManageShowcaseOpen}
          onClose={() => setIsManageShowcaseOpen(false)}
          onSuccess={() => {
            setShowcaseRefreshKey((k) => k + 1);
            loadAnnouncements();
          }}
        />
      )}

      {/* Auth Login Modal Trigger */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}
