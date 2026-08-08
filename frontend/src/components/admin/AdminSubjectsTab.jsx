"use client";

import React, { useState, useEffect, useCallback } from "react";
import { subjectService } from "@/services/subjectService";
import { Search, Plus, Edit2, Trash2, BookOpen, AlertCircle } from "lucide-react";

export default function AdminSubjectsTab() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "", isActive: true });
  const [errorMsg, setErrorMsg] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subjectService.getAll();
      const items = Array.isArray(res) ? res : res?.items || res?.data?.items || res?.data || [];
      setSubjects(items);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ code: "", name: "", description: "", isActive: true });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ code: item.code, name: item.name, description: item.description || "", isActive: item.isActive });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (editingItem) {
        await subjectService.update(editingItem.id, formData);
      } else {
        await subjectService.create(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Gagal menyimpan mata pelajaran.");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await subjectService.delete(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus mata pelajaran.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2c1ee8]" />
            Master Mata Pelajaran (Subjects)
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Kelola kurikulum mata pelajaran standar sekolah.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-[#2c1ee8] text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Kode atau Nama Mata Pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#2c1ee8]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">No</th>
                <th className="py-4 px-6">Kode Mapel</th>
                <th className="py-4 px-6">Nama Mata Pelajaran</th>
                <th className="py-4 px-6">Deskripsi</th>
                <th className="py-4 px-6">Total Guru</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Memuat data mata pelajaran...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Tidak ada mata pelajaran ditemukan.
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 text-gray-400 font-bold">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2c1ee8] font-black text-xs border border-blue-100">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">{item.name}</td>
                    <td className="py-4 px-6 text-gray-500 max-w-xs truncate">{item.description || "-"}</td>
                    <td className="py-4 px-6 font-bold">{item.teacherCount} Guru</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {item.isActive ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-[#2c1ee8] text-gray-600 transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(item.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Menampilkan {paginated.length} dari {filtered.length} Mata Pelajaran
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 font-bold text-gray-800">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">
              {editingItem ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Kode Mapel (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MTK, PBO"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemrograman Berbasis Objek"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Penjelasan ringkas materi mapel..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#2c1ee8]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#2c1ee8] rounded"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Mata Pelajaran Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Konfirmasi Hapus</h3>
            <p className="text-xs text-gray-500 font-medium">
              Apakah Anda yakin ingin menghapus mata pelajaran ini? Tindakan ini tidak dapat dibatalkan.
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
