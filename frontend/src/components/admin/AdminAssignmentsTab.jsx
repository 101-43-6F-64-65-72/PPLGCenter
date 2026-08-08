"use client";

import { useState, useEffect } from "react";
import { assignmentService } from "@/services/assignmentService";
import { CheckSquare, Calendar, Trash2, Search, RefreshCw, AlertCircle, Clock } from "lucide-react";

export default function AdminAssignmentsTab({ onSelectAssignmentForReview }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      setLoading(true);
      setError("");
      const res = await assignmentService.getAll();
      setAssignments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat tugas");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus tugas ini (Soft Delete)?")) return;
    try {
      await assignmentService.delete(id);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus tugas");
    }
  }

  const filteredAssignments = assignments.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.className?.toLowerCase().includes(search.toLowerCase()) ||
      a.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      a.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Master Tugas (Assignments)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitoring tugas, deadline, dan pengumpulan siswa</p>
        </div>
        <button
          onClick={fetchAssignments}
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

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Cari judul tugas, kelas, mapel, atau guru..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat daftar tugas...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Tidak ada tugas ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="p-4">Judul Tugas</th>
                  <th className="p-4">Kelas & Mapel</th>
                  <th className="p-4">Guru</th>
                  <th className="p-4">Tenggat Waktu (Due Date)</th>
                  <th className="p-4">Skor Maks</th>
                  <th className="p-4">Submisi / Dinilai</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredAssignments.map((a) => {
                  const isPastDue = new Date(a.dueDate) < new Date();
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-[#2c1ee8]" />
                          {a.title}
                        </div>
                        {a.description && <div className="text-xs text-slate-400 line-clamp-1">{a.description}</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-slate-800 dark:text-white font-medium">{a.className}</div>
                        <div className="text-xs text-slate-400">{a.subjectName}</div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{a.teacherName}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(a.dueDate).toLocaleString("id-ID")}
                        </div>
                        {isPastDue && <span className="text-[10px] text-rose-600 font-medium">Deadline Lewat</span>}
                      </td>
                      <td className="p-4 text-slate-700 font-mono text-xs">{a.maxScore}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {a.submissionCount} Terkumpul ({a.gradedCount} Dinilai)
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => onSelectAssignmentForReview && onSelectAssignmentForReview(a)}
                          className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                        >
                          Tinjau Submisi
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 rounded hover:bg-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" /> Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
