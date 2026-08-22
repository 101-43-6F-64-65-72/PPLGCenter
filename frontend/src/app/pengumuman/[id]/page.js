"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useAuth from "@/hooks/useAuth";
import announcementService from "@/services/announcementService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import ImageCropUploader from "@/components/common/ImageCropUploader";
import TwinOrbitSpinner from "@/components/ui/TwinOrbitSpinner";
import { useAnnouncement } from "@/features/announcement/hooks/useAnnouncement";
import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementDetailSkeleton from "@/features/announcement/components/AnnouncementDetailSkeleton";
import AnnouncementCommentSection from "@/features/announcement/components/AnnouncementCommentSection";
import { ArrowLeft, FileText, Download, User, Shield, Pin } from "@/components/common/Icons";
import { Edit3, X, Save, Share2, Sparkles, Clock, Calendar, Users, Eye } from "lucide-react";
import { resolveImageUrl, formatDate } from "@/lib/utils";
import RichTextEditor from "@/components/ui/RichTextEditor";
import RichContentViewer from "@/components/ui/RichContentViewer";
import { stripHtml } from "@/lib/sanitizer";

export default function AnnouncementDetailPage() {
  const routeParams = useParams();
  const id = routeParams?.id;

  const { user, role } = useAuth();
  const [readingProgress, setReadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "Informasi Sekolah",
    content: "",
  });
  const [editCoverImageUrl, setEditCoverImageUrl] = useState("");
  const [isUploadingEditCover, setIsUploadingEditCover] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const { data, isLoading, refetch } = useAnnouncement(id);
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
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnnouncementDetailSkeleton />
        </div>
      </div>
    );
  }

  // Contextual High Resolution Cover Image Helper
  const getCoverImage = (item) => {
    const rawUrl = item?.coverImageUrl || item?.imageUrl || item?.image;
    if (rawUrl && typeof rawUrl === "string" && !rawUrl.includes("dummypic")) {
      return resolveImageUrl(rawUrl);
    }
    const cat = (item?.category || "").toLowerCase();
    if (cat.includes("akademik") || cat.includes("ujian") || cat.includes("studi")) {
      return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80";
    }
    if (cat.includes("kegiatan") || cat.includes("osis") || cat.includes("pramuka")) {
      return "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80";
    }
    if (cat.includes("prestasi") || cat.includes("lomba") || cat.includes("juara")) {
      return "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1200&auto=format&fit=crop&q=80";
    }
    if (cat.includes("fasilitas") || cat.includes("lab") || cat.includes("komputer")) {
      return "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80";
  };

  // Category badge styling
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

  const formattedDate = formatDate(announcement.createdAt);
  const coverImage = getCoverImage(announcement);
  const authorName = announcement.author || announcement.createdBy || announcement.createdByUserName || "Redaksi Sekolah";

  const isEdited = Boolean(
    announcement?.isEdited ||
    (announcement?.updatedAt &&
      announcement?.createdAt &&
      new Date(announcement.updatedAt).getTime() - new Date(announcement.createdAt).getTime() > 2000)
  );

  const currentUserId = user?.id || user?.sub || user?.userId;
  const currentUserRole = (role || user?.role || "").toLowerCase();

  const isAuthorOrAdmin = Boolean(
    user &&
    (currentUserRole === "admin" ||
     currentUserRole === "teacher" ||
     (announcement?.createdByUserId && String(currentUserId) === String(announcement.createdByUserId)) ||
     (user.fullName && announcement?.createdByUserName && user.fullName === announcement.createdByUserName))
  );

  const handleEditCroppedImage = async (dataUrl, metadata) => {
    setIsUploadingEditCover(true);
    try {
      const file = metadata?.croppedFile || (await fetch(dataUrl).then((r) => r.blob()).then((blob) => new File([blob], "pengumuman-cover.jpg", { type: "image/jpeg" })));
      const uploadedUrl = await uploadImageToCloudinary(file);
      if (uploadedUrl) {
        setEditCoverImageUrl(uploadedUrl);
      } else {
        setEditCoverImageUrl(dataUrl);
      }
    } catch {
      setEditCoverImageUrl(dataUrl);
    } finally {
      setIsUploadingEditCover(false);
    }
  };

  const handleOpenEdit = () => {
    setEditForm({
      title: announcement.title || "",
      category: announcement.category || "Pengumuman",
      content: announcement.content || announcement.summary || "",
    });
    setEditCoverImageUrl(announcement.coverImageUrl || announcement.imageUrl || "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (isSavingEdit || isUploadingEditCover) return;
    const contentText = stripHtml(editForm.content);
    if (!editForm.title.trim() || !contentText.trim()) return;

    setIsSavingEdit(true);
    try {
      const validCoverUrl =
        editCoverImageUrl && editCoverImageUrl.startsWith("https://")
          ? editCoverImageUrl
          : (announcement.coverImageUrl || announcement.imageUrl || undefined);

      await announcementService.updateAnnouncement(announcement.id, {
        title: editForm.title.trim(),
        category: editForm.category,
        content: editForm.content,
        isPinned: !!announcement.isPinned,
        coverImageUrl: validCoverUrl,
      });

      setIsEditOpen(false);
      refetch && refetch();
      window.location.reload();
    } catch (err) {
      alert("Gagal memperbarui pengumuman: " + (err?.response?.data?.message || err?.message || "Terjadi kesalahan."));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Calculate dynamic reading time based on word count
  const wordCount = (announcement.content || announcement.summary || "").split(/\s+/).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  // Extract allArticles array for recommendations
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

  const otherArticles = Array.isArray(allArticles)
    ? allArticles.filter((item) => String(item.id) !== String(announcement.id))
    : [];

  const latestArticles = [...otherArticles]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 2);

  const popularArticles = [...otherArticles]
    .sort((a, b) => {
      if (b.isPinned !== a.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    })
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased relative selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div
          className="h-full bg-[#2C1EE8] transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6 pb-4 border-b border-slate-200/80">
          <Link
            href="/pengumuman"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-600 hover:text-[#2C1EE8] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Pengumuman Resmi</span>
          </Link>
        </div>

        {isLoading ? (
          <AnnouncementDetailSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Main Announcement Article */}
            <div className="lg:col-span-7 space-y-8">
              <article className="bg-white border border-slate-200/80 rounded-[28px] overflow-hidden shadow-xs">
                {/* Cover Image Header */}
                <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] overflow-hidden bg-slate-100">
                  <Image
                    src={coverImage}
                    alt={announcement.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  {/* Category & Pin Badge overlay */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border shadow-xs ${getCategoryBadgeStyle(announcement.category)}`}>
                      {announcement.category || "Pengumuman"}
                    </span>
                    {announcement.targetClasses && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md border border-white/20">
                        <Users className="w-3 h-3 text-blue-300" />
                        <span>{announcement.targetClasses}</span>
                      </span>
                    )}
                  </div>
                  {announcement.isPinned && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-500 text-white shadow-md">
                        <Pin className="w-3.5 h-3.5 fill-current" />
                        <span>Disematkan</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Article Content Area */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                    {announcement.title}
                  </h1>

                  {/* Metadata Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#2C1EE8] flex items-center justify-center font-extrabold border border-blue-200">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-slate-900">{authorName}</span>
                      </div>
                      <span className="text-slate-300">·</span>
                      <span>{formattedDate}</span>
                      <span className="text-slate-300">·</span>
                      <span>{estimatedReadTime} mnt baca</span>
                      {isEdited && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-lg border border-amber-200 text-[10px]">
                            Diedit
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2">
                      {isAuthorOrAdmin && (
                        <button
                          onClick={handleOpenEdit}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2C1EE8] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copied ? "Tersalin!" : "Bagikan"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Dates banner if set */}
                  {(announcement.publishStart || announcement.publishEnd) && (
                    <div className="flex flex-wrap items-center gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs font-bold text-slate-700">
                      {announcement.publishStart && (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <Clock className="w-4 h-4" />
                          <span>Mulai Berlaku: {new Date(announcement.publishStart).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                      )}
                      {announcement.publishEnd && (
                        <div className="flex items-center gap-1.5 text-rose-700">
                          <Calendar className="w-4 h-4" />
                          <span>Berakhir: {new Date(announcement.publishEnd).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Article Body Content */}
                  <div className="pt-2">
                    <RichContentViewer
                      content={announcement.content || announcement.summary || "Belum ada konten teks pengumuman."}
                      className="text-slate-800 text-sm sm:text-base leading-relaxed"
                    />
                  </div>

                  {/* Attachments Section */}
                  {announcement.attachments && announcement.attachments.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Lampiran Dokumen</span>
                      </h3>
                      <div className="space-y-2">
                        {announcement.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors text-xs font-bold group"
                          >
                            <div className="flex items-center gap-2 text-slate-800">
                              <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#2C1EE8]" />
                              <span>{file.name}</span>
                            </div>
                            <Download className="w-4 h-4 text-slate-400 group-hover:text-[#2C1EE8]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer publication status */}
                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                    {isEdited ? (
                      <span className="text-amber-700 font-bold">
                        Diedit pada {formatDate(announcement.updatedAt)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span>Dipublikasi: {formattedDate}</span>
                  </div>
                </div>
              </article>

              {/* Related Announcements */}
              {(latestArticles.length > 0 || popularArticles.length > 0) && (
                <section className="space-y-6">
                  {latestArticles.length > 0 && (
                    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Pengumuman Terbaru</h2>
                        <Link href="/pengumuman" className="text-xs font-extrabold text-[#2C1EE8] hover:text-blue-700 transition-colors">
                          Lihat Semua →
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {latestArticles.map((item) => (
                          <Link
                            key={item.id}
                            href={`/pengumuman/${item.id}`}
                            className="group flex gap-3 p-3 rounded-2xl border border-slate-200/80 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/40 transition-all duration-200"
                          >
                            <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                              <Image
                                src={getCoverImage(item)}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border mb-1 ${getCategoryBadgeStyle(item.category)}`}>
                                {item.category || "Pengumuman"}
                              </span>
                              <h3 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-[#2C1EE8] transition-colors leading-snug">
                                {item.title}
                              </h3>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {popularArticles.length > 0 && (
                    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Banyak Dibaca</h2>
                        <Link href="/pengumuman" className="text-xs font-extrabold text-[#2C1EE8] hover:text-blue-700 transition-colors">
                          Lihat Semua →
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {popularArticles.map((item) => (
                          <Link
                            key={item.id}
                            href={`/pengumuman/${item.id}`}
                            className="group flex gap-3 p-3 rounded-2xl border border-slate-200/80 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/40 transition-all duration-200"
                          >
                            <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                              <Image
                                src={getCoverImage(item)}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border mb-1 ${getCategoryBadgeStyle(item.category)}`}>
                                {item.category || "Pengumuman"}
                              </span>
                              <h3 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-[#2C1EE8] transition-colors leading-snug">
                                {item.title}
                              </h3>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: Interactive Comments & Reactions Sidebar */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 w-full">
              <AnnouncementCommentSection
                announcementId={announcement.id}
                isCommentsLockedInitial={!!announcement.isCommentsLocked}
              />
            </div>
          </div>
        )}
      </main>

      {/* Edit Announcement Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-[28px] p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#2C1EE8]" />
                  <span>Edit Pengumuman</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Perbarui judul, kategori, atau konten pengumuman resmi ini.
                </p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Pengumuman <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 shadow-2xs transition"
                  placeholder="Judul pengumuman..."
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 shadow-2xs transition cursor-pointer"
                >
                  <option value="Pengumuman">Pengumuman</option>
                  <option value="Akademik">Akademik</option>
                  <option value="OSIS">OSIS</option>
                  <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                  <option value="Ujian">Ujian</option>
                  <option value="Libur">Libur Sekolah</option>
                </select>
              </div>

              {/* Cover Image Crop & Upload */}
              <div>
                <ImageCropUploader
                  label="Ganti Gambar Sampul (Cover)"
                  initialImageUrl={editCoverImageUrl || announcement.coverImageUrl || announcement.imageUrl}
                  onCropped={handleEditCroppedImage}
                />
                {isUploadingEditCover && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 flex items-center gap-2">
                    <TwinOrbitSpinner size="xs" color="primary" />
                    <span>Mengunggah gambar sampul...</span>
                  </div>
                )}
              </div>

              <RichTextEditor
                label="Isi / Konten Pengumuman"
                required
                value={editForm.content}
                onChange={(val) => setEditForm({ ...editForm, content: val })}
                placeholder="Tuliskan isi pengumuman secara rinci..."
                helperText="Format konten pengumuman dengan teks tebal, daftar, atau judul agar lebih rapi."
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || isUploadingEditCover}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1EE8] text-white text-xs font-extrabold hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSavingEdit || isUploadingEditCover ? (
                    <>
                      <TwinOrbitSpinner size="xs" color="white" />
                      <span>{isUploadingEditCover ? "Mengunggah..." : "Menyimpan..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
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
