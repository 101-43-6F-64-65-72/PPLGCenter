"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Check, Calendar, Users, Megaphone, AlertCircle } from "lucide-react";
import announcementService from "@/services/announcementService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import { resolveImageUrl } from "@/lib/utils";
import RichTextEditor from "@/components/ui/RichTextEditor";

const OFFICIAL_PPLG_CLASSES = [
  "Semua Kelas",
  "X PPLG A",
  "X PPLG B",
  "XI PPLG A",
  "XI PPLG B",
  "XII PPLG A",
  "XII PPLG B",
];

const CATEGORY_OPTIONS = [
  "Pengumuman",
  "Akademik",
  "OSIS",
  "Ekstrakurikuler",
  "Ujian",
  "Libur",
  "Prestasi",
  "General",
];

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  onSuccess,
  editData = null,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Pengumuman");
  const [content, setContent] = useState("");
  const [selectedTargetClasses, setSelectedTargetClasses] = useState(["Semua Kelas"]);
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [publishStart, setPublishStart] = useState("");
  const [publishEnd, setPublishEnd] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isShowcase, setIsShowcase] = useState(false);
  const [showcaseOrder, setShowcaseOrder] = useState(1);
  const [customCtaText, setCustomCtaText] = useState("");
  const [customCtaUrl, setCustomCtaUrl] = useState("");

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setCategory(editData.category || "Pengumuman");
      setContent(editData.content || editData.summary || "");
      setCoverImageUrl(editData.coverImageUrl || editData.imageUrl || editData.image || "");
      setIsPinned(!!editData.isPinned);
      setIsShowcase(!!(editData.isShowcase ?? editData.IsShowcase));
      setShowcaseOrder(editData.showcaseOrder ?? editData.ShowcaseOrder ?? 1);
      setCustomCtaText(editData.customCtaText ?? editData.CustomCtaText ?? "");
      setCustomCtaUrl(editData.customCtaUrl ?? editData.CustomCtaUrl ?? "");
      if (editData.targetClasses) {
        setSelectedTargetClasses(editData.targetClasses.split(",").map((s) => s.trim()));
      } else {
        setSelectedTargetClasses(["Semua Kelas"]);
      }
      setPublishStart(editData.publishStart ? new Date(editData.publishStart).toISOString().slice(0, 16) : "");
      setPublishEnd(editData.publishEnd ? new Date(editData.publishEnd).toISOString().slice(0, 16) : "");
    } else {
      setTitle("");
      setCategory("Pengumuman");
      setContent("");
      setSelectedTargetClasses(["Semua Kelas"]);
      setPublishStart("");
      setPublishEnd("");
      setCoverImageUrl("");
      setIsPinned(false);
      setIsShowcase(false);
      setShowcaseOrder(1);
      setCustomCtaText("");
      setCustomCtaUrl("");
    }
    setErrorMsg("");
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setErrorMsg("");
    try {
      const uploadedUrl = await uploadImageToCloudinary(file, "announcements");
      if (uploadedUrl) {
        setCoverImageUrl(uploadedUrl);
      } else {
        setErrorMsg("Gagal mengunggah gambar sampul.");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setErrorMsg("Terjadi kendala saat mengunggah gambar.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Judul dan isi pengumuman wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category: category || "Pengumuman",
      targetClasses: selectedTargetClasses.join(", "),
      publishStart: publishStart ? new Date(publishStart).toISOString() : null,
      publishEnd: publishEnd ? new Date(publishEnd).toISOString() : null,
      coverImageUrl: coverImageUrl || null,
      imageUrl: coverImageUrl || null,
      isPinned: isPinned,
      isShowcase: isShowcase,
      showcaseOrder: parseInt(showcaseOrder, 10) || 1,
      customCtaText: customCtaText ? customCtaText.trim() : null,
      customCtaUrl: customCtaUrl ? customCtaUrl.trim() : null,
    };

    try {
      if (editData?.id) {
        await announcementService.updateAnnouncement(editData.id, payload);
      } else {
        await announcementService.createAnnouncement(payload);
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save announcement:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal menyimpan pengumuman.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#2C1EE8] border border-blue-100">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editData?.id ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pusat publikasi informasi resmi PPLG Center SMKN 2 Surakarta.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Judul Pengumuman */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Judul Pengumuman <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Jadwal Ujian Tengah Semester Ganjil PPLG"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-[#2C1EE8] focus:bg-white transition shadow-2xs"
            />
          </div>

          {/* Kategori & Pinned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-[#2C1EE8] focus:bg-white transition cursor-pointer shadow-2xs"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status Pin / Sematkan
              </label>
              <label className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition shadow-2xs">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2C1EE8] focus:ring-[#2C1EE8]"
                />
                <span className="text-xs font-bold text-slate-700">
                  Sematkan di baris teratas
                </span>
              </label>
            </div>
          </div>

          {/* Target Kelas Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Kelas Penerima
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[46px]">
              {selectedTargetClasses.map((cls) => (
                <span
                  key={cls}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2C1EE8] text-white text-xs font-bold shadow-2xs"
                >
                  <span>{cls}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClass(cls)}
                    className="hover:bg-blue-800 p-0.5 rounded-md cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsClassPickerOpen(!isClassPickerOpen)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#2C1EE8] text-slate-700 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#2C1EE8]" />
                  <span>Tambah Kelas</span>
                </button>

                {isClassPickerOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1">
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

          {/* Tanggal & Jam Mulai & Berakhir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mulai Berlaku
              </label>
              <input
                type="datetime-local"
                value={publishStart}
                onChange={(e) => setPublishStart(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Selesai / Berakhir
              </label>
              <input
                type="datetime-local"
                value={publishEnd}
                onChange={(e) => setPublishEnd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Gambar Sampul Pengumuman
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs font-semibold text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#2C1EE8] hover:file:bg-blue-100 cursor-pointer"
              />
              {isUploadingImage && <span className="text-xs text-[#2C1EE8] font-bold">Mengunggah gambar...</span>}
            </div>
            {coverImageUrl && (
              <div className="mt-3 relative w-40 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                <Image src={resolveImageUrl(coverImageUrl)} alt="Sampul" fill unoptimized className="object-cover" />
              </div>
            )}
          </div>

          {/* Isi Pengumuman dengan Rich Text Editor */}
          <RichTextEditor
            label="Isi Konten Pengumuman"
            helperText="Format teks, buat poin daftar, atau sematkan link tautan tujuan."
            required
            value={content}
            onChange={setContent}
            placeholder="Tuliskan isi pengumuman, instruksi lengkap, atau link pendaftaran di sini..."
          />

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="px-5 py-2.5 rounded-xl bg-[#2C1EE8] hover:bg-[#2013ce] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : editData?.id ? "Simpan Perubahan" : "Terbitkan Pengumuman"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
