"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Layers, Plus, Search, Edit2, Trash2, AlertCircle } from "lucide-react";
import schoolClassService from "@/services/schoolClassService";
import departmentService from "@/services/departmentService";
import academicYearService from "@/services/academicYearService";

export default function AdminClassesTab() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    grade: "X",
    departmentId: "",
    academicYearId: "",
    capacity: 36,
  });
  const [errorMsg, setErrorMsg] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, dRes, ayRes] = await Promise.all([
        schoolClassService.getAll(),
        departmentService.getAll(),
        academicYearService.getAll(),
      ]);

      const cList = Array.isArray(cRes) ? cRes : cRes?.items || cRes?.data?.items || cRes?.data || [];
      const dList = Array.isArray(dRes) ? dRes : dRes?.items || dRes?.data?.items || dRes?.data || [];
      const ayList = Array.isArray(ayRes) ? ayRes : ayRes?.items || ayRes?.data?.items || ayRes?.data || [];

      setClasses(cList);
      setDepartments(dList);
      setAcademicYears(ayList);
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = classes.filter(
    (cls) =>
      (cls.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.departmentCode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      grade: "X",
      departmentId: departments[0]?.id || "",
      academicYearId: academicYears.find((a) => a.isActive)?.id || academicYears[0]?.id || "",
      capacity: 36,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setEditingItem(cls);
    setFormData({
      name: cls.name || "",
      grade: cls.grade || "X",
      departmentId: cls.departmentId || "",
      academicYearId: cls.academicYearId || "",
      capacity: cls.capacity || 36,
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
        capacity: parseInt(formData.capacity, 10) || 36,
      };

      if (editingItem) {
        await schoolClassService.update(editingItem.id, payload);
      } else {
        await schoolClassService.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Gagal menyimpan data kelas.");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await schoolClassService.delete(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus kelas.");
    }
  };

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>Kelola Kelas (Classes)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">Daftar kelas akademik dan kapasitas daya tampung</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-amber-600 transition"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-gray-400">Memuat data kelas...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Nama Kelas</th>
                <th className="p-4">Tingkat</th>
                <th className="p-4">Jurusan</th>
                <th className="p-4">Kapasitas</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">
                    Tidak ada kelas ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((cls) => (
                  <tr key={cls.id || cls.name} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">{cls.name}</td>
                    <td className="p-4">Tingkat {cls.grade}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-bold border border-amber-100/50">
                        {cls.departmentCode || "—"}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{cls.capacity || 36} Siswa</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="text-gray-500 hover:text-amber-700 font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(cls.id);
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
              {editingItem ? "Edit Kelas" : "Tambah Kelas Baru"}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X RPL 1, XI TKJ 2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tingkat / Grade *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-amber-600"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Kapasitas Siswa</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Jurusan / Department *</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-amber-600"
                >
                  <option value="">-- Pilih Jurusan --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.code}] {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Tahun Akademik *</label>
                <select
                  required
                  value={formData.academicYearId}
                  onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-amber-600"
                >
                  <option value="">-- Pilih Tahun Akademik --</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} {ay.isActive ? "(Aktif)" : ""}
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition cursor-pointer shadow-xs"
                >
                  Simpan Kelas
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
            <h3 className="text-base font-black text-gray-900">Hapus Kelas</h3>
            <p className="text-xs text-gray-500 font-medium">
              Apakah Anda yakin ingin menghapus data kelas ini?
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
