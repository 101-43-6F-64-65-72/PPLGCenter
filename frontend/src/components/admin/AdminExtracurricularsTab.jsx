"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Plus, Search, Edit2, Trash2, ImageIcon } from "lucide-react";
import extracurricularService from "@/services/extracurricularService";
import apiClient from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import CreateExtracurricularModal from "@/components/ekstrakurikuler/CreateExtracurricularModal";

export default function AdminExtracurricularsTab() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resClubs = await extracurricularService.getAll();
      const list = Array.isArray(resClubs)
        ? resClubs
        : resClubs?.items || resClubs?.data?.items || resClubs?.data || [];
      setClubs(list);
    } catch (err) {
      console.error("Failed to load extracurriculars:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = clubs.filter(
    (club) =>
      (club.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.supervisor?.name || club.advisorName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (club) => {
    setEditingItem(club);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await extracurricularService.deleteExtracurricular(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus ekstrakurikuler.");
    }
  };

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-pink-600" />
            <span>Kelola Ekstrakurikuler</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">Daftar unit kegiatan siswa (UKS) terdaftar di sistem</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ekstrakurikuler</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari ekstrakurikuler atau pembina..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-pink-600 transition"
        />
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="p-8 text-center text-xs text-gray-400">Memuat data ekstrakurikuler...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Cover & Nama Ekstrakurikuler</th>
                <th className="p-4">Guru Pembina</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Jadwal & Lokasi</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 font-medium">
                    Tidak ada ekstrakurikuler terdaftar.
                  </td>
                </tr>
              ) : (
                filtered.map((club) => {
                  const supervisorName = club.supervisor?.name || club.advisorName;
                  const coverUrl = club.imageUrl || club.ImageUrl;

                  return (
                    <tr key={club.id || club.name} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail Cover */}
                          <div className="w-14 h-10 rounded-xl border border-gray-200 bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center relative shadow-2xs">
                            {coverUrl ? (
                              <img
                                src={resolveImageUrl(coverUrl)}
                                alt={club.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-gray-400">
                                <ImageIcon className="w-4 h-4 opacity-50" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="font-bold text-gray-900">{club.name}</div>
                            <div className="text-[10px] text-gray-400 line-clamp-1">{club.description?.substring(0, 50)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {supervisorName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-[10px]">
                              {supervisorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{supervisorName}</div>
                              {club.supervisor?.nip && (
                                <div className="text-[10px] text-gray-400">NIP: {club.supervisor.nip}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Belum ditentukan</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg font-bold border border-pink-100/50">
                          {club.category}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div>{club.scheduleDay || "Senin"} ({club.scheduleTime || "15:00 - 17:00"})</div>
                        <div className="text-[10px] text-gray-400">{club.location || "Lapangan Sekolah"}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          club.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {club.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(club)}
                          className="text-gray-500 hover:text-pink-700 font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(club.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-rose-600 font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Extracurricular Modal with Image Crop & Cloudinary upload */}
      <CreateExtracurricularModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        editingItem={editingItem}
      />

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Hapus Ekstrakurikuler</h3>
            <p className="text-xs text-gray-500 font-medium">
              Apakah Anda yakin ingin menghapus unit ekstrakurikuler ini?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
