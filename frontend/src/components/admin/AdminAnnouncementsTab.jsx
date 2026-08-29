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
import TwinOrbitSpinner from "@/components/ui/TwinOrbitSpinner";
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function AdminAnnouncementsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Informasi Sekolah",
    summary: "",
    content: "",
  });

  const [announcements, setAnnouncements] = useState([]);

  const handleCroppedImage = async (dataUrl, metadata) => {
    setIsUploading(true);
    try {
      const file = metadata?.croppedFile || (await fetch(dataUrl).then((r) => r.blob()).then((blob) => new File([blob], "mading-cover.jpg", { type: "image/jpeg" })));
      const uploadedUrl = await uploadImageToCloudinary(file);
      if (uploadedUrl) {
        setCoverImageUrl(uploadedUrl);
      } else {
        setCoverImageUrl(dataUrl);
      }
    } catch {
      setCoverImageUrl(dataUrl);
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
    if (isSubmitting || isUploading) return;
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);

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
      setIsSubmitting(false);
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
    <div className="space-y-5 font-sans text-left">
      {/* ─── Top Toolbar: Direct & To The Point ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-none p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2C1EE8] text-xs font-semibold text-slate-900 outline-none transition-colors"
          />
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengumuman</span>
        </button>
      </div>

      {/* ─── Announcements List Table ─── */}
      <div className="bg-white border border-slate-200 rounded-none shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#2C1EE8]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daftar Pengumuman ({filtered.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              Tidak ada pengumuman yang ditemukan.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-none text-[10px] font-bold font-mono bg-blue-50 text-[#2C1EE8] border border-blue-200 uppercase">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none">
                      {item.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {item.author} · {item.date}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-none text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Create Modal: Direct & Clean ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-none border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#2C1EE8]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tambah Pengumuman
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Judul
                </label>
                <input
                  type="text"
                  required
                  placeholder="Judul pengumuman..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2C1EE8]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2C1EE8]"
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
                label="Sampul Gambar"
                onCropped={handleCroppedImage}
              />
              {isUploading && (
                <p className="text-xs text-blue-600 font-semibold animate-pulse">Mengunggah gambar...</p>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Isi Pengumuman
                </label>
                <RichTextEditor
                  required
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder="Tuliskan isi pengumuman..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2 rounded-none text-xs font-bold uppercase tracking-wider bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting || isUploading ? (
                    <>
                      <TwinOrbitSpinner size="xs" color="white" />
                      <span>{isUploading ? "Mengunggah..." : "Menyimpan..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Terbitkan</span>
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
