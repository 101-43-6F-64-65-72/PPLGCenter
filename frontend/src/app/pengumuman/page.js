"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useAuth from "@/hooks/useAuth";
import announcementService from "@/services/announcementService";
import AnnouncementCommentSection from "@/features/announcement/components/AnnouncementCommentSection";
import { API_CONFIG } from "@/config/api";
import { getStoredToken } from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
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
  Eye
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

export default function PengumumanPage() {
  const { user, role, isAuthenticated } = useAuth();

  const userRole = (role || user?.role || "Student").toString().toLowerCase();
  const isStudent = userRole === "student";
  const canCreateAnnouncement = isAuthenticated && (userRole === "admin" || userRole === "teacher");

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("Semua");

  // Detail Modal State
  const [activeDetailItem, setActiveDetailItem] = useState(null);

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
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
      const res = await announcementService.getAnnouncements({ page: 1, pageSize: 50 });
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
      if (activeDetailItem?.id === id) setActiveDetailItem(null);
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
        category: "Pengumuman",
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

  // Filter announcements for view
  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesSearch =
      ann.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.createdByUserName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      isStudent ||
      selectedClassFilter === "Semua" ||
      !ann.targetClasses ||
      ann.targetClasses.includes("Semua Kelas") ||
      ann.targetClasses.includes(selectedClassFilter);

    return matchesSearch && matchesClass;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-8">
        {/* Header Hero Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-extrabold text-[#2C1EE8] uppercase tracking-widest mb-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Megaphone className="w-3.5 h-3.5 text-[#2C1EE8]" />
                PENGUMUMAN RESMI SMKN 2 SURAKARTA
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Pengumuman PPLG Center
              </h1>
              <p className="text-sm text-slate-600 font-medium mt-1.5 max-w-2xl">
                Pusat informasi resmi akademis, kegiatan ujian, dan pemberitahuan penting jurusan PPLG SMK Negeri 2 Surakarta.
              </p>
            </div>

            {canCreateAnnouncement && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2C1EE8] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all duration-200 cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengumuman Baru</span>
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari pengumuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Class Filter Selector: Hide for Students as requested */}
            {!isStudent && (
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Filter Kelas:
                </span>
                {["Semua", ...OFFICIAL_PPLG_CLASSES].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClassFilter(cls)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                      selectedClassFilter === cls
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Announcement Grid / Compact List */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 font-bold text-sm">
            Memuat daftar pengumuman...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2C1EE8] flex items-center justify-center mx-auto border border-blue-100">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Belum Ada Pengumuman</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              Tidak ada pengumuman yang ditujukan untuk Anda atau sesuai pencarian saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-[24px] border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Optional Cover Image Thumbnail */}
                  {ann.coverImageUrl && (
                    <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                      <Image
                        src={resolveImageUrl(ann.coverImageUrl)}
                        alt={ann.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-3.5">
                    {/* Metadata Chips: Author & Target Classes */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-extrabold">
                        <Sparkles className="w-3 h-3 text-blue-300" />
                        <span>{ann.createdByUserName || "Pengelola"}</span>
                      </span>

                      {ann.targetClasses && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#2C1EE8] border border-blue-100 text-[11px] font-bold">
                          <Users className="w-3 h-3" />
                          {ann.targetClasses}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-[#2C1EE8] transition-colors">
                      {ann.title}
                    </h2>

                    {/* Dates */}
                    {(ann.publishStart || ann.publishEnd) && (
                      <div className="space-y-1 text-[11px] font-semibold text-slate-500">
                        {ann.publishStart && (
                          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 w-fit">
                            <Clock className="w-3 h-3" />
                            <span>Mulai: {new Date(ann.publishStart).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                          </div>
                        )}
                        {ann.publishEnd && (
                          <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 w-fit">
                            <Calendar className="w-3 h-3" />
                            <span>Berakhir: {new Date(ann.publishEnd).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Card */}
                <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                  <button
                    onClick={() => setActiveDetailItem(ann)}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#2C1EE8] hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <span>Lihat Selengkapnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Admin / Teacher Controls */}
                  {canCreateAnnouncement && (
                    <div className="flex items-center gap-1">
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
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal: Full Announcement Content & Reactions & Comments */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-extrabold">
                    <Sparkles className="w-3 h-3 text-blue-300" />
                    <span>Pembuat: {activeDetailItem.createdByUserName || "Pengelola"}</span>
                  </span>

                  {activeDetailItem.targetClasses && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-[#2C1EE8] border border-blue-200 text-xs font-bold">
                      <Users className="w-3.5 h-3.5" />
                      Target: {activeDetailItem.targetClasses}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {activeDetailItem.title}
                </h2>

                {(activeDetailItem.publishStart || activeDetailItem.publishEnd) && (
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                    {activeDetailItem.publishStart && (
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        <Clock className="w-3.5 h-3.5" />
                        Mulai: {new Date(activeDetailItem.publishStart).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                    {activeDetailItem.publishEnd && (
                      <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                        <Calendar className="w-3.5 h-3.5" />
                        Berakhir: {new Date(activeDetailItem.publishEnd).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveDetailItem(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnail Cover Image */}
            {activeDetailItem.coverImageUrl && (
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                <Image
                  src={resolveImageUrl(activeDetailItem.coverImageUrl)}
                  alt={activeDetailItem.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}

            {/* Announcement Full Content Body */}
            <div className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
              {activeDetailItem.content}
            </div>

            {/* Comments & Reactions Section */}
            <div className="pt-4 border-t border-slate-100">
              <AnnouncementCommentSection announcementId={activeDetailItem.id} userRole={userRole} />
            </div>
          </div>
        </div>
      )}

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

                    {/* Popover List 6 Kelas PPLG */}
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
                    Tanggal & Jam Mulai
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
                    Tanggal & Jam Berakhir
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
