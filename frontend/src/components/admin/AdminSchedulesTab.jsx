"use client";

import React, { useState, useEffect, useCallback } from "react";
import { scheduleService } from "@/services/scheduleService";
import { classSubjectService } from "@/services/classSubjectService";
import { semesterService } from "@/services/semesterService";
import { Search, Plus, Edit2, Trash2, Calendar, Clock, AlertCircle } from "lucide-react";

export default function AdminSchedulesTab() {
  const [schedules, setSchedules] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    classSubjectId: "",
    semesterId: "",
    dayOfWeek: 1,
    startTime: "07:00",
    endTime: "08:30",
    room: "R.101",
    color: "#2c1ee8",
    isActive: true,
  });
  const [errorMsg, setErrorMsg] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, csRes, semRes] = await Promise.all([
        scheduleService.getAll(),
        classSubjectService.getAll(),
        semesterService.getAll(),
      ]);

      // scheduleService returns full ApiResponse → data is in .data or .data.items
      const schData = schRes?.data ?? schRes;
      const schList = Array.isArray(schData) ? schData : Array.isArray(schData?.items) ? schData.items : [];
      setSchedules(schList);

      // classSubjectService returns response.data (already the ApiResponse payload = items array or PagedResult)
      // because its interceptor returns response.data directly
      const csData = csRes ?? {};
      const csList = Array.isArray(csData) ? csData : Array.isArray(csData?.items) ? csData.items : Array.isArray(csData?.data) ? csData.data : [];
      setClassSubjects(csList);

      // semesterService returns res?.data || res (ApiResponse or payload directly)
      const semData = semRes?.data ?? semRes;
      const semList = Array.isArray(semData) ? semData : Array.isArray(semData?.items) ? semData.items : [];
      setSemesters(semList);
      const activeSem = semList.find((s) => s.isActive);
      if (activeSem) setSelectedSemesterId((prev) => prev || activeSem.id);
    } catch (err) {
      console.error("Failed to load schedule data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = schedules.filter((item) => {
    const matchesSearch =
      item.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSemester = !selectedSemesterId || item.semesterId === selectedSemesterId;
    const matchesDay = !selectedDay || item.dayOfWeek.toString() === selectedDay;

    return matchesSearch && matchesSemester && matchesDay;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenAdd = () => {
    setEditingItem(null);
    const activeSem = semesters.find((s) => s.isActive);
    setFormData({
      classSubjectId: classSubjects[0]?.id || "",
      semesterId: activeSem?.id || semesters[0]?.id || "",
      dayOfWeek: 1,
      startTime: "07:00",
      endTime: "08:30",
      room: "R.101",
      color: "#2c1ee8",
      isActive: true,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      classSubjectId: item.classSubjectId,
      semesterId: item.semesterId,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room,
      color: item.color || "#2c1ee8",
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
        dayOfWeek: parseInt(formData.dayOfWeek, 10),
      };
      if (editingItem) {
        await scheduleService.update(editingItem.id, payload);
      } else {
        await scheduleService.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Gagal menyimpan jadwal pelajaran.");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await scheduleService.delete(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus jadwal.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2c1ee8]" />
            Jadwal Pelajaran (Schedules)
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Manajemen jam pelajaran dengan deteksi bentrok otomatis Guru, Ruangan, dan Kelas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-[#2c1ee8] text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal Pelajaran</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Kelas, Mapel, Guru, atau Ruangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#2c1ee8]"
          />
        </div>

        <select
          value={selectedSemesterId}
          onChange={(e) => setSelectedSemesterId(e.target.value)}
          className="w-full md:w-56 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-700 outline-none focus:border-[#2c1ee8]"
        >
          <option value="">Semua Semester</option>
          {semesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.academicYearName} — {sem.name} {sem.isActive ? "(Aktif)" : ""}
            </option>
          ))}
        </select>

        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="w-full md:w-40 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-700 outline-none focus:border-[#2c1ee8]"
        >
          <option value="">Semua Hari</option>
          <option value="1">Senin</option>
          <option value="2">Selasa</option>
          <option value="3">Rabu</option>
          <option value="4">Kamis</option>
          <option value="5">Jumat</option>
          <option value="6">Sabtu</option>
          <option value="7">Minggu</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Hari</th>
                <th className="py-4 px-6">Jam</th>
                <th className="py-4 px-6">Kelas</th>
                <th className="py-4 px-6">Mata Pelajaran</th>
                <th className="py-4 px-6">Guru Pengajar</th>
                <th className="py-4 px-6">Ruangan</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Memuat jadwal pelajaran...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Tidak ada jadwal pelajaran ditemukan.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 font-black text-gray-900">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#2c1ee8] border border-blue-100">
                        {item.dayName}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">{item.className}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-800">{item.subjectName}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">[{item.subjectCode}]</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-800">{item.teacherName}</td>
                    <td className="py-4 px-6 font-bold text-emerald-700">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                        {item.room}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-[#2c1ee8] text-gray-600 transition cursor-pointer"
                        title="Edit Jadwal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(item.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 transition cursor-pointer"
                        title="Hapus Jadwal"
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
            Menampilkan {paginated.length} dari {filtered.length} Jadwal
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
              {editingItem ? "Edit Jadwal Pelajaran" : "Tambah Jadwal Pelajaran"}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-start gap-2.5 shadow-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="block font-black uppercase text-[10px] tracking-wider text-rose-800">Deteksi Bentrok / Validasi:</span>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Mata Pelajaran & Kelas (ClassSubject)</label>
                <select
                  required
                  value={formData.classSubjectId}
                  onChange={(e) => setFormData({ ...formData, classSubjectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8]"
                >
                  <option value="">-- Pilih ClassSubject --</option>
                  {classSubjects.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      [{cs.className}] {cs.subjectName} — Guru: {cs.teacherName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Semester</label>
                  <select
                    required
                    value={formData.semesterId}
                    onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8]"
                  >
                    <option value="">-- Pilih Semester --</option>
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.name} ({sem.academicYearName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hari</label>
                  <select
                    required
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8]"
                  >
                    <option value={1}>Senin</option>
                    <option value={2}>Selasa</option>
                    <option value={3}>Rabu</option>
                    <option value={4}>Kamis</option>
                    <option value={5}>Jumat</option>
                    <option value={6}>Sabtu</option>
                    <option value={7}>Minggu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Jam Mulai (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Jam Selesai (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Ruangan Kelas / Lab</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: R.101, Lab Komputer 1"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="schedIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#2c1ee8] rounded"
                />
                <label htmlFor="schedIsActive" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Jadwal Aktif
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
                  Simpan Jadwal
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
            <h3 className="text-base font-black text-gray-900">Hapus Jadwal Pelajaran</h3>
            <p className="text-xs text-gray-500 font-medium">
              Apakah Anda yakin ingin menghapus jadwal pelajaran ini?
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
