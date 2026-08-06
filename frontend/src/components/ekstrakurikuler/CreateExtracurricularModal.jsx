"use client";

import React, { useState } from "react";
import { X, Upload, Plus, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { extracurricularService } from "@/services/extracurricularService";
import uploadImageToCloudinary from "@/services/cloudinaryService";

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
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Teknologi & Software",
    maxMembers: 50,
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("File harus berupa gambar (JPG, PNG, WebP).");
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage("");
    }
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
      let imageUrl = "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80";

      // Upload image to Cloudinary if file selected
      if (selectedFile) {
        try {
          const uploadedUrl = await uploadImageToCloudinary(selectedFile);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        } catch (uploadErr) {
          console.warn("Cloudinary fallback warning:", uploadErr);
        }
      }

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        maxMembers: Number(formData.maxMembers),
        description: formData.description.trim(),
        imageUrl: imageUrl,
      };

      const res = await extracurricularService.createExtracurricular(payload);

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
        // Reset Form
        setFormData({
          name: "",
          category: "Teknologi & Software",
          maxMembers: 50,
          description: "",
        });
        setSelectedFile(null);
        setImagePreview(null);
      } else {
        setErrorMessage(res.message || "Gagal membuat ekstrakurikuler.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2c1ee8] text-xs font-bold mb-1 border border-blue-100">
              <Plus className="w-3.5 h-3.5" />
              <span>Wewenang Admin & Guru Pembina</span>
            </div>
            <h3 className="text-xl font-black text-gray-900">Tambah Ekstrakurikuler Baru</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
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

          {/* Image Upload Header/Banner */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Foto Banner Ekstrakurikuler (PDF/Gambar)
            </label>

            <div className="flex items-center gap-4">
              <div className="relative w-28 h-20 rounded-2xl border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-4 h-4 text-[#2c1ee8]" />
                  <span>Pilih Gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-gray-400 mt-1">Format: JPG, PNG, WebP (Maks 5MB)</p>
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Buat Ekstrakurikuler</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
