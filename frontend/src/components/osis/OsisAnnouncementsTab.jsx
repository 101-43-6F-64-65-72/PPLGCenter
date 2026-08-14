"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Newspaper, Plus, Eye, Trash2 } from "lucide-react";
import announcementService from "@/services/announcementService";
import CreateAnnouncementModal from "@/features/announcement/components/CreateAnnouncementModal";

export default function OsisAnnouncementsTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAnnouncements();
      let items = [];
      if (Array.isArray(res?.data?.items)) items = res.data.items;
      else if (Array.isArray(res?.data)) items = res.data;
      else if (Array.isArray(res?.items)) items = res.items;
      else if (Array.isArray(res)) items = res;
      setPosts(items);
    } catch (err) {
      console.error("Failed to load OSIS announcements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDeletePost = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus mading ini?")) return;
    try {
      await announcementService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert("Gagal menghapus mading.");
    }
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
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>

      {/* Posts Grid List */}
      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-gray-400">
          Memuat daftar mading...
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-3xl border border-gray-100 text-xs font-semibold text-gray-400">
          Belum ada mading yang dipublikasikan. Klik &quot;Buat Pengumuman Baru&quot; untuk memublikasikan mading pertama.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#2c1ee8] bg-blue-50 px-2.5 py-1 rounded-lg">
                    {post.category || "OSIS"}
                  </span>
                  <span className="font-bold text-emerald-600">
                    Terpublikasi
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-gray-900 leading-snug line-clamp-2">
                  {post.title}
                </h4>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{post.reactionCount || post.ReactionCount || 0} Reaksi</span>
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
      )}

      {/* Real Create Announcement Modal */}
      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAnnouncements}
      />
    </div>
  );
}
