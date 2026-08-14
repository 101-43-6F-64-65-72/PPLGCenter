"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Search, Plus, Upload, Edit3, Trash2, ShieldCheck,
  CheckCircle, AlertCircle, RefreshCw, X, FileText, ChevronLeft, ChevronRight, Award, Layers
} from "lucide-react";
import userService from "@/services/userService";
import schoolClassService from "@/services/schoolClassService";
import extracurricularService from "@/services/extracurricularService";

export default function AdminTeachersTab() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");

  const [classes, setClasses] = useState([]);
  const [extracurriculars, setExtracurriculars] = useState([]);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    fullName: "",
    nip: "",
    email: "",
    phoneNumber: "",
    address: "",
    gender: "Laki-laki",
    birthDate: "",
    position: "Guru Mata Pelajaran",
    password: "",
  });

  // Assign Form
  const [assignHomeroomClassId, setAssignHomeroomClassId] = useState("");
  const [assignAdvisorExtracurricularIds, setAssignAdvisorExtracurricularIds] = useState([]);

  // Import CSV
  const [csvContent, setCsvContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers({
        page,
        pageSize,
        search: search || undefined,
        role: "Teacher",
      });

      const data = res?.data || res;
      if (data?.items) {
        setTeachers(data.items);
        setTotalCount(data.totalCount || 0);
      } else if (Array.isArray(data)) {
        setTeachers(data);
        setTotalCount(data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    schoolClassService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : res?.items || res?.data?.items || res?.data || [];
      setClasses(list);
    }).catch(() => {});

    extracurricularService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : res?.items || res?.data?.items || res?.data || [];
      setExtracurriculars(list);
    }).catch(() => {});
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      fullName: "",
      nip: "",
      email: "",
      phoneNumber: "",
      address: "",
      gender: "Laki-laki",
      birthDate: "",
      position: "Guru Mata Pelajaran",
      password: "Guru123!",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTeacher(t);
    setFormData({
      fullName: t.fullName || "",
      nip: t.nip || "",
      email: t.email || "",
      phoneNumber: t.phoneNumber || "",
      address: t.address || "",
      gender: t.gender || "Laki-laki",
      birthDate: t.birthDate ? t.birthDate.split("T")[0] : "",
      position: t.position || "Guru Mata Pelajaran",
      password: "",
    });
    setShowModal(true);
  };

  const handleOpenAssign = (t) => {
    setAssigningTeacher(t);
    // Find class where this teacher is homeroom teacher
    const currentClass = classes.find((c) => c.homeroomTeacherId === t.id);
    setAssignHomeroomClassId(currentClass ? currentClass.id : "");
    setAssignAdvisorExtracurricularIds([]);
    setShowAssignModal(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        role: "Teacher",
        // Ensure birthDate is sent as UTC ISO string to prevent Npgsql unspecified DateTime errors
        birthDate: formData.birthDate
          ? new Date(formData.birthDate + "T00:00:00Z").toISOString()
          : null,
      };

      if (editingTeacher) {
        const res = await userService.updateUser(editingTeacher.id, payload);
        if (res?.success || res?.id || res?.data) {
          setFeedback({ type: "success", text: "Data guru berhasil diperbarui." });
          setShowModal(false);
          loadData();
        } else {
          setFeedback({ type: "error", text: res?.message || "Gagal memperbarui data guru." });
        }
      } else {
        const res = await userService.createUser(payload);
        if (res?.success || res?.id || res?.data) {
          setFeedback({ type: "success", text: "Guru baru berhasil ditambahkan." });
          setShowModal(false);
          loadData();
        } else {
          setFeedback({ type: "error", text: res?.message || "Gagal membuat akun guru." });
        }
      }
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Terjadi kesalahan." });
    }
  };

  const handleSaveAssign = async (e) => {
    e.preventDefault();
    if (!assigningTeacher) return;
    try {
      const payload = {
        teacherId: assigningTeacher.id,
        homeroomClassId: assignHomeroomClassId || null,
        advisorExtracurricularIds: assignAdvisorExtracurricularIds,
      };

      const res = await userService.assignTeacher(payload);
      if (res?.success || res?.id || res?.data) {
        setFeedback({ type: "success", text: `Penugasan untuk '${assigningTeacher.fullName}' berhasil disimpan.` });
        setShowAssignModal(false);
        // Refresh classes list as homeroom assignment updated
        const classRes = await schoolClassService.getAll();
        if (Array.isArray(classRes?.data || classRes)) setClasses(classRes?.data || classRes);
        loadData();
      } else {
        setFeedback({ type: "error", text: res?.message || "Gagal mengupdate penugasan guru." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Gagal mengupdate penugasan guru." });
    }
  };

  const handleDelete = async () => {
    if (!deletingTeacher) return;
    try {
      const res = await userService.deleteUser(deletingTeacher.id);
      if (res?.success || res?.status === 200) {
        setFeedback({ type: "success", text: `Guru '${deletingTeacher.fullName}' berhasil dihapus.` });
        setShowDeleteModal(false);
        setDeletingTeacher(null);
        loadData();
      } else {
        setFeedback({ type: "error", text: res?.message || "Gagal menghapus data guru." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Gagal menghapus data guru." });
    }
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) return;
    setImporting(true);
    setImportReport(null);
    try {
      const res = await userService.importTeachers(csvContent);
      const data = res?.data || res;
      if (data) {
        setImportReport(data);
        loadData();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Gagal mengimpor file CSV." });
    } finally {
      setImporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Master User Management</span>
          </div>
          <h2 className="text-xl font-black text-gray-900">Data Guru & Pembina</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manajemen pengajar, penetapan Wali Kelas, dan Pembina Ekstrakurikuler.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setCsvContent(""); setImportReport(null); setShowImportModal(true); }}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Alert */}
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
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama, NIP, Jabatan, atau Email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
          />
        </div>

        <button
          onClick={() => loadData()}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Guru</th>
                <th className="py-3.5 px-4">NIP</th>
                <th className="py-3.5 px-4">Email / HP</th>
                <th className="py-3.5 px-4">Jabatan Utama</th>
                <th className="py-3.5 px-4">Wali Kelas</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded-md w-full" /></td>
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-semibold">Tidak ada data guru ditemukan.</td>
                </tr>
              ) : (
                teachers.map((t) => {
                  const homeroomClass = classes.find((c) => c.homeroomTeacherId === t.id);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-gray-900">{t.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{t.gender || "—"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{t.nip || "—"}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-gray-800">{t.email}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{t.phoneNumber || "—"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">{t.position || "Guru"}</td>
                      <td className="py-3.5 px-4">
                        {homeroomClass ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold border border-violet-200 text-[10px]">
                            <Layers className="w-3 h-3" />
                            {homeroomClass.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${t.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500"}`}>
                          {t.isActive ? "Aktif" : "Non-Aktif"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenAssign(t)}
                          className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[10px] transition"
                          title="Assign Wali Kelas / Pembina"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                          Penugasan
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setDeletingTeacher(t); setShowDeleteModal(true); }}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Menampilkan {teachers.length} dari {totalCount} guru</span>
          <div className="flex items-center gap-2 font-bold">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Halaman {page} dari {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-base font-black text-gray-900">
                {editingTeacher ? "Edit Data Guru" : "Tambah Guru Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">NIP *</label>
                  <input
                    type="text"
                    required
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Jabatan / Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Waka Kesiswaan, Guru BK, dll"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">No HP</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Alamat</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  Password {editingTeacher ? "(Biarkan kosong jika tidak diubah)" : "Default *"}
                </label>
                <input
                  type="password"
                  required={!editingTeacher}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md"
                >
                  {editingTeacher ? "Simpan Perubahan" : "Tambah Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal (Wali Kelas & Pembina Ekskul) */}
      {showAssignModal && assigningTeacher && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-black text-gray-900">Penugasan Peran Guru</h3>
                <p className="text-xs text-gray-500 font-medium">{assigningTeacher.fullName} ({assigningTeacher.nip})</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveAssign} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">1. Penugasan Wali Kelas</label>
                <select
                  value={assignHomeroomClassId}
                  onChange={(e) => setAssignHomeroomClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-indigo-600 outline-none"
                >
                  <option value="">Bukan Wali Kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.homeroomTeacherName ? `(Saat ini: ${c.homeroomTeacherName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5">2. Penugasan Pembina Ekstrakurikuler</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                  {extracurriculars.length === 0 ? (
                    <p className="text-gray-400 italic">Belum ada ekstrakurikuler.</p>
                  ) : (
                    extracurriculars.map((extra) => {
                      const isChecked = assignAdvisorExtracurricularIds.includes(extra.id);
                      return (
                        <label key={extra.id} className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignAdvisorExtracurricularIds([...assignAdvisorExtracurricularIds, extra.id]);
                              } else {
                                setAssignAdvisorExtracurricularIds(assignAdvisorExtracurricularIds.filter((id) => id !== extra.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{extra.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md"
                >
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-gray-900">Import Data Guru (CSV)</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="text-xs text-gray-500 space-y-2">
              <p className="font-semibold text-gray-700">Format Kolom CSV:</p>
              <code className="block p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-[10px] text-gray-800 overflow-x-auto whitespace-pre">
                Nama,NIP,Email,HP,Alamat,Gender,Tanggal Lahir,Position,Password
              </code>
              <p className="text-[11px] text-gray-400">Aturan: NIP duplikat akan dilewati automatik.</p>
            </div>

            <textarea
              rows="6"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Tempelkan isi file CSV di sini..."
              className="w-full p-3 rounded-xl border border-gray-200 font-mono text-xs outline-none focus:border-emerald-600"
            />

            {importReport && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                <p className="font-black text-gray-900">Laporan Hasil Import:</p>
                <div className="flex gap-4 text-xs font-bold">
                  <span className="text-emerald-600">Berhasil: {importReport.successCount}</span>
                  <span className="text-amber-600">Dilewati: {importReport.skippedCount}</span>
                  <span className="text-rose-600">Gagal: {importReport.failedCount}</span>
                </div>
                {importReport.errors?.length > 0 && (
                  <div className="max-h-24 overflow-y-auto pt-2 border-t border-gray-200 space-y-1 text-[11px] font-mono text-rose-700">
                    {importReport.errors.map((err, idx) => <p key={idx}>{err}</p>)}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold"
              >
                Tutup
              </button>
              <button
                disabled={importing || !csvContent.trim()}
                onClick={handleImportCsv}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-40 shadow-md"
              >
                {importing ? "Mengimpor..." : "Proses Import CSV"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && deletingTeacher && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Hapus Guru?</h3>
            <p className="text-xs text-gray-500">
              Apakah Anda yakin ingin menghapus data guru <strong className="text-gray-900">{deletingTeacher.fullName}</strong> ({deletingTeacher.nip})?
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
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
