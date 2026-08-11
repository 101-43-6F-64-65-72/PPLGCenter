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

  // Category badge styling — selaras dengan Kalender
  const getCategoryBadgeStyle = (category) => {
    if (!category) return "bg-gray-100 text-gray-700 border-gray-200";
    const cat = category.trim().toLowerCase();
    if (cat.includes("libur")) return "bg-red-50 text-red-700 border-red-200";
    if (cat.includes("ujian")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (cat.includes("osis")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (cat.includes("ekstra")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (cat.includes("akademik")) return "bg-green-50 text-green-700 border-green-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased relative">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gray-200 z-50">
        <div
          className="h-full bg-blue-600 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <Navbar />

      <main className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb / Back Link */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <Link
            href="/mading"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Mading Digital
          </Link>
        </div>

        {isLoading ? (
          <AnnouncementDetailSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Article */}
            <div className="lg:col-span-7 space-y-8">
              <article className="bg-white border border-gray-200 rounded-md overflow-hidden">

                {/* Cover Image */}
                <div className="relative w-full aspect-[16/7] overflow-hidden bg-gray-100">
                  <Image
                    src={coverImage}
                    alt={announcement.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  {/* Category badge overlay */}
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-bold border ${getCategoryBadgeStyle(announcement.category)}`}>
                      {announcement.category || "Pengumuman"}
                    </span>
                  </div>
                  {announcement.isPinned && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Pin className="w-4 h-4" />
                        Disematkan
                      </span>
                    </div>
                  )}
                </div>

                {/* Article Content */}
                <div className="p-6 sm:p-8">
                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-snug mb-5">
                    {announcement.title}
                  </h1>

                  {/* Meta bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-200">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-800">{authorName}</span>
                      </div>
                      <span className="text-gray-300">·</span>
                      <span>{formattedDate}</span>
                      <span className="text-gray-300">·</span>
                      <span>{estimatedReadTime} mnt baca</span>
                      {isEdited && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="bg-amber-50 text-amber-800 font-semibold px-2.5 py-0.5 rounded border border-amber-200 text-xs">
                            Diedit
                          </span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isAuthorOrAdmin && (
                        <button
                          onClick={handleOpenEdit}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {copied ? "Tersalin!" : "Bagikan"}
                      </button>
                    </div>
                  </div>

                  {/* Article Body */}
                  <RichContentViewer
                    content={announcement.content || announcement.summary || "Belum ada konten teks mading."}
                    className="text-gray-700 leading-relaxed"
                  />

                  {/* File Attachments */}
                  {announcement.attachments && announcement.attachments.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> Lampiran
                      </h3>
                      <div className="space-y-2">
                        {announcement.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors text-sm group"
                          >
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                              <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                              <span>{file.name}</span>
                            </div>
                            <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer date */}
                  <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
                    {isEdited ? (
                      <span className="text-amber-600 font-medium">
                        Diedit pada {formatDate(announcement.updatedAt)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span>Dipublikasi: {formattedDate}</span>
                  </div>
                </div>
              </article>

              {/* Related Articles Section */}
              {(latestArticles.length > 0 || popularArticles.length > 0) && (
                <section className="space-y-6">
                  {latestArticles.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-md p-5">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-800">Mading Terbaru</h2>
                        <Link href="/mading" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                          Lihat Semua →
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {latestArticles.map((item) => (
                          <Link
                            key={item.id}
                            href={`/mading/${item.id}`}
                            className="group flex gap-3 p-3 rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-gray-100">
                              <Image
                                src={getCoverImage(item)}
                                alt={item.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border mb-1 ${getCategoryBadgeStyle(item.category)}`}>
                                {item.category || "Pengumuman"}
                              </span>
                              <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </h3>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {popularArticles.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-md p-5">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-800">Banyak Dibaca</h2>
                        <Link href="/mading" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                          Lihat Semua →
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {popularArticles.map((item) => (
                          <Link
                            key={item.id}
                            href={`/mading/${item.id}`}
                            className="group flex gap-3 p-3 rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-gray-100">
                              <Image
                                src={getCoverImage(item)}
                                alt={item.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border mb-1 ${getCategoryBadgeStyle(item.category)}`}>
                                {item.category || "Pengumuman"}
                              </span>
                              <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
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

            {/* RIGHT COLUMN: Sticky Comments Sidebar */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 w-full">
              <AnnouncementCommentSection
                announcementId={announcement.id}
                isCommentsLockedInitial={!!announcement.isCommentsLocked}
              />
            </div>

          </div>
        )}
      </main>

      {/* Edit Mading Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-xl rounded-md p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Edit Pengumuman
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="Judul mading..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kategori *</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
                >
                  <option value="Informasi Sekolah">Informasi Sekolah</option>
                  <option value="Kegiatan Siswa">Kegiatan Siswa</option>
                  <option value="Prestasi & Lomba">Prestasi &amp; Lomba</option>
                  <option value="Akademik & Ujian">Akademik &amp; Ujian</option>
                  <option value="Fasilitas & Layanan">Fasilitas &amp; Layanan</option>
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
                  <div className="mt-2 p-2.5 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 flex items-center gap-2">
                    <TwinOrbitSpinner size="xs" color="primary" />
                    <span>Mengunggah gambar sampul...</span>
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || isUploadingEditCover}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingEdit || isUploadingEditCover ? (
                    <>
                      <TwinOrbitSpinner size="xs" color="white" />
                      <span>{isUploadingEditCover ? "Mengunggah..." : "Menyimpan..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
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
