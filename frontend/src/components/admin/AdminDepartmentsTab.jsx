"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Briefcase, Plus, Search, Edit2, Trash2, AlertCircle } from "lucide-react";
import departmentService from "@/services/departmentService";

export default function AdminDepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await departmentService.getAll();
      const list = Array.isArray(res) ? res : res?.items || res?.data?.items || res?.data || [];
      setDepartments(list);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = departments.filter(
    (dept) =>
      (dept.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ code: "", name: "" });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingItem(dept);
    setFormData({ code: dept.code || "", name: dept.name || "" });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (editingItem) {
        await departmentService.update(editingItem.id, formData);
      } else {
        await departmentService.create(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Gagal menyimpan data jurusan.");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteError("");
    try {
      await departmentService.delete(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || err?.message || "Gagal menghapus jurusan.");
    }
  };

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-violet-600" />
            <span>Kelola Jurusan (Departments)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">Daftar program keahlian / jurusan akademik terdaftar</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jurusan</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari kode atau nama jurusan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-violet-600 transition"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-gray-400">Memuat data jurusan...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Kode Jurusan</th>
                <th className="p-4">Nama Jurusan</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-400 font-medium">
                    Tidak ada jurusan ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((dept) => (
                  <tr key={dept.id || dept.code} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg font-bold border border-violet-100/50">
                        {dept.code}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{dept.name}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        className="text-gray-500 hover:text-violet-700 font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(dept.id);
                          setDeleteError("");
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-gray-400 hover:text-rose-600 font-bold cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-lg font-black text-gray-900">
              {editingItem ? "Edit Jurusan" : "Tambah Jurusan Baru"}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Kode Jurusan (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RPL, TKJ, DKV"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Jurusan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rekayasa Perangkat Lunak"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-violet-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition cursor-pointer shadow-xs"
                >
                  Simpan Jurusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Hapus Jurusan</h3>
            <p className="text-xs text-gray-500 font-medium">
              Apakah Anda yakin ingin menghapus data jurusan ini?
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
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
