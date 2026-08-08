"use client";

import React, { useState, useEffect } from "react";
import { gradebookService } from "@/services/gradebookService";

export default function AdminGradeScaleTab() {
  const [scales, setScales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    minimum: 80,
    maximum: 89.99,
    letter: "B",
    predicate: "Baik",
    description: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadScales = async () => {
      setLoading(true);
      try {
        const res = await gradebookService.getGradeScales();
        if (isMounted && res?.data) {
          setScales(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch grade scales", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadScales();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchScales = async () => {
    setLoading(true);
    try {
      const res = await gradebookService.getGradeScales();
      if (res?.data) {
        setScales(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch grade scales", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ minimum: 80, maximum: 89.99, letter: "B", predicate: "Baik", description: "", isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (scale) => {
    setEditingId(scale.id);
    setFormData({
      minimum: scale.minimum,
      maximum: scale.maximum,
      letter: scale.letter,
      predicate: scale.predicate,
      description: scale.description || "",
      isActive: scale.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        minimum: parseFloat(formData.minimum),
        maximum: parseFloat(formData.maximum),
        letter: formData.letter,
        predicate: formData.predicate,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (editingId) {
        await gradebookService.updateGradeScale(editingId, payload);
      } else {
        await gradebookService.createGradeScale(payload);
      }

      setShowModal(false);
      fetchScales();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan rentang nilai.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            📊 Skala & Predikat Nilai (Grade Scale)
          </h3>
          <p className="text-xs text-slate-400">
            Atur rentang skor minimum-maksimum untuk penetapan Nilai Huruf (A, B, C, D, E) dan Predikat.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20 self-start md:self-auto"
        >
          <span>+</span> Tambah Skala
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Memuat skala nilai...</div>
      ) : scales.length === 0 ? (
        <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-700 text-slate-400">
          Belum ada skala nilai.
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-700">
                <tr>
                  <th className="p-3">Huruf</th>
                  <th className="p-3">Rentang Skor</th>
                  <th className="p-3">Predikat</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {scales.map((scale) => (
                  <tr key={scale.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3">
                      <span className="text-base font-extrabold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded border border-indigo-500/20">
                        {scale.letter}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-200">
                      {scale.minimum} - {scale.maximum}
                    </td>
                    <td className="p-3 font-semibold text-slate-100">{scale.predicate}</td>
                    <td className="p-3 text-slate-400">{scale.description || "-"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        scale.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"
                      }`}>
                        {scale.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(scale)}
                        className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              {editingId ? "Edit Skala Nilai" : "Tambah Skala Nilai"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Huruf (Grade)</label>
                  <input
                    type="text"
                    required
                    maxLength="5"
                    value={formData.letter}
                    onChange={(e) => setFormData({ ...formData, letter: e.target.value })}
                    placeholder="Contoh: A, B+, C"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Predikat</label>
                  <input
                    type="text"
                    required
                    value={formData.predicate}
                    onChange={(e) => setFormData({ ...formData, predicate: e.target.value })}
                    placeholder="Contoh: Sangat Baik"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Minimum Skor</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={formData.minimum}
                    onChange={(e) => setFormData({ ...formData, minimum: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Maksimum Skor</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={formData.maximum}
                    onChange={(e) => setFormData({ ...formData, maximum: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Keterangan</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Catatan predikat..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveScale"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="isActiveScale" className="text-slate-300">Status Aktif</label>
              </div>

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
