"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers, Plus, Edit3, Trash2, CheckCircle, AlertCircle, RefreshCw, X, Star
} from "lucide-react";
import semesterService from "@/services/semesterService";
import academicYearService from "@/services/academicYearService";

export default function AdminSemestersTab() {
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAcademicYear, setFilterAcademicYear] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    academicYearId: "",
    name: "Ganjil",
    order: 1,
    isActive: false,
  });

  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await semesterService.getAll({ academicYearId: filterAcademicYear || undefined });
      const list = res?.data || res;
      if (Array.isArray(list)) setSemesters(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterAcademicYear]);

  useEffect(() => {
    academicYearService.getAll().then((res) => {
      const list = res?.data || res;
      if (Array.isArray(list)) setAcademicYears(list);
    }).catch(() => {});
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      academicYearId: academicYears[0]?.id || "",
      name: "Ganjil",
      order: 1,
      isActive: false,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      academicYearId: item.academicYearId || "",
      name: item.name || "Ganjil",
      order: item.order || 1,
      isActive: item.isActive || false,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await semesterService.update(editingItem.id, formData);
        if (res?.id || res?.data) {
          setFeedback({ type: "success", text: "Semester berhasil diperbarui." });
          setShowModal(false);
          loadData();
        } else {
          setFeedback({ type: "error", text: res?.message || "Gagal memperbarui Semester." });
        }
      } else {
        const res = await semesterService.create(formData);
        if (res?.id || res?.data) {
          setFeedback({ type: "success", text: "Semester baru berhasil ditambahkan." });
          setShowModal(false);
          loadData();
        } else {
          setFeedback({ type: "error", text: res?.message || "Gagal menambah Semester." });
        }
      }
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Terjadi kesalahan." });
    }
  };

  const handleSetActive = async (item) => {
    try {
      const res = await semesterService.setActive(item.id);
      if (res?.id || res?.data) {
        setFeedback({ type: "success", text: `Semester '${item.name}' diaktifkan.` });
        loadData();
      }
    } catch (err) {
      setFeedback({ type: "error", text: "Gagal mengaktifkan Semester." });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await semesterService.delete(deletingItem.id);
      if (res?.success || res?.status === 200) {
        setFeedback({ type: "success", text: `Semester '${deletingItem.name}' berhasil dihapus.` });
        setShowDeleteModal(false);
        setDeletingItem(null);
        loadData();
      } else {
        setFeedback({ type: "error", text: res?.message || "Gagal menghapus Semester." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: "Gagal menghapus Semester." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Master User Management</span>
          </div>
          <h2 className="text-xl font-black text-gray-900">Master Semester</h2>
          <p className="text-xs text-gray-500 mt-0.5">Kelola semester (Ganjil / Genap) per Tahun Akademik. Hanya 1 Semester yang berstatus Aktif.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Semester</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback.text && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
          feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback({ type: "", text: "" })} className="text-xs font-bold opacity-60">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
        <select
          value={filterAcademicYear}
          onChange={(e) => setFilterAcademicYear(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 outline-none"
        >
          <option value="">Semua Tahun Akademik</option>
          {academicYears.map((ay) => (
            <option key={ay.id} value={ay.id}>{ay.name} {ay.isActive ? "(Aktif)" : ""}</option>
          ))}
        </select>

        <button onClick={loadData} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"><RefreshCw className="w-3.5 h-3.5" /></button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tahun Akademik</th>
                <th className="py-3.5 px-4">Nama Semester</th>
                <th className="py-3.5 px-4">Urutan (Order)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded-md w-full" /></td>
                  </tr>
                ))
              ) : semesters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-semibold">Belum ada data Semester.</td>
                </tr>
              ) : (
                semesters.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{item.academicYearName || "—"}</td>
                    <td className="py-3.5 px-4 font-black text-cyan-700">{item.name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-600">{item.order}</td>
                    <td className="py-3.5 px-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 font-extrabold border border-cyan-200 text-[10px]">
                          <Star className="w-3 h-3 fill-cyan-500 text-cyan-600" />
                          Aktif (Semester Berjalan)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActive(item)}
                          className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-cyan-100 hover:text-cyan-800 font-bold text-[10px] transition"
                        >
                          Set Aktif
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeletingItem(item); setShowDeleteModal(true); }}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition"
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
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">
                {editingItem ? "Edit Semester" : "Tambah Semester Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 mb-1">Tahun Akademik *</label>
                <select
                  required
                  value={formData.academicYearId}
                  onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-cyan-600 outline-none"
                >
                  <option value="">Pilih Tahun Akademik</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Nama Semester *</label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-cyan-600 outline-none"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Urutan (Order)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-cyan-600 outline-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Set sebagai Semester Aktif</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-md"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Hapus Semester?</h3>
            <p className="text-xs text-gray-500">
              Apakah Anda yakin ingin menghapus Semester <strong className="text-gray-900">{deletingItem.name}</strong>?
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
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
