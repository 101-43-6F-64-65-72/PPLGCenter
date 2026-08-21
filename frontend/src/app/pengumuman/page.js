"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useAuth from "@/hooks/useAuth";
import announcementService from "@/services/announcementService";
import AnnouncementCommentSection from "@/features/announcement/components/AnnouncementCommentSection";
import { API_CONFIG } from "@/config/api";
import { getStoredToken } from "@/lib/api";
import { resolveImageUrl, formatDate } from "@/lib/utils";
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  Users,
  Image as ImageIcon,
  X,
  Check,
  Megaphone,
  Trash2,
  Edit,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Pin,
  TrendingUp,
  BookOpen,
  ChevronDown
} from "lucide-react";

const OFFICIAL_PPLG_CLASSES = [
  "Semua Kelas",
  "X PPLG A",
  "X PPLG B",
  "XI PPLG A",
  "XI PPLG B",
  "XII PPLG A",
  "XII PPLG B"
];

const CATEGORIES = [
  "Semua",
  "Populer",
  "Akademik",
  "OSIS",
  "Ekstrakurikuler",
  "Ujian",
  "Libur",
  "General"
];

export default function PengumumanPage() {
  const router = useRouter();
  const { user, role, memberships, isAuthenticated } = useAuth();

  const userRole = (role || user?.role || "").toString().toLowerCase();
  const isStudent = userRole === "student";
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
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedClassFilter, setSelectedClassFilter] = useState("Semua");

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("Pengumuman");
  const [selectedTargetClasses, setSelectedTargetClasses] = useState(["Semua Kelas"]);
  const [formPublishStart, setFormPublishStart] = useState("");
  const [formPublishEnd, setFormPublishEnd] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  // Handle Image File Upload directly to backend API (Cloudinary integration)
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "announcements");

      const token = getStoredToken();
      const uploadEndpoint = `${API_CONFIG.BASE_URL}/api/upload`;

      const res = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && (data?.data?.url || data?.url)) {
        setCoverImageUrl(data?.data?.url || data?.url);
      } else {
        alert(data?.message || "Gagal mengunggah gambar thumbnail.");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Terjadi kesalahan saat mengunggah gambar thumbnail.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddClass = (clsName) => {
    if (clsName === "Semua Kelas") {
      setSelectedTargetClasses(["Semua Kelas"]);
    } else {
      let updated = selectedTargetClasses.filter((c) => c !== "Semua Kelas");
      if (!updated.includes(clsName)) {
        updated.push(clsName);
      }
      if (updated.length === 0) updated = ["Semua Kelas"];
      setSelectedTargetClasses(updated);
    }
    setIsClassPickerOpen(false);
  };

  const handleRemoveClass = (clsName) => {
    const updated = selectedTargetClasses.filter((c) => c !== clsName);
    if (updated.length === 0) {
      setSelectedTargetClasses(["Semua Kelas"]);
    } else {
      setSelectedTargetClasses(updated);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormCategory("Pengumuman");
    setSelectedTargetClasses(["Semua Kelas"]);
    setFormPublishStart("");
    setFormPublishEnd("");
    setCoverImageUrl("");
    setEditingId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (ann, e) => {
    if (e) e.stopPropagation();
    setEditingId(ann.id);
    setFormTitle(ann.title || "");
    setFormContent(ann.content || "");
    setFormCategory(ann.category || "Pengumuman");
    setCoverImageUrl(ann.coverImageUrl || "");
    if (ann.targetClasses) {
      setSelectedTargetClasses(ann.targetClasses.split(",").map((s) => s.trim()));
    } else {
      setSelectedTargetClasses(["Semua Kelas"]);
    }
    setFormPublishStart(ann.publishStart ? new Date(ann.publishStart).toISOString().slice(0, 16) : "");
    setFormPublishEnd(ann.publishEnd ? new Date(ann.publishEnd).toISOString().slice(0, 16) : "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;
    try {
      await announcementService.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      alert("Gagal menghapus pengumuman.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert("Judul dan isi pengumuman wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory || "Pengumuman",
        targetClasses: selectedTargetClasses.join(", "),
        publishStart: formPublishStart ? new Date(formPublishStart).toISOString() : null,
        publishEnd: formPublishEnd ? new Date(formPublishEnd).toISOString() : null,
        coverImageUrl: coverImageUrl || null,
        isPinned: false
      };

      if (editingId) {
        await announcementService.updateAnnouncement(editingId, payload);
      } else {
        await announcementService.createAnnouncement(payload);
      }

      setIsModalOpen(false);
      resetForm();
      loadAnnouncements();
    } catch (err) {
      console.error("Failed to save announcement:", err);
      alert("Terjadi kesalahan saat menyimpan pengumuman.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cover image resolver with curated category fallback
  const getCoverImage = (item) => {
    const raw = item?.coverImageUrl || item?.imageUrl || item?.image;
    if (raw && typeof raw === "string" && !raw.includes("dummypic")) return resolveImageUrl(raw);
    const cat = (item?.category || "").toLowerCase();
    if (cat.includes("akademik") || cat.includes("ujian")) return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80";
    if (cat.includes("osis") || cat.includes("organisasi")) return "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80";
    if (cat.includes("ekstra")) return "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80";
    if (cat.includes("prestasi") || cat.includes("lomba")) return "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80";
  };

  // Category badge style
  const getCategoryBadgeStyle = (category) => {
    if (!category) return "bg-slate-100 text-slate-700 border-slate-200";
    const cat = category.trim().toLowerCase();
    if (cat.includes("libur")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (cat.includes("ujian")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (cat.includes("osis")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (cat.includes("ekstra")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (cat.includes("akademik")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  // Filter & sort announcements for view
  let filteredAnnouncements = announcements.filter((ann) => {
    const matchesSearch =
      ann.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.createdByUserName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "Semua" ||
      selectedCategory === "Populer" ||
      (ann.category && ann.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesClass =
      isStudent ||
      selectedClassFilter === "Semua" ||
      !ann.targetClasses ||
      ann.targetClasses.includes("Semua Kelas") ||
      ann.targetClasses.includes(selectedClassFilter);

    return matchesSearch && matchesCategory && matchesClass;
  });

  if (selectedCategory === "Populer") {
    filteredAnnouncements = [...filteredAnnouncements].sort((a, b) => {
      const scoreA = (a.reactionCount || a.ReactionCount || 0) + (a.commentCount || a.CommentCount || 0);
      const scoreB = (b.reactionCount || b.ReactionCount || 0) + (b.commentCount || b.CommentCount || 0);
      return scoreB - scoreA;
    });
  }



  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-10">
        {/* Top Hero Section Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2C1EE8] text-[11px] font-mono font-extrabold uppercase tracking-wider">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Pusat Informasi & Pengumuman Resmi PPLG</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Pengumuman PPLG Center
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl">
                Temukan jadwal ujian, pemberitahuan akademik, info kegiatan OSIS &amp; jurusan SMK Negeri 2 Surakarta terkini secara lengkap.
              </p>
            </div>

            {canCreateAnnouncement && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#2C1EE8] hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all duration-200 cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengumuman Baru</span>
              </button>
            )}
          </div>

          {/* Search Bar & Category Controls */}
          <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Live Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pengumuman, kata kunci, atau pembuat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Kelas Selector (for Admin/Teacher) */}
              {!isStudent && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5" /> Target Kelas:
                  </span>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-800 outline-none focus:border-[#2C1EE8] cursor-pointer"
                  >
                    <option value="Semua">Semua Kelas PPLG</option>
                    {OFFICIAL_PPLG_CLASSES.filter((c) => c !== "Semua Kelas").map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#2C1EE8] text-white shadow-sm shadow-blue-500/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* Main Grid Catalog */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
              {selectedCategory === "Semua" ? "Daftar Pengumuman Resmi" : `Kategori: ${selectedCategory}`}
            </h2>
            <span className="text-xs font-bold text-slate-500">
              {filteredAnnouncements.length} Pengumuman ditemukan
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-slate-400 font-bold text-sm bg-white rounded-3xl border border-slate-200/80">
              Memuat pengumuman...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2C1EE8] flex items-center justify-center mx-auto border border-blue-100">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Belum Ada Pengumuman</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Tidak ada pengumuman yang sesuai dengan filter atau kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements.map((ann) => {
                const cover = getCoverImage(ann);
                const categoryBadge = getCategoryBadgeStyle(ann.category);
                const formattedDateStr = formatDate(ann.createdAt);

                return (
                  <div
                    key={ann.id}
                    onClick={() => router.push(`/pengumuman/${ann.id}`)}
                    className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
                  >
                    <div>
                      {/* Cover Thumbnail Image */}
                      <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                        <Image
                          src={cover}
                          alt={ann.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Overlay Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-black border shadow-2xs ${categoryBadge}`}>
                            {ann.category || "Pengumuman"}
                          </span>
                        </div>
                        {ann.isPinned && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-500 text-white shadow-sm">
                              <Pin className="w-3 h-3 fill-current" />
                              Disematkan
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Details Body */}
                      <div className="p-6 space-y-3.5">
                        {/* Target Class & Author metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-extrabold">
                            <Sparkles className="w-3 h-3 text-blue-300" />
                            <span>{ann.createdByUserName || "Pengelola"}</span>
                          </span>

                          {ann.targetClasses && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#2C1EE8] border border-blue-100 text-[11px] font-bold">
                              <Users className="w-3 h-3" />
                              <span>{ann.targetClasses}</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-[#2C1EE8] transition-colors">
                          {ann.title}
                        </h3>

                        {/* Content Excerpt Snippet */}
                        <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                          {ann.content || ann.summary || "Klik untuk membaca detail pengumuman selengkapnya."}
                        </p>

                        {/* Dates Banner if applicable */}
                        {(ann.publishStart || ann.publishEnd) && (
                          <div className="space-y-1 text-[11px] font-semibold text-slate-500 pt-1">
                            {ann.publishStart && (
                              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>Mulai: {new Date(ann.publishStart).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                              </div>
                            )}
                            {ann.publishEnd && (
                              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 w-fit">
                                <Calendar className="w-3 h-3" />
                                <span>Berakhir: {new Date(ann.publishEnd).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#2C1EE8] group-hover:translate-x-0.5 transition-transform">
                        <span>Lihat Detail Pengumuman</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>

                      {/* Admin Controls */}
                      {canCreateAnnouncement && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleEdit(ann, e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pengumuman"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(ann.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pengumuman"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal Form: Buat / Edit Pengumuman */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Isi formulir pengumuman resmi di bawah ini.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Judul Pengumuman */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Pengumuman <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ujian Susulan / Pengumuman Libur Akademik PPLG"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 shadow-2xs transition"
                />
              </div>

              {/* Kategori Pengumuman */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Pengumuman <span className="text-red-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 shadow-2xs transition cursor-pointer"
                >
                  <option value="Pengumuman">Pengumuman</option>
                  <option value="Akademik">Akademik</option>
                  <option value="OSIS">OSIS</option>
                  <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                  <option value="Ujian">Ujian</option>
                  <option value="Libur">Libur Sekolah</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Target Kelas Picker (Multi-select) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Kelas <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[46px]">
                  {selectedTargetClasses.map((cls) => (
                    <span
                      key={cls}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2C1EE8] text-white text-xs font-bold shadow-2xs"
                    >
                      <span>{cls}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(cls)}
                        className="hover:bg-blue-700 p-0.5 rounded-md cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsClassPickerOpen(!isClassPickerOpen)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-300 hover:border-blue-600 text-slate-700 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#2C1EE8]" />
                      <span>Tambah Kelas</span>
                    </button>

                    {/* Popover List Kelas PPLG */}
                    {isClassPickerOpen && (
                      <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1">
                        {OFFICIAL_PPLG_CLASSES.map((clsName) => (
                          <button
                            key={clsName}
                            type="button"
                            onClick={() => handleAddClass(clsName)}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#2C1EE8] transition-colors flex items-center justify-between"
                          >
                            <span>{clsName}</span>
                            {selectedTargetClasses.includes(clsName) && (
                              <Check className="w-3.5 h-3.5 text-[#2C1EE8]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tanggal & Jam Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal &amp; Jam Mulai
                  </label>
                  <input
                    type="datetime-local"
                    value={formPublishStart}
                    onChange={(e) => setFormPublishStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal &amp; Jam Berakhir
                  </label>
                  <input
                    type="datetime-local"
                    value={formPublishEnd}
                    onChange={(e) => setFormPublishEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* Cover Image Upload (Cloudinary Integration) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gambar Thumbnail (Cloudinary Upload)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs font-semibold text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-50 file:text-[#2C1EE8] hover:file:bg-blue-100 cursor-pointer"
                  />
                  {isUploadingImage && <span className="text-xs text-blue-600 font-bold">Mengunggah...</span>}
                </div>
                {coverImageUrl && (
                  <div className="mt-3 relative w-32 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    <Image src={resolveImageUrl(coverImageUrl)} alt="Thumbnail Preview" fill unoptimized className="object-cover" />
                  </div>
                )}
              </div>

              {/* Isi Pengumuman */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Isi Pengumuman <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tuliskan isi pengumuman lengkap di sini..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 shadow-2xs transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-[#2C1EE8] hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : editingId ? "Perbarui Pengumuman" : "Kirim Pengumuman"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
