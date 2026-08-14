"use client";

import React, { useState } from "react";
import { X, FileText, CheckCircle, Shield, AlertCircle } from "@/components/common/Icons";
import useAuth from "@/hooks/useAuth";
import announcementService from "@/services/announcementService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import ImageCropUploader from "@/components/common/ImageCropUploader";
import TwinOrbitSpinner from "@/components/ui/TwinOrbitSpinner";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { ROLE_LABELS } from "@/constants/userRoles";

export default function CreateAnnouncementModal({ isOpen, onClose, onSuccess }) {
  const { user, role } = useAuth();
  const userRole = (role || user?.role || "Student").toLowerCase();
  const isStudent = userRole === "student" || userRole === "siswa biasa";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Organisasi");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState("Pembina Ekskul / Guru (NIP)");

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleCroppedImage = async (dataUrl, metadata) => {
    setImageUrl(dataUrl); // instant preview as fallback
    setIsUploading(true);
    setUploadSuccessMsg("");
    try {
      const file = metadata?.croppedFile || (await fetch(dataUrl).then((r) => r.blob()).then((blob) => new File([blob], "mading-cover.jpg", { type: "image/jpeg" })));
      const uploadedUrl = await uploadImageToCloudinary(file);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        setUploadSuccessMsg("Gambar berhasil diunggah!");
      }
    } catch {
      setErrorMsg("Gagal mengunggah");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isUploading) return;
    if (!content || content.replace(/<[^>]*>/g, "").trim() === "") {
      setErrorMsg("Isi konten mading tidak boleh kosong.");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    const authorName = user?.fullName || user?.name || "Siswa SMKN 2";
    const roleTitle = ROLE_LABELS[role] || role || "Siswa Biasa";
    const currentDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let finalContent = content;

    // Append verification footer as HTML block
    if (isStudent) {
      finalContent += `<hr/><div style="font-size:0.8em;color:#6b7280;margin-top:8px"><strong>INFORMASI VERIFIKASI &amp; PUBLIKASI MADING</strong><br/>Diajukan Oleh: ${authorName} (Siswa SMKN 2 Surakarta)<br/>Diverifikasi &amp; Disetujui Oleh: ${selectedVerifier}<br/>Tanggal Konfirmasi: ${currentDate}<br/>Status: Terverifikasi Resmi &amp; Layak Terbit di Mading Digital.</div>`;
    } else {
      finalContent += `<hr/><div style="font-size:0.8em;color:#6b7280;margin-top:8px"><strong>INFORMASI VERIFIKASI &amp; PUBLIKASI MADING</strong><br/>Diterbitkan &amp; Diverifikasi Langsung Oleh: ${authorName} (${roleTitle})<br/>Tanggal Publikasi: ${currentDate}<br/>Status: Publikasi Resmi Terverifikasi Terbit.</div>`;
    }

    const payload = {
      title,
      category,
      content: finalContent,
      imageUrl: imageUrl || "/images/kegiatan/basket.jpg",
      coverImageUrl: imageUrl || "/images/kegiatan/basket.jpg",
      isPinned: isPinned,
      author: authorName,
    };

    try {
      const res = await announcementService.createAnnouncement(payload);
      if (res?.success || res?.id || res?.data) {
        onSuccess && onSuccess();
        onClose();
      } else {
        setErrorMsg(res?.message || "Gagal menerbitkan mading. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Gagal membuat mading:", err);
      setErrorMsg("Terjadi kesalahan jaringan saat membuat mading.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#2c1ee8] to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Buat Pengumuman Mading Baru</h2>
              <p className="text-xs text-blue-100">
                {isStudent ? "Alur Pengajuan Mading Siswa (Memerlukan Verifikasi)" : "Publikasi Mading Langsung Terverifikasi"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {uploadSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {/* Student Verification Notice Banner */}
          {isStudent ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Alur Verifikasi Pengajuan Mading Siswa</span>
              </div>
              <p className="leading-relaxed">
                Sebagai <strong>Siswa</strong>, mading Anda akan diverifikasi oleh Pembina/OSIS/Admin. Informasi nama dan role pihak yang mengonfirmasi & memverifikasi mading ini akan ditampilkan secara resmi di bagian bawah artikel.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-800">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Publikasi Langsung Terverifikasi ({ROLE_LABELS[role] || role})</span>
              </div>
              <p>Mading yang Anda buat akan langsung dipublikasikan dengan tanda tangan verifikasi resmi akun Anda.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Judul Mading *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Turnamen Basket SMKN 2 Surakarta Cup 2026"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#2c1ee8] focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Kategori Mading *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#2c1ee8] focus:ring-2 focus:ring-blue-100 outline-none bg-white"
              >
                <option value="Akademik">Akademik</option>
                <option value="OSIS">OSIS</option>
                <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                <option value="Libur Nasional">Libur Nasional</option>
                <option value="Ujian">Ujian</option>
                <option value="General">General / Umum</option>
              </select>
            </div>

            {isStudent && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Verifikator / Pihak Pengonfirmasi *
                </label>
                <select
                  value={selectedVerifier}
                  onChange={(e) => setSelectedVerifier(e.target.value)}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#2c1ee8] outline-none"
                >
                  <option value="Pembina Ekskul / Guru (NIP)">Pembina Ekskul / Guru (NIP)</option>
                  <option value="Pengurus OSIS / Ekskul">Pengurus OSIS / Ekskul</option>
                  <option value="Admin (Waka Kesiswaan)">Admin (Waka Kesiswaan)</option>
                </select>
              </div>
            )}
          </div>

          {/* Image Upload with Crop */}
          <ImageCropUploader
            label="Gambar Sampul Mading"
            onCropped={handleCroppedImage}
          />
          {isUploading && (
            <p className="text-xs text-indigo-600 font-semibold animate-pulse">
              Mengunggah gambar...
            </p>
          )}
          {uploadSuccessMsg && !isUploading && (
            <p className="text-xs text-emerald-700 font-semibold">
              {uploadSuccessMsg}
            </p>
          )}

          <RichTextEditor
            label="Isi Konten Mading Lengkap"
            required
            value={content}
            onChange={(val) => setContent(val)}
            placeholder="Tuliskan berita atau pengumuman mading secara lengkap di sini..."
          />

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-blue-800 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {isSubmitting || isUploading ? (
                <>
                  <TwinOrbitSpinner size="xs" color="white" />
                  <span>{isUploading ? "Mengunggah Gambar..." : "Menerbitkan Mading..."}</span>
                </>
              ) : (
                <span>{isStudent ? "Kirim Mading (Verifikasi)" : "Terbitkan Mading"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
