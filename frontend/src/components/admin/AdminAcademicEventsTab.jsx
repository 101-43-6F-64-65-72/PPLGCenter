"use client";

import React, { useState, useEffect, useCallback } from "react";
import { academicEventService } from "@/services/academicEventService";
import { schoolClassService } from "@/services/schoolClassService";
import { Search, Plus, Edit2, Trash2, Calendar, AlertCircle } from "lucide-react";

export default function AdminAcademicEventsTab() {
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargetType, setSelectedTargetType] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "School",
    targetType: "All",
    targetClassId: "",
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    isActive: true,
  });
  const [errorMsg, setErrorMsg] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, cRes] = await Promise.all([
        academicEventService.getAll(),
        schoolClassService.getAll(),
      ]);
      if (evRes?.data) setEvents(evRes.data);
      if (cRes?.data) setClasses(cRes.data);
    } catch (err) {
      console.error("Failed to load academic events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = events.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTarget = !selectedTargetType || item.targetType.toLowerCase() === selectedTargetType.toLowerCase();

    return matchesSearch && matchesTarget;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenAdd = () => {
    setEditingItem(null);
    const todayStr = new Date().toISOString().substring(0, 10);
    setFormData({
      title: "",
      description: "",
      type: "School",
      targetType: "All",
      targetClassId: "",
      startDate: todayStr,
      endDate: todayStr,
      isActive: true,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      type: item.type,
      targetType: item.targetType,
      targetClassId: item.targetClassId || "",
      startDate: item.startDate ? item.startDate.substring(0, 10) : "",
      endDate: item.endDate ? item.endDate.substring(0, 10) : "",
      isActive: item.isActive,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const payload = {
        ...formData,
        targetClassId: formData.targetType === "Class" && formData.targetClassId ? formData.targetClassId : null,
      };
      if (editingItem) {
        await academicEventService.update(editingItem.id, payload);
      } else {
        await academicEventService.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Gagal menyimpan event akademik.");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await academicEventService.delete(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus event akademik.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Kalender Akademik & Agenda Sekolah (AcademicEvents)
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Kelola event sekolah (Libur Nasional, UTS/UAS, Class Meeting, MPLS, Ujian, dll).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Event Akademik</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Judul atau Deskripsi Agenda Akademik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-indigo-600"
          />
        </div>

        <select
          value={selectedTargetType}
          onChange={(e) => setSelectedTargetType(e.target.value)}
          className="w-full md:w-56 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-700 outline-none focus:border-indigo-600"
        >
          <option value="">Semua Target (Audience)</option>
          <option value="All">Semua (Global)</option>
          <option value="Teacher">Khusus Guru</option>
          <option value="Student">Khusus Siswa</option>
          <option value="Class">Kelas Spesifik</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">No</th>
                <th className="py-4 px-6">Judul Agenda</th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6">Target Audience</th>
                <th className="py-4 px-6">Tanggal Mulai - Selesai</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Memuat agenda akademik...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Tidak ada agenda akademik ditemukan.
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 text-gray-400 font-bold">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-900 block">{item.title}</span>
                      {item.description && <span className="text-[11px] text-gray-400 block truncate max-w-xs">{item.description}</span>}
                    </td>
                    <td className="py-4 px-6 font-bold text-indigo-700">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-800">
                      {item.targetType === "Class" ? `Kelas: ${item.targetClassName || "-"}` : item.targetType}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-700">
                      {new Date(item.startDate).toLocaleDateString("id-ID")} - {new Date(item.endDate).toLocaleDateString("id-ID")}
                    </td>
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
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(item.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 transition cursor-pointer"
                        title="Hapus Event"
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
            Menampilkan {paginated.length} dari {filtered.length} Event
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
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">
              {editingItem ? "Edit Event Akademik" : "Tambah Event Akademik"}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Judul Agenda</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ujian Akhir Semester (UAS), Libur Nasional"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Deskripsi Event</label>
                <textarea
                  rows={2}
                  placeholder="Catatan / instruksi tambahan event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Kategori Event (Type)</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-600"
                  >
                    <option value="Holiday">Libur / Holiday</option>
                    <option value="Exam">Ujian / Exam</option>
                    <option value="Meeting">Rapat / Meeting</option>
                    <option value="Competition">Lomba / Competition</option>
                    <option value="School">Kegiatan Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Target Audience</label>
                  <select
                    required
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-600"
                  >
                    <option value="All">Semua (Global)</option>
                    <option value="Teacher">Khusus Guru</option>
                    <option value="Student">Khusus Siswa</option>
                    <option value="Class">Kelas Spesifik</option>
                  </select>
                </div>
              </div>

              {formData.targetType === "Class" && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Pilih Kelas Target (Wajib)</label>
                  <select
                    required
                    value={formData.targetClassId}
                    onChange={(e) => setFormData({ ...formData, targetClassId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Pilih Kelas Target --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.departmentCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="evIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <label htmlFor="evIsActive" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Event Aktif
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-xs"
                >
                  Simpan Event
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
            <h3 className="text-base font-black text-gray-900">Hapus Event Akademik</h3>
            <p className="text-xs text-gray-500 font-medium">
              Apakah Anda yakin ingin menghapus agenda akademik ini?
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
