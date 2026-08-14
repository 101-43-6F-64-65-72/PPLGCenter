"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Edit2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { extracurricularService } from "@/services/extracurricularService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import ImageCropUploader from "@/components/common/ImageCropUploader";
import TeacherSelect from "@/components/common/TeacherSelect";

const CATEGORY_OPTIONS = [
  "Teknologi & Software",
  "Olahraga",
  "Seni & Budaya",
  "Akademik & Sains",
  "Keagamaan",
  "Kepemimpinan & Organisasi",
];

export default function CreateExtracurricularModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Teknologi & Software",
    maxMembers: 50,
    description: "",
    scheduleDay: "Senin",
    scheduleTime: "15:00 - 17:00",
    location: "Lapangan Sekolah",
    supervisorTeacherId: "",
    advisorName: "",
    advisorWhatsapp: "",
  });

  const [imageUrl, setImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync state when modal opens or editingItem changes
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          name: editingItem.name || "",
          category: editingItem.category || "Teknologi & Software",
          maxMembers: editingItem.maxMembers || 50,
          description: editingItem.description || "",
          scheduleDay: editingItem.scheduleDay || "Senin",
          scheduleTime: editingItem.scheduleTime || "15:00 - 17:00",
          location: editingItem.location || "Lapangan Sekolah",
          supervisorTeacherId: editingItem.supervisorTeacherId || editingItem.supervisor?.id || "",
          advisorName: editingItem.supervisor?.name || editingItem.advisorName || "",
          advisorWhatsapp: editingItem.supervisor?.phoneNumber || editingItem.advisorWhatsapp || "",
        });
        setImageUrl(editingItem.imageUrl || editingItem.ImageUrl || null);
      } else {
        setFormData({
          name: "",
          category: "Teknologi & Software",
          maxMembers: 50,
          description: "",
          scheduleDay: "Senin",
          scheduleTime: "15:00 - 17:00",
          location: "Lapangan Sekolah",
          supervisorTeacherId: "",
          advisorName: "",
          advisorWhatsapp: "",
        });
        setImageUrl(null);
      }
      setErrorMessage("");
      setUploadError("");
      setIsUploading(false);
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleTeacherChange = (teacherId, teacherObj) => {
    setFormData((prev) => ({
      ...prev,
      supervisorTeacherId: teacherId || "",
      advisorName: teacherObj ? (teacherObj.fullName || teacherObj.name) : prev.advisorName,
      advisorWhatsapp: teacherObj ? (teacherObj.phoneNumber || prev.advisorWhatsapp) : prev.advisorWhatsapp,
    }));
    setErrorMessage("");
  };

  const handleCroppedImage = async (dataUrl, metadata) => {
    setIsUploading(true);
    setUploadError("");
    try {
      const fileToUpload = metadata?.croppedFile || (await fetch(dataUrl).then((r) => r.blob()).then((blob) => new File([blob], `cover-${Date.now()}.jpg`, { type: "image/jpeg" })));
      const uploadedUrl = await uploadImageToCloudinary(fileToUpload);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
      } else {
        setUploadError("Gagal mengunggah gambar. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Gagal mengunggah gambar ke Cloudinary:", err);
      setUploadError("Gagal mengunggah gambar. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCover = () => {
    setImageUrl(null);
    setUploadError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage("Nama ekstrakurikuler wajib diisi.");
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage("Deskripsi ekstrakurikuler wajib diisi.");
      return;
    }
    if (!formData.maxMembers || Number(formData.maxMembers) < 1) {
      setErrorMessage("Kapasitas anggota minimal 1 orang.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        maxMembers: Number(formData.maxMembers),
        description: formData.description.trim(),
        scheduleDay: formData.scheduleDay || "Senin",
        scheduleTime: formData.scheduleTime || "15:00 - 17:00",
        location: formData.location || "Lapangan Sekolah",
        imageUrl: imageUrl,
        supervisorTeacherId: formData.supervisorTeacherId || null,
        advisorName: formData.advisorName ? formData.advisorName.trim() : null,
        advisorWhatsapp: formData.advisorWhatsapp ? formData.advisorWhatsapp.trim() : null,
        isActive: editingItem ? (editingItem.isActive ?? true) : true,
      };

      let res;
      if (editingItem?.id) {
        res = await extracurricularService.updateExtracurricular(editingItem.id, payload);
      } else {
        res = await extracurricularService.createExtracurricular(payload);
      }

      if (res?.success || res?.id || res?.data) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(res?.message || "Gagal menyimpan ekstrakurikuler.");
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = Boolean(editingItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2c1ee8] text-xs font-bold mb-1 border border-blue-100">
              {isEditMode ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Wewenang Admin & Guru Pembina</span>
            </div>
            <h3 className="text-xl font-black text-gray-900">
              {isEditMode ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler Baru"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
            className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cover Image Upload Component */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/80">
            <ImageCropUploader
              label="Cover Ekstrakurikuler (Rasio 16:9)"
              defaultAspectRatio="16:9"
              initialImageUrl={imageUrl}
              onCropped={handleCroppedImage}
              onRemove={handleRemoveCover}
              isUploading={isUploading}
              uploadError={uploadError}
            />
          </div>

          {/* Nama Ekstrakurikuler */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Nama Ekstrakurikuler <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Contoh: Klub DevClub / Basket / Paskibra"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all font-semibold"
            />
          </div>

          {/* Teacher Selection (Guru Pembimbing) */}
          <TeacherSelect
            value={formData.supervisorTeacherId}
            onChange={handleTeacherChange}
            label="Pilih Guru Pembimbing / Pembina"
            placeholder="Cari NIP atau Nama Guru..."
          />

          {/* Kategori & Max Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-900 focus:border-[#2c1ee8] focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all font-semibold"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Kapasitas Anggota (Siswa) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="maxMembers"
                min="1"
                max="500"
                placeholder="50"
                value={formData.maxMembers}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all font-bold"
              />
            </div>
          </div>

          {/* Jadwal Hari & Jam */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Hari Latihan
              </label>
              <input
                type="text"
                name="scheduleDay"
                placeholder="Contoh: Senin & Kamis"
                value={formData.scheduleDay}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] focus:outline-none transition-all font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Jam Latihan
              </label>
              <input
                type="text"
                name="scheduleTime"
                placeholder="Contoh: 15:30 - 17:00"
                value={formData.scheduleTime}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] focus:outline-none transition-all font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Lokasi Latihan
              </label>
              <input
                type="text"
                name="location"
                placeholder="Contoh: Lapangan Utama"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] focus:outline-none transition-all font-semibold"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Deskripsi Ekstrakurikuler <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Jelaskan tujuan, visi, dan kegiatan ekstrakurikuler..."
              value={formData.description}
              onChange={handleInputChange}
              required
              className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah Cover...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditMode ? "Simpan Perubahan" : "Buat Ekstrakurikuler"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
