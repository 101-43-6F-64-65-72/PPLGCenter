"use client";

import React, { useState } from "react";
import {
  Newspaper,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Eye,
  ShieldCheck,
  Calendar,
  Send
} from "lucide-react";
import announcementService from "@/services/announcementService";

export default function AdminAnnouncementsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Informasi Sekolah",
    summary: "",
    content: "",
  });

  const [announcements, setAnnouncements] = useState([]);

  React.useEffect(() => {
    announcementService.getAnnouncements().then((res) => {
      if (res && Array.isArray(res.data)) setAnnouncements(res.data);
    });
  }, []);

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    const newAnnouncement = {
      id: `ann-${Date.now()}`,
      title: formData.title.trim(),
      category: formData.category,
      author: "Super Admin / Waka Kesiswaan",
      date: new Date().toISOString().split("T")[0],
      status: "Published",
    };

    announcementService.createAnnouncement(newAnnouncement).catch((err) => {
      console.warn("Async announcement creation warning:", err);
    });

    setAnnouncements([newAnnouncement, ...announcements]);
    setFormData({ title: "", category: "Informasi Sekolah", summary: "", content: "" });
    setIsCreateOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini dari mading digital?")) {
      setAnnouncements(announcements.filter((a) => a.id !== id));
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
          <span className="text-xs text-gray-500 font-medium">Publikasi Super Admin</span>
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
                </select>
              </div>

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
