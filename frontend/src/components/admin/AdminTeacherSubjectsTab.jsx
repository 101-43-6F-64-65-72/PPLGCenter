"use client";

import React, { useState, useEffect, useCallback } from "react";
import { teacherSubjectService } from "@/services/teacherSubjectService";
import { userService } from "@/services/userService";
import { subjectService } from "@/services/subjectService";
import { Search, Plus, Trash2, UserCheck, AlertCircle } from "lucide-react";

export default function AdminTeacherSubjectsTab() {
  const [list, setList] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ teacherId: "", subjectId: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tsRes, tRes, sRes] = await Promise.all([
        teacherSubjectService.getAll(),
        userService.getAllUsers({ role: "Teacher" }),
        subjectService.getAll({ isActive: true }),
      ]);
      const extractArray = (res) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.items)) return res.items;
        if (Array.isArray(res?.data?.items)) return res.data.items;
        return [];
      };
      setList(extractArray(tsRes));
      setTeachers(extractArray(tRes));
      setSubjects(extractArray(sRes));
    } catch (err) {
      console.error("Failed to load teacher subjects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = list.filter((item) => {
    const matchesSearch =
      item.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = !selectedSubjectId || item.subjectId === selectedSubjectId;

    return matchesSearch && matchesSubject;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenAdd = () => {
    setFormData({ teacherId: teachers[0]?.id || "", subjectId: subjects[0]?.id || "" });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await teacherSubjectService.create(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Gagal membuat penugasan guru.");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await teacherSubjectService.delete(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus penugasan guru.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Penugasan Guru ke Mata Pelajaran (TeacherSubjects)
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Petakan guru yang berhak mengajar mata pelajaran tertentu (Unique: Teacher + Subject).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-emerald-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tugaskan Guru Mapel</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nama Guru atau Mata Pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-emerald-600"
          />
        </div>

        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="w-full md:w-64 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-700 outline-none focus:border-emerald-600"
        >
          <option value="">Semua Mata Pelajaran</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              [{s.code}] {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">No</th>
                <th className="py-4 px-6">Nama Guru</th>
                <th className="py-4 px-6">NIP</th>
                <th className="py-4 px-6">Kode Mapel</th>
                <th className="py-4 px-6">Mata Pelajaran</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Memuat penugasan guru...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Tidak ada penugasan guru ditemukan.
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 text-gray-400 font-bold">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="py-4 px-6 font-bold text-gray-900">{item.teacherName}</td>
                    <td className="py-4 px-6 text-gray-500 font-mono">{item.teacherNip || "-"}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-100">
                        {item.subjectCode}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold">{item.subjectName}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setDeletingId(item.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 transition cursor-pointer"
                        title="Hapus Penugasan"
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
            Menampilkan {paginated.length} dari {filtered.length} Penugasan Guru
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Tugaskan Guru ke Mapel</h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Pilih Guru Pengajar</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-emerald-600"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} {t.nip ? `(NIP: ${t.nip})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Pilih Mata Pelajaran</label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-emerald-600"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  Simpan Penugasan
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
            <h3 className="text-base font-black text-gray-900">Hapus Penugasan Guru</h3>
            <p className="text-xs text-gray-500 font-medium">
              Apakah Anda yakin ingin menghapus pemetaan guru ini dari mata pelajaran?
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
