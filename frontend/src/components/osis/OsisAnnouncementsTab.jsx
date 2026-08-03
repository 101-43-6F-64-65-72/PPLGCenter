"use client";

import React, { useState } from "react";
import { Newspaper, Plus, Search, CheckCircle2, Clock, Trash2, Eye, Share2, Sparkles } from "lucide-react";

import announcementService from "@/services/announcementService";

export default function OsisAnnouncementsTab() {
  const [posts, setPosts] = useState([]);

  React.useEffect(() => {
    announcementService.getAnnouncements().then((res) => {
      if (res && Array.isArray(res.data)) setPosts(res.data);
    });
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Informasi Resmi OSIS");
  const [newContent, setNewContent] = useState("");

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPostItem = {
      id: `post-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      date: new Date().toISOString().split("T")[0],
      views: 1,
      status: "Terpublikasi",
      author: "Pengurus OSIS SMKN 2",
    };

    setPosts([newPostItem, ...posts]);
    setNewTitle("");
    setNewContent("");
    setIsModalOpen(false);
  };

  const handleDeletePost = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 leading-tight">
              Mading & Pengumuman OSIS
            </h3>
            <p className="text-xs text-gray-500">Publikasi informasi resmi siswa SMKN 2 Surakarta</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>

      {/* Posts Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#2c1ee8] bg-blue-50 px-2.5 py-1 rounded-lg">
                  {post.category}
                </span>
                <span className={`font-bold ${post.status === "Terpublikasi" ? "text-emerald-600" : "text-amber-600"}`}>
                  {post.status}
                </span>
              </div>

              <h4 className="text-base font-extrabold text-gray-900 leading-snug">
                {post.title}
              </h4>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                <span>{post.views} dilihat</span>
              </div>
              <button
                onClick={() => handleDeletePost(post.id)}
                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Hapus Mading"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">
                Buat Pengumuman OSIS Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-1">
                  Kategori Pengumuman
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-xs font-semibold focus:outline-none focus:border-[#2c1ee8]"
                >
                  <option value="Informasi Resmi OSIS">Informasi Resmi OSIS</option>
                  <option value="Program Kerja & Event">Program Kerja & Event</option>
                  <option value="Sarpras & Kegiatan">Sarpras & Kegiatan</option>
                  <option value="Prestasi & Ekstrakurikuler">Prestasi & Ekstrakurikuler</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-1">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  placeholder="Masukkan judul pengumuman OSIS..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#2c1ee8]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-1">
                  Isi Konten Pengumuman
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan pesan atau pengumuman lengkap untuk seluruh siswa..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#2c1ee8] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Publikasikan Mading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
