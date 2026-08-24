"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  SlidersHorizontal,
  Check,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  AlertCircle,
  Save,
  Image as ImageIcon,
  Link as LinkIcon,
  UploadCloud,
  FileText,
  Pencil,
  GripVertical,
  RotateCcw,
  Archive,
  Info,
} from "lucide-react";
import showcaseBannerService from "@/services/showcaseBannerService";
import { resolveImageUrl } from "@/lib/utils";
import uploadImageToCloudinary from "@/services/cloudinaryService";

const MAX_SHOWCASE_BANNERS = 5;

export default function ManageShowcaseModal({
  isOpen,
  onClose,
  allAnnouncements = [],
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState("active_list"); // 'active_list' | 'archive_list' | 'custom_banner' | 'add_announcement'
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Form state for adding from announcement
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState("");

  // Form state for custom banner & edit
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customLinkUrl, setCustomLinkUrl] = useState("");
  const [customButtonText, setCustomButtonText] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load all showcase banners
  const loadBanners = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await showcaseBannerService.getAllBanners();
      const items = res?.data || res?.items || res || [];
      if (Array.isArray(items)) {
        setBanners(items);
      }
    } catch (err) {
      console.error("Failed to load showcase banners:", err);
      setErrorMsg("Gagal memuat daftar banner showcase.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBanners();
      setActiveTab("active_list");
      setSelectedAnnouncementId("");
      setEditingBannerId(null);
      setCustomTitle("");
      setCustomDescription("");
      setCustomImageUrl("");
      setCustomLinkUrl("");
      setCustomButtonText("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeBanners = banners
    .filter((b) => b.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Arsip HANYA untuk banner kustom
  const archivedBanners = banners.filter((b) => !b.isActive && !b.announcementId);
  const isMaxCapacity = activeBanners.length >= MAX_SHOWCASE_BANNERS;

  // Handle start editing an existing banner
  const handleStartEdit = (banner) => {
    setEditingBannerId(banner.id);
    setCustomTitle(banner.title || "");
    setCustomDescription(banner.description || "");
    setCustomImageUrl(banner.imageUrl || "");
    setCustomLinkUrl(banner.linkUrl || "");
    setCustomButtonText(banner.buttonText || "");
    setErrorMsg("");
    setSuccessMsg("");
    setActiveTab("custom_banner");
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingBannerId(null);
    setCustomTitle("");
    setCustomDescription("");
    setCustomImageUrl("");
    setCustomLinkUrl("");
    setCustomButtonText("");
    setErrorMsg("");
    setActiveTab("active_list");
  };

  // Handle Drag and Drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...activeBanners];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    // Update state immediately
    setBanners((prev) => [
      ...reordered,
      ...prev.filter((b) => !b.isActive),
    ]);

    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      await showcaseBannerService.reorderBanners(reordered.map((b) => b.id));
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Failed to save banner reorder:", err);
      setErrorMsg("Gagal menyimpan urutan banner.");
    }
  };

  // Handle move order with buttons
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeBanners.length) return;

    const updated = [...activeBanners];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setBanners((prev) => [
      ...reordered,
      ...prev.filter((b) => !b.isActive),
    ]);

    try {
      await showcaseBannerService.reorderBanners(reordered.map((b) => b.id));
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Failed to save banner reorder:", err);
    }
  };

  // Handle remove active banner (Custom goes to Archive, Announcement deletes directly)
  const handleRemoveActiveBanner = async (item) => {
    const isCustom = !item.announcementId;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (isCustom) {
        await showcaseBannerService.deleteBanner(item.id, false);
        setSuccessMsg("Banner kustom dinonaktifkan dan tersimpan di arsip.");
      } else {
        await showcaseBannerService.deleteBanner(item.id, true);
        setSuccessMsg("Pengumuman berhasil dihapus dari showcase slider.");
      }
      if (editingBannerId === item.id) {
        handleCancelEdit();
      }
      await loadBanners();
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Failed to remove banner:", err);
      setErrorMsg("Gagal menghapus banner dari showcase.");
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus banner ini secara permanen?")) {
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await showcaseBannerService.deleteBanner(id, true);
      setSuccessMsg("Banner berhasil dihapus secara permanen.");
      await loadBanners();
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Failed to permanently delete banner:", err);
      setErrorMsg("Gagal menghapus banner permanen.");
    }
  };

  // Handle restore banner
  const handleRestoreBanner = async (id) => {
    if (isMaxCapacity) {
      setErrorMsg(`Maksimal ${MAX_SHOWCASE_BANNERS} banner aktif telah tercapai. Nonaktifkan salah satu banner terlebih dahulu.`);
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await showcaseBannerService.restoreBanner(id);
      setSuccessMsg("Banner berhasil dipulihkan dan aktif di slider.");
      await loadBanners();
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Failed to restore banner:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal memulihkan banner.");
    }
  };

  // Handle Add from Announcement
  const handleAddFromAnnouncement = async (e) => {
    e.preventDefault();
    if (!selectedAnnouncementId) return;

    if (isMaxCapacity) {
      setErrorMsg(`Maksimal ${MAX_SHOWCASE_BANNERS} banner aktif telah tercapai. Hapus atau nonaktifkan banner yang ada terlebih dahulu.`);
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await showcaseBannerService.addFromAnnouncement(selectedAnnouncementId);
      setSuccessMsg("Pengumuman berhasil ditambahkan ke showcase!");
      setSelectedAnnouncementId("");
      await loadBanners();
      onRefresh && onRefresh();
      setActiveTab("active_list");
    } catch (err) {
      console.error("Failed to add announcement to showcase:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal menambahkan pengumuman ke showcase.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Image Upload for Custom Banner
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setErrorMsg("");
    try {
      const url = await uploadImageToCloudinary(file, "showcase_banners");
      if (url) {
        setCustomImageUrl(url);
      } else {
        setErrorMsg("Gagal mengunggah gambar.");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setErrorMsg("Terjadi kendala saat upload gambar.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle Save / Update Custom Banner
  const handleSaveCustomBanner = async (e) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      setErrorMsg("Judul banner wajib diisi.");
      return;
    }
    if (!customImageUrl.trim()) {
      setErrorMsg("Gambar banner wajib diisi atau diunggah.");
      return;
    }

    if (!editingBannerId && isMaxCapacity) {
      setErrorMsg(`Maksimal ${MAX_SHOWCASE_BANNERS} banner aktif telah tercapai. Nonaktifkan salah satu banner sebelum membuat baru.`);
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const existingBanner = editingBannerId ? banners.find((b) => b.id === editingBannerId) : null;
      const payload = {
        title: customTitle.trim(),
        description: customDescription.trim() || null,
        imageUrl: customImageUrl.trim(),
        linkUrl: customLinkUrl.trim() || null,
        buttonText: customLinkUrl.trim() ? (customButtonText.trim() || "Lihat Selengkapnya") : null,
        order: existingBanner ? (existingBanner.order || 1) : activeBanners.length + 1,
        isActive: true,
      };

      if (editingBannerId) {
        await showcaseBannerService.updateBanner(editingBannerId, payload);
        setSuccessMsg("Banner kustom berhasil diperbarui!");
      } else {
        await showcaseBannerService.createBanner(payload);
        setSuccessMsg("Banner kustom berhasil dibuat dan aktif di showcase!");
      }

      setEditingBannerId(null);
      setCustomTitle("");
      setCustomDescription("");
      setCustomImageUrl("");
      setCustomLinkUrl("");
      setCustomButtonText("");

      await loadBanners();
      onRefresh && onRefresh();
      setActiveTab("active_list");
    } catch (err) {
      console.error("Failed to save custom banner:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal menyimpan banner kustom.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#2C1EE8] border border-blue-100">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Kelola Showcase Slider
                </h3>
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                    isMaxCapacity
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-blue-50 text-[#2C1EE8] border-blue-100"
                  }`}
                >
                  {activeBanners.length}/{MAX_SHOWCASE_BANNERS} Maks
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tarik slide (drag) untuk ubah urutan. Maksimal 5 banner aktif.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-0 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              if (editingBannerId) setEditingBannerId(null);
              setActiveTab("active_list");
            }}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "active_list"
                ? "border-[#2C1EE8] text-[#2C1EE8]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Slide Aktif</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-extrabold">
              {activeBanners.length}/{MAX_SHOWCASE_BANNERS}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (editingBannerId) setEditingBannerId(null);
              setActiveTab("archive_list");
            }}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "archive_list"
                ? "border-[#2C1EE8] text-[#2C1EE8]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arsip ({archivedBanners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("custom_banner")}
            disabled={!editingBannerId && isMaxCapacity}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "custom_banner"
                ? "border-[#2C1EE8] text-[#2C1EE8]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {editingBannerId ? (
              <>
                <Pencil className="w-3.5 h-3.5 text-[#2C1EE8]" />
                <span className="text-[#2C1EE8]">Edit Banner</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Banner Kustom</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (editingBannerId) setEditingBannerId(null);
              setActiveTab("add_announcement");
            }}
            disabled={isMaxCapacity}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "add_announcement"
                ? "border-[#2C1EE8] text-[#2C1EE8]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tambah dari Pengumuman</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SLIDE AKTIF (DENGAN DRAG & DROP) */}
          {activeTab === "active_list" && (
            <div className="space-y-3">
              {isMaxCapacity && (
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#2C1EE8] shrink-0" />
                  <span>Kapasitas penuh (5/5). Untuk menambah banner baru, nonaktifkan atau hapus salah satu slide di bawah.</span>
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  Memuat daftar banner...
                </div>
              ) : activeBanners.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Belum ada banner aktif di showcase slider.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Buat banner kustom mandiri atau pulihkan dari arsip banner.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBannerId(null);
                        setActiveTab("custom_banner");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2C1EE8] text-white text-xs font-bold hover:bg-[#2013ce] cursor-pointer"
                    >
                      + Buat Banner Kustom
                    </button>
                    {archivedBanners.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("archive_list")}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                      >
                        Buka Arsip ({archivedBanners.length})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeBanners.map((item, index) => {
                    const cover = resolveImageUrl(
                      item.imageUrl || "/images/tempat/halamandepansmkn2ska.jpg"
                    );
                    const isCustom = !item.announcementId;
                    const isDraggingThis = draggedIndex === index;
                    const isOverThis = dragOverIndex === index && draggedIndex !== index;

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`p-3 bg-white border rounded-2xl shadow-2xs flex items-center justify-between gap-3 transition-all cursor-move ${
                          isDraggingThis
                            ? "opacity-40 border-dashed border-[#2C1EE8] scale-[0.98]"
                            : isOverThis
                            ? "border-[#2C1EE8] ring-2 ring-[#2C1EE8]/20 bg-blue-50/30"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Drag Handle */}
                          <div className="text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing p-0.5">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Order index badge */}
                          <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#2C1EE8] border border-blue-100 flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </div>

                          {/* Thumbnail */}
                          <div className="relative w-16 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                            <Image
                              src={cover}
                              alt={item.title}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-900 truncate max-w-xs" title={item.title}>
                                {item.title}
                              </h5>
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                  isCustom
                                    ? "bg-purple-50 text-purple-700 border border-purple-100"
                                    : "bg-blue-50 text-[#2C1EE8] border border-blue-100"
                                }`}
                              >
                                {isCustom ? "Banner Kustom" : "Pengumuman"}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.linkUrl ? (
                                <span className="text-blue-600 flex items-center gap-1">
                                  <LinkIcon className="w-2.5 h-2.5" />
                                  <span>Tombol: {item.buttonText || "Buka Link"} ({item.linkUrl})</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Tanpa Tombol Link</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Actions: Edit (only custom), Order buttons & Archive Control */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-[#2C1EE8] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit banner kustom"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(index, -1)}
                            className="p-1.5 text-slate-400 hover:text-[#2C1EE8] hover:bg-slate-100 rounded-lg disabled:opacity-20 transition cursor-pointer"
                            title="Geser ke atas"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={index === activeBanners.length - 1}
                            onClick={() => handleMoveOrder(index, 1)}
                            className="p-1.5 text-slate-400 hover:text-[#2C1EE8] hover:bg-slate-100 rounded-lg disabled:opacity-20 transition cursor-pointer"
                            title="Geser ke bawah"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveActiveBanner(item)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isCustom
                                ? "text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title={isCustom ? "Nonaktifkan dan simpan ke arsip" : "Hapus dari showcase slider"}
                          >
                            {isCustom ? <Archive className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ARSIP BANNER KUSTOM (BISA DIPULIHKAN ATAU DIHAPUS PERMANEN) */}
          {activeTab === "archive_list" && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium">
                Banner kustom yang dinonaktifkan akan disimpan di arsip ini. Anda dapat memulihkannya kembali ke slider atau menghapusnya secara permanen.
              </div>

              {archivedBanners.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Tidak ada banner kustom di dalam arsip.
                </div>
              ) : (
                <div className="space-y-2">
                  {archivedBanners.map((item) => {
                    const cover = resolveImageUrl(
                      item.imageUrl || "/images/tempat/halamandepansmkn2ska.jpg"
                    );
                    const isCustom = !item.announcementId;

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail */}
                          <div className="relative w-16 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 opacity-75">
                            <Image
                              src={cover}
                              alt={item.title}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-800 truncate max-w-xs" title={item.title}>
                                {item.title}
                              </h5>
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                  isCustom
                                    ? "bg-purple-50 text-purple-700 border border-purple-100"
                                    : "bg-blue-50 text-[#2C1EE8] border border-blue-100"
                                }`}
                              >
                                {isCustom ? "Kustom" : "Pengumuman"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Status: Tersimpan di arsip
                            </p>
                          </div>
                        </div>

                        {/* Actions: Restore & Permanent Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isMaxCapacity}
                            onClick={() => handleRestoreBanner(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#2C1EE8] hover:bg-[#2013ce] disabled:opacity-40 disabled:hover:bg-[#2C1EE8] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                            title="Tampilkan kembali di showcase slider"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Tampilkan Kembali</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus permanen dari database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BUAT ATAU EDIT BANNER KUSTOM */}
          {activeTab === "custom_banner" && (
            <form onSubmit={handleSaveCustomBanner} className="space-y-4">
              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-xs text-purple-900 font-medium flex items-center justify-between">
                <div>
                  <strong>{editingBannerId ? "Mode Edit Banner:" : "Banner Kustom:"}</strong> Banner ini khusus untuk slider showcase utama dan <strong>tidak akan</strong> masuk ke daftar pengumuman umum.
                </div>
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="ml-2 text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer shrink-0"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Banner *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Sambut Siswa Baru PPLG Center 2026"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi / Subjudul Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat yang tampil di bawah judul banner..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#2C1EE8] focus:bg-white transition resize-none"
                />
              </div>

              {/* Upload Gambar Banner */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gambar Sampul Banner *
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan URL gambar atau upload di samping..."
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-[#2C1EE8] cursor-pointer transition shadow-2xs shrink-0">
                      <UploadCloud className="w-3.5 h-3.5 text-[#2C1EE8]" />
                      <span>{isUploadingImage ? "Mengunggah..." : "Upload"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>

                  {customImageUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <Image
                        src={resolveImageUrl(customImageUrl)}
                        alt="Preview Banner"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Link Tujuan (Opsional) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Link Aksi Tombol (Opsional)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Kosongkan jika tidak butuh tombol
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Link / URL Tujuan
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: /fasilitas atau https://..."
                      value={customLinkUrl}
                      onChange={(e) => setCustomLinkUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#2C1EE8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Teks Tombol
                    </label>
                    <input
                      type="text"
                      placeholder="Default: Pelajari Selengkapnya"
                      value={customButtonText}
                      disabled={!customLinkUrl}
                      onChange={(e) => setCustomButtonText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#2C1EE8] disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {editingBannerId ? "Batal Edit" : "Batal"}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !customTitle || !customImageUrl || (!editingBannerId && isMaxCapacity)}
                  className="px-5 py-2 rounded-xl bg-[#2C1EE8] hover:bg-[#2013ce] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {isSaving
                      ? "Menyimpan..."
                      : editingBannerId
                      ? "Perbarui Banner"
                      : "Simpan Banner Kustom"}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: TAMBAH DARI PENGUMUMAN */}
          {activeTab === "add_announcement" && (
            <form onSubmit={handleAddFromAnnouncement} className="space-y-4">
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900 font-medium">
                Pilih pengumuman yang sudah ada di database untuk ditampilkan sebagai slide showcase.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pilih Pengumuman
                </label>
                <select
                  value={selectedAnnouncementId}
                  onChange={(e) => setSelectedAnnouncementId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#2C1EE8] cursor-pointer shadow-2xs"
                >
                  <option value="">-- Pilih dari pengumuman yang ada --</option>
                  {allAnnouncements.map((ann) => (
                    <option key={ann.id} value={ann.id}>
                      [{ann.category || "General"}] {ann.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("active_list")}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !selectedAnnouncementId || isMaxCapacity}
                  className="px-5 py-2 rounded-xl bg-[#2C1EE8] hover:bg-[#2013ce] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Menambahkan..." : "Tambahkan ke Showcase"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-[11px] text-slate-400 font-medium">
            Urutan 1 tampil sebagai slide pertama di slider.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
