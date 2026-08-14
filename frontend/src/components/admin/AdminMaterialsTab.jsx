"use client";

import { useState, useEffect, useCallback } from "react";
import { lessonMaterialService } from "@/services/lessonMaterialService";
import { FileText, Eye, Trash2, Search, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";

export default function AdminMaterialsTab() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const params = {};
        if (visibilityFilter) params.visibility = visibilityFilter;
        const res = await lessonMaterialService.getAll(params);
        setMaterials(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Gagal memuat materi pelajaran");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [visibilityFilter]);

  async function fetchMaterials() {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (visibilityFilter) params.visibility = visibilityFilter;
      const res = await lessonMaterialService.getAll(params);
      setMaterials(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat materi pelajaran");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus materi ini (Soft Delete)?")) return;
    try {
      await lessonMaterialService.delete(id);
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus materi");
    }
  }

  const filteredMaterials = materials.filter(
    (m) =>
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.className?.toLowerCase().includes(search.toLowerCase()) ||
      m.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      m.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Master Materi Pelajaran</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manajemen dokumen dan materi pembelajaran dari guru</p>
        </div>
        <button
          onClick={fetchMaterials}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200"
        >
          <RefreshCw className="w-4 h-4" /> Segarkan
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul, kelas, mapel, atau guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]"
          />
        </div>
        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]"
        >
          <option value="">Semua Visibilitas</option>
          <option value="Published">Published (Publik)</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat materi...</div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Tidak ada materi ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="p-4">Judul Materi</th>
                  <th className="p-4">Kelas & Mapel</th>
                  <th className="p-4">Guru</th>
                  <th className="p-4">Urutan</th>
                  <th className="p-4">Visibilitas</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2c1ee8]" />
                        {m.title}
                      </div>
                      {m.description && <div className="text-xs text-slate-400 line-clamp-1">{m.description}</div>}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 dark:text-white font-medium">{m.className}</div>
                      <div className="text-xs text-slate-400">{m.subjectName}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{m.teacherName}</td>
                    <td className="p-4 text-slate-500 font-mono text-xs">#{m.order}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          m.visibility === "Published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : m.visibility === "Draft"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {m.visibility}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {m.fileUrl && (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                        >
                          <ExternalLink className="w-3 h-3" /> Berkas
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 rounded hover:bg-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
