"use client";

import React, { useState, useEffect } from "react";
import { gradebookService } from "@/services/gradebookService";

export default function AdminGradeCategoryTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    weight: 20,
    type: 5, // Assignment
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setLoading(true);
      try {
        const res = await gradebookService.getGradeCategories();
        if (isMounted && res?.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch grade categories", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await gradebookService.getGradeCategories();
      if (res?.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch grade categories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", weight: 20, type: 5, isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      weight: cat.weight,
      type: cat.type,
      isActive: cat.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        weight: parseFloat(formData.weight),
        type: parseInt(formData.type),
        isActive: formData.isActive,
      };

      if (editingId) {
        await gradebookService.updateGradeCategory(editingId, payload);
      } else {
        await gradebookService.createGradeCategory(payload);
      }

      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan kategori penilaian.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori penilaian ini?")) return;
    try {
      await gradebookService.deleteGradeCategory(id);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus kategori.");
    }
  };

  const totalWeight = categories.reduce((sum, c) => sum + (c.isActive ? Number(c.weight) : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            🏷️ Kategori Penilaian & Bobot
          </h3>
          <p className="text-xs text-slate-400">
            Kelola bobot persentase kategori penilaian (Tugas, UTS, UAS, Kuis, dll).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
            totalWeight === 100 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
          }`}>
            Total Bobot: {totalWeight}% {totalWeight !== 100 && "(Disarankan 100%)"}
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <span>+</span> Tambah Kategori
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Memuat kategori penilaian...</div>
      ) : categories.length === 0 ? (
        <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-700 text-slate-400">
          Belum ada kategori penilaian. Klik Tambah Kategori.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`p-4 rounded-xl border transition-all ${
                cat.isActive
                  ? "bg-slate-800 border-slate-700 hover:border-indigo-500/50"
                  : "bg-slate-800/40 border-slate-700/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{cat.name}</h4>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {cat.typeName}
                  </span>
                </div>
                <span className="text-lg font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  {cat.weight}%
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4 h-8">
                {cat.description || "Tidak ada deskripsi"}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 text-xs">
                <span className={cat.isActive ? "text-emerald-400" : "text-slate-500"}>
                  {cat.isActive ? "● Aktif" : "○ Nonaktif"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-2.5 py-1 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              {editingId ? "Edit Kategori Penilaian" : "Tambah Kategori Penilaian"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Tugas Harian, UTS, UAS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bobot (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipe Penilaian</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0}>Knowledge</option>
                    <option value={1}>Skill</option>
                    <option value={2}>Attitude</option>
                    <option value={3}>Project</option>
                    <option value={4}>Exam</option>
                    <option value={5}>Assignment</option>
                    <option value={6}>Quiz</option>
                    <option value={7}>Practice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Deskripsi</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan singkat..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {editingId && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="isActive" className="text-slate-300">Status Aktif</label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
