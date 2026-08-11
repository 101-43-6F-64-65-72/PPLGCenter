"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
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
import { Edit3, X, Save } from "lucide-react";
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
    return <AnnouncementDetailSkeleton />;
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

  const formattedDate = formatDate(announcement.createdAt);
  const coverImage = getCoverImage(announcement);
  const authorName = announcement.author || announcement.createdBy || announcement.authorName || "Redaksi Sekolah";

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
     (announcement?.createdByUserId && String(currentUserId) === String(announcement.createdByUserId)) ||
     (user.fullName && announcement?.createdByUserName && user.fullName === announcement.createdByUserName))
  );

  const handleEditCroppedImage = async (dataUrl, metadata) => {
    setIsUploadingEditCover(true);
    try {
      const file = metadata?.croppedFile || (await fetch(dataUrl).then((r) => r.blob()).then((blob) => new File([blob], "mading-cover.jpg", { type: "image/jpeg" })));
      const uploadedUrl = await uploadImageToCloudinary(file);
      if (uploadedUrl && uploadedUrl.startsWith("https://")) {
        setEditCoverImageUrl(uploadedUrl);
      }
    } catch {
      // keep current image URL on upload error
    } finally {
      setIsUploadingEditCover(false);
    }
  };

  const handleOpenEdit = () => {
    setEditForm({
      title: announcement.title || "",
      category: announcement.category || "Informasi Sekolah",
      content: announcement.content || announcement.summary || "",
    });
    setEditCoverImageUrl(announcement.coverImageUrl || announcement.imageUrl || "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (isSavingEdit || isUploadingEditCover) return;
    // Validate: strip HTML for plain text check, original HTML goes to API
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
      alert("Gagal memperbarui mading: " + (err?.response?.data?.message || err?.message || "Terjadi kesalahan."));
    } finally {
      setIsSavingEdit(false);
    }
  };

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

  const otherArticles = Array.isArray(allArticles)
    ? allArticles.filter((item) => String(item.id) !== String(announcement.id))
    : [];

  // 1. Mading Terbaru
  const latestArticles = [...otherArticles]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 2);

  // 2. Mading Terpopuler
  const popularArticles = [...otherArticles]
    .sort((a, b) => {
      if (b.isPinned !== a.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    })
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-slate-100 z-50">
        <div
          className="h-full bg-[#2c1ee8] transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
        {/* Back Link */}
        <Link
          href="/mading"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#2c1ee8] transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Mading Digital</span>
        </Link>

        {isLoading ? (
          <AnnouncementDetailSkeleton />
        ) : (
          <>
            {/* 2-Column Responsive Layout (Article Left, Comments Sidebar Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Article Content & Related News */}
              <div className="lg:col-span-7 space-y-12">
                <article className="w-full">
                  {/* 1. Article Title */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 font-sans">
                    {announcement.title}
                  </h1>

                  {/* Author & Category Sub-bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 font-medium mb-6 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2c1ee8] font-bold flex items-center justify-center text-xs border border-blue-100">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-slate-900 font-semibold">
                          Oleh: {authorName}
                        </span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="bg-blue-50 text-[#2c1ee8] font-semibold text-xs px-3 py-0.5 rounded-full border border-blue-100">
                        {announcement.category || "Pengumuman"}
                      </span>
                      {isEdited && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="bg-amber-50 text-amber-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-amber-200">
                            Di edit
                          </span>
                        </>
                      )}
                      {announcement.isPinned && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="bg-amber-50 text-amber-800 font-extrabold text-xs px-3 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Pin className="w-3 h-3 text-amber-600 fill-current" />
                            Disematkan
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAuthorOrAdmin && (
                        <button
                          onClick={handleOpenEdit}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2c1ee8] text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Mading</span>
                        </button>
                      )}

                      {/* Share Link Action */}
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2c1ee8] rounded-lg border border-slate-200/80 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>{copied ? "Link Tersalin!" : "Bagikan Berita"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Hero Image */}
                  <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden shadow-xs mb-8 border border-slate-200 bg-slate-100">
                    <Image
                      src={coverImage}
                      alt={announcement.title}
                      fill
                      className="object-cover"
                      priority
                      unoptimized
                    />
                  </div>

                  {/* 3. Article Content (Left Aligned for clean reading flow) */}
                  <RichContentViewer
                    content={announcement.content || announcement.summary || "Belum ada konten teks mading."}
                    className="mt-6 mb-4 text-left"
                  />
                  {isEdited && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 inline-block mt-2">
                      Di edit
                    </span>
                  )}

                  {/* File Attachments */}
                  {announcement.attachments && announcement.attachments.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2c1ee8]" /> Lampiran Berkas
                      </h3>
                      <div className="space-y-2">
                        {announcement.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-sm group"
                          >
                            <div className="flex items-center gap-2.5 text-slate-800 font-medium">
                              <FileText className="w-4 h-4 text-slate-500 group-hover:text-[#2c1ee8]" />
                              <span>{file.name}</span>
                            </div>
                            <Download className="w-4 h-4 text-slate-400 group-hover:text-[#2c1ee8]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Publish Date */}
                  <div className="mt-10 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-medium text-slate-500">
                    {isEdited ? (
                      <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        Di edit • {formatDate(announcement.updatedAt)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span>{formattedDate}</span>
                  </div>
                </article>

                {/* 5. Mading Terbaru & Mading Terpopuler Sections */}
                <div className="space-y-12 pt-8 border-t border-slate-100">
                  
                  {/* A. Mading Terbaru Section */}
                  {latestArticles.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                          <span className="text-xs font-bold text-[#2c1ee8] uppercase tracking-wider block mb-1">
                            Mading Terbaru
                          </span>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            Pengumuman Terbaru Sekolah
                          </h2>
                        </div>

                        <Link
                          href="/mading"
                          className="text-xs font-bold text-[#2c1ee8] hover:text-blue-700 transition-colors flex items-center gap-1 group shrink-0"
                        >
                          <span>Lihat Semua</span>
                          <ArrowLeft className="w-3.5 h-3.5 rotate-180 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* Latest Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {latestArticles.map((item) => (
                          <Link
                            key={item.id}
                            href={`/mading/${item.id}`}
                            className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group flex flex-col justify-between"
                          >
                            <div>
                              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                <Image
                                  src={getCoverImage(item)}
                                  alt={item.title}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  unoptimized
                                />
                                <span className="absolute top-3 left-3 bg-[#2c1ee8] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                                  {item.category || "Pengumuman"}
                                </span>
                              </div>

                              <div className="p-5">
                                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#2c1ee8] transition-colors line-clamp-2">
                                  {item.title}
                                </h3>
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                                  {stripHtml(item.summary || item.content)}
                                </p>
                              </div>
                            </div>

                            <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2 pt-3">
                              <span className="text-xs text-slate-500 font-medium">
                                {item.author || item.createdBy || "Redaksi"}
                              </span>
                              <span className="text-xs font-bold text-[#2c1ee8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Baca Artikel</span>
                                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* B. Mading Terpopuler Section */}
                  {popularArticles.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                            Mading Terpopuler
                          </span>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            Artikel Banyak Dibaca
                          </h2>
                        </div>

                        <Link
                          href="/mading"
                          className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1 group shrink-0"
                        >
                          <span>Lihat Semua</span>
                          <ArrowLeft className="w-3.5 h-3.5 rotate-180 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* Popular Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {popularArticles.map((item) => (
                          <Link
                            key={item.id}
                            href={`/mading/${item.id}`}
                            className="bg-white border border-amber-200/80 hover:border-amber-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group flex flex-col justify-between"
                          >
                            <div>
                              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                <Image
                                  src={getCoverImage(item)}
                                  alt={item.title}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  unoptimized
                                />
                                <span className="absolute top-3 left-3 bg-amber-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                                  {item.category || "Populer"}
                                </span>
                              </div>

                              <div className="p-5">
                                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                                  {item.title}
                                </h3>
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                                  {stripHtml(item.summary || item.content)}
                                </p>
                              </div>
                            </div>

                            <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2 pt-3">
                              <span className="text-xs text-slate-500 font-medium">
                                {item.author || item.createdBy || "Redaksi"}
                              </span>
                              <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Baca Artikel</span>
                                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                </div>
              </div>

              {/* RIGHT COLUMN: Facebook-style Sticky Comments Sidebar (lg:col-span-5) */}
              <div className="lg:col-span-5 lg:sticky lg:top-28 w-full">
                <AnnouncementCommentSection
                  announcementId={announcement.id}
                  isCommentsLockedInitial={!!announcement.isCommentsLocked}
                />
              </div>

            </div>
          </>
        )}
      </main>

      {/* Edit Mading Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#2c1ee8]" />
                <span>Edit Pengumuman Mading</span>
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#2c1ee8]"
                  placeholder="Judul mading..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Mading *</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#2c1ee8] bg-white"
                >
                  <option value="Informasi Sekolah">Informasi Sekolah</option>
                  <option value="Kegiatan Siswa">Kegiatan Siswa</option>
                  <option value="Prestasi & Lomba">Prestasi & Lomba</option>
                  <option value="Akademik & Ujian">Akademik & Ujian</option>
                  <option value="Fasilitas & Layanan">Fasilitas & Layanan</option>
                </select>
              </div>

              {/* Cover Image Crop & Upload */}
              <div>
                <ImageCropUploader
                  label="Ganti Gambar Sampul Mading (Cover Image)"
                  initialImageUrl={editCoverImageUrl || announcement.coverImageUrl || announcement.imageUrl}
                  onCropped={handleEditCroppedImage}
                />
                {isUploadingEditCover && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-extrabold text-[#2c1ee8] flex items-center gap-2">
                    <TwinOrbitSpinner size="xs" color="primary" />
                    <span>Mengunggah gambar sampul baru...</span>
                  </div>
                )}
              </div>

              <RichTextEditor
                label="Isi / Konten Mading"
                required
                value={editForm.content}
                onChange={(val) => setEditForm({ ...editForm, content: val })}
                placeholder="Tuliskan isi pengumuman mading secara rinci..."
                helperText="Format konten mading dengan teks tebal, daftar, atau judul agar lebih mudah dibaca."
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || isUploadingEditCover}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-[#2218a3] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSavingEdit || isUploadingEditCover ? (
                    <>
                      <TwinOrbitSpinner size="xs" color="white" />
                      <span>{isUploadingEditCover ? "Mengunggah Gambar..." : "Menyimpan Perubahan..."}</span>
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
    </div>
  );
}
