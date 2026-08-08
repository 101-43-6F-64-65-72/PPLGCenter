"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Plus, Search, Edit2, Trash2, AlertCircle, UserCheck } from "lucide-react";
import extracurricularService from "@/services/extracurricularService";
import apiClient from "@/lib/api";

export default function AdminExtracurricularsTab() {
  const [clubs, setClubs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Olahraga",
    description: "",
    scheduleDay: "Senin",
    scheduleTime: "15:00 - 17:00",
    location: "Lapangan Sekolah",
    supervisorTeacherId: "",
    advisorName: "",
    advisorWhatsapp: "",
    maxMembers: 50,
    isActive: true,
  });
  const [errorMsg, setErrorMsg] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resClubs, resTeachers] = await Promise.allSettled([
        extracurricularService.getAll(),
        apiClient.get("/api/users/teachers"),
      ]);

      if (resClubs.status === "fulfilled") {
        const res = resClubs.value;
        const list = Array.isArray(res) ? res : res?.items || res?.data?.items || res?.data || [];
        setClubs(list);
      }

      if (resTeachers.status === "fulfilled") {
        const tList = resTeachers.value?.data || resTeachers.value || [];
        setTeachers(Array.isArray(tList) ? tList : []);
      }
    } catch (err) {
      console.error("Failed to load extracurriculars or teachers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = clubs.filter(
    (club) =>
      (club.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.supervisor?.name || club.advisorName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "Olahraga",
      description: "",
      scheduleDay: "Senin",
      scheduleTime: "15:00 - 17:00",
      location: "Lapangan Sekolah",
      supervisorTeacherId: "",
      advisorName: "",
      advisorWhatsapp: "",
      maxMembers: 50,
      isActive: true,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (club) => {
    setEditingItem(club);
    setFormData({
      name: club.name || "",
      category: club.category || "Olahraga",
      description: club.description || "",
      scheduleDay: club.scheduleDay || "Senin",
      scheduleTime: club.scheduleTime || "15:00 - 17:00",
      location: club.location || "",
      supervisorTeacherId: club.supervisorTeacherId || club.supervisor?.id || "",
      advisorName: club.supervisor?.name || club.advisorName || "",
      advisorWhatsapp: club.supervisor?.phoneNumber || club.advisorWhatsapp || "",
      maxMembers: club.maxMembers || 50,
      isActive: club.isActive ?? true,
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
        supervisorTeacherId: formData.supervisorTeacherId || null,
        maxMembers: parseInt(formData.maxMembers, 10) || 50,
      };

      if (editingItem) {
        await extracurricularService.updateExtracurricular(editingItem.id, payload);
      } else {
        await extracurricularService.createExtracurricular(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Gagal menyimpan ekstrakurikuler.");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await extracurricularService.deleteExtracurricular(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus ekstrakurikuler.");
    }
  };

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-pink-600" />
            <span>Kelola Ekstrakurikuler</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">Daftar unit kegiatan siswa (UKS) terdaftar di sistem</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ekstrakurikuler</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari ekstrakurikuler atau pembina..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-pink-600 transition"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-gray-400">Memuat data ekstrakurikuler...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Nama Ekstrakurikuler</th>
                <th className="p-4">Guru Pembina</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Jadwal & Lokasi</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 font-medium">
                    Tidak ada ekstrakurikuler terdaftar.
                  </td>
                </tr>
              ) : (
                filtered.map((club) => {
                  const supervisorName = club.supervisor?.name || club.advisorName;
                  return (
                    <tr key={club.id || club.name} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{club.name}</div>
                        <div className="text-[10px] text-gray-400">{club.description?.substring(0, 50)}...</div>
                      </td>
                      <td className="p-4">
                        {supervisorName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-[10px]">
                              {supervisorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{supervisorName}</div>
                              {club.supervisor?.nip && (
                                <div className="text-[10px] text-gray-400">NIP: {club.supervisor.nip}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Belum ditentukan</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg font-bold border border-pink-100/50">
                          {club.category}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div>{club.scheduleDay} ({club.scheduleTime})</div>
                        <div className="text-[10px] text-gray-400">{club.location}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          club.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {club.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(club)}
                          className="text-gray-500 hover:text-pink-700 font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(club.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-rose-600 font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-gray-900">
              {editingItem ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler Baru"}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Ekstrakurikuler *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: OSIS, Paskibra, Pramuka, Basket"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-pink-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Guru Pembina (User Relation)</label>
                <select
                  value={formData.supervisorTeacherId}
                  onChange={(e) => {
                    const teacherId = e.target.value;
                    const selected = teachers.find((t) => t.id === teacherId);
                    setFormData({
                      ...formData,
                      supervisorTeacherId: teacherId,
                      advisorName: selected ? selected.fullName : formData.advisorName,
                      advisorWhatsapp: selected ? (selected.phoneNumber || formData.advisorWhatsapp) : formData.advisorWhatsapp,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-pink-600"
                >
                  <option value="">Pilih Guru Pembina (Tidak Ada)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} {t.nip ? `(NIP: ${t.nip})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Mengambil dari daftar seluruh guru aktif di sekolah</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Kategori *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-pink-600"
                >
                  <option value="Olahraga">Olahraga</option>
                  <option value="Seni & Budaya">Seni & Budaya</option>
                  <option value="Sains & Teknologi">Sains & Teknologi</option>
                  <option value="Kepemimpinan">Kepemimpinan & Kebangsaan</option>
                  <option value="Keagamaan">Keagamaan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan kegiatan ekskul..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-pink-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hari Latihan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Senin & Kamis"
                    value={formData.scheduleDay}
                    onChange={(e) => setFormData({ ...formData, scheduleDay: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-pink-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Jam Latihan</label>
                  <input
                    type="text"
                    placeholder="15:30 - 17:00"
                    value={formData.scheduleTime}
                    onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-pink-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Lokasi Latihan</label>
                <input
                  type="text"
                  placeholder="Contoh: Lapangan Utama / Aula"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-pink-600"
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
                  className="px-5 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 transition cursor-pointer shadow-xs"
                >
                  Simpan Ekstrakurikuler
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
            <h3 className="text-base font-black text-gray-900">Hapus Ekstrakurikuler</h3>
            <p className="text-xs text-gray-500 font-medium">
              Apakah Anda yakin ingin menghapus unit ekstrakurikuler ini?
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
