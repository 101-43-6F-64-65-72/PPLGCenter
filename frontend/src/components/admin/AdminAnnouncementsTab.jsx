"use client";

import React, { useState } from "react";
import {
  Newspaper,
  Plus,
  Search,
  Trash2,
  Send
} from "lucide-react";
import announcementService from "@/services/announcementService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import ImageCropUploader from "@/components/common/ImageCropUploader";

export default function AdminAnnouncementsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Informasi Sekolah",
    summary: "",
    content: "",
  });

  const [announcements, setAnnouncements] = useState([]);

  const handleCroppedImage = async (dataUrl, metadata) => {
    // Store data URL for preview only — don't save to state yet
    setIsUploading(true);
    setCoverImageUrl(""); // reset while uploading
    try {
      const file = metadata?.croppedFile || (await fetch(dataUrl).then((r) => r.blob()).then((blob) => new File([blob], "mading-cover.jpg", { type: "image/jpeg" })));
      const uploadedUrl = await uploadImageToCloudinary(file);
      // Only store if we got a valid HTTPS URL back
      if (uploadedUrl && uploadedUrl.startsWith("https://")) {
        setCoverImageUrl(uploadedUrl);
      } else {
        // Cloudinary preset not configured — keep empty, backend won't reject
        setCoverImageUrl("");
      }
    } catch {
      setCoverImageUrl("");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchAnnouncements = () => {
    announcementService
      .getAnnouncements()
      .then((res) => {
        let list = [];
        if (Array.isArray(res?.data?.items)) list = res.data.items;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.items)) list = res.items;
        else if (Array.isArray(res)) list = res;
        setAnnouncements(
          list.map((item) => ({
            ...item,
            author: item.createdByUserName || item.author || "Admin Sekolah",
            date: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : item.date || "Hari ini",
            status: item.isPinned ? "Dipin di Teratas" : "Dipublikasikan",
          }))
        );
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    fetchAnnouncements();
  }, []);

  const filtered = announcements.filter(
    (a) =>
      (a.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    // Only send coverImageUrl if it's a real HTTPS URL (Cloudinary CDN)
    // Sending a Data URL or empty string with [Url] validator causes 400
    const validCoverUrl =
      coverImageUrl && coverImageUrl.startsWith("https://")
        ? coverImageUrl
        : undefined;

    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: formData.category || "Informasi Sekolah",
      isPinned: false,
      ...(validCoverUrl ? { coverImageUrl: validCoverUrl } : {}),
    };

    try {
      await announcementService.createAnnouncement(payload);
      fetchAnnouncements();
    } catch (err) {
      console.warn("Async announcement creation warning:", err);
    } finally {
      setFormData({ title: "", category: "Informasi Sekolah", summary: "", content: "" });
      setCoverImageUrl("");
      setIsCreateOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini dari mading digital?")) return;
    try {
      await announcementService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Gagal menghapus mading:", err);
      alert(err?.response?.data?.message || err?.message || "Gagal menghapus pengumuman.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Add Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pengumuman mading..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
          />
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2c1ee8] text-white font-bold text-xs hover:bg-[#2218a3] transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman Mading</span>
        </button>
      </div>

      {/* Announcements Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#2c1ee8]" />
            <span>Manajemen Mading Digital ({filtered.length})</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">Publikasi Admin</span>
        </div>

        <div className="divide-y divide-gray-100">
          {filtered.map((item) => (
            <div key={item.id} className="p-5 hover:bg-gray-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#2c1ee8] border border-blue-100">
                    {item.category}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {item.status}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-gray-900">{item.title}</h4>
                <span className="text-xs text-gray-400">Oleh: {item.author} • {item.date}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Hapus Mading"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#2c1ee8]" />
                <span>Buat Pengumuman Mading Baru</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Judul Pengumuman:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Info Pelaksanaan Classmeeting 2026..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#2c1ee8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Kategori Pengumuman:
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#2c1ee8]"
                >
                  <option value="Informasi Sekolah">Informasi Sekolah</option>
                  <option value="Prestasi & Lomba">Prestasi & Lomba</option>
                  <option value="Akademik">Akademik</option>
                  <option value="Seni & Budaya">Seni & Budaya</option>
                  <option value="Olahraga">Olahraga</option>
                  <option value="Artikel">Artikel</option>
                  <option value="Hiburan">Hiburan</option>
                </select>
              </div>

              {/* Image Upload with Crop */}
              <ImageCropUploader
                label="Gambar Sampul Mading"
                onCropped={handleCroppedImage}
              />
              {isUploading && (
                <p className="text-xs text-indigo-600 font-semibold animate-pulse">Mengunggah gambar...</p>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Isi Pengumuman Lengkap:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan pengumuman lengkap untuk seluruh siswa..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#2c1ee8]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Terbitkan Mading</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
