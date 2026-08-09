"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap, Search, Plus, Upload, Download, Edit3, Trash2,
  CheckCircle, AlertCircle, RefreshCw, X, FileText, ChevronLeft, ChevronRight
} from "lucide-react";
import userService from "@/services/userService";
import departmentService from "@/services/departmentService";
import schoolClassService from "@/services/schoolClassService";

export default function AdminStudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    nis: "",
    nisn: "",
    email: "",
    phoneNumber: "",
    address: "",
    gender: "Laki-laki",
    birthDate: "",
    classId: "",
    studentNumber: "",
    password: "",
  });

  // Import CSV State
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
        role: "Student",
        classId: selectedClass || undefined,
        departmentId: selectedDepartment || undefined,
      });

      const data = res?.data || res;
      if (data?.items) {
        setStudents(data.items);
        setTotalCount(data.totalCount || 0);
      } else if (Array.isArray(data)) {
        setStudents(data);
        setTotalCount(data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedClass, selectedDepartment]);

  useEffect(() => {
    departmentService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : res?.items || res?.data?.items || res?.data || [];
      setDepartments(list);
    }).catch(() => {});

    schoolClassService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : res?.items || res?.data?.items || res?.data || [];
      setClasses(list);
    }).catch(() => {});
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      fullName: "",
      nis: "",
      nisn: "",
      email: "",
      phoneNumber: "",
      address: "",
      gender: "Laki-laki",
      birthDate: "",
      classId: classes[0]?.id || "",
      studentNumber: "",
      password: "Siswa123!",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStudent(st);
    setFormData({
      fullName: st.fullName || "",
      nis: st.nis || "",
      nisn: st.nisn || "",
      email: st.email || "",
      phoneNumber: st.phoneNumber || "",
      address: st.address || "",
      gender: st.gender || "Laki-laki",
      birthDate: st.birthDate ? st.birthDate.split("T")[0] : "",
      classId: st.classId || "",
      studentNumber: st.studentNumber || "",
      password: "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        role: "Student",
        studentNumber: formData.studentNumber ? parseInt(formData.studentNumber, 10) : null,
        // Ensure birthDate is sent as UTC ISO string to prevent Npgsql unspecified DateTime errors
        birthDate: formData.birthDate
          ? new Date(formData.birthDate + "T00:00:00Z").toISOString()
          : null,
      };

      if (editingStudent) {
        const res = await userService.updateUser(editingStudent.id, payload);
        if (res?.success || res?.id || res?.data) {
          setFeedback({ type: "success", text: "Data siswa berhasil diperbarui." });
          setShowModal(false);
          loadData();
        } else {
          setFeedback({ type: "error", text: res?.message || "Gagal memperbarui siswa." });
        }
      } else {
        const res = await userService.createUser(payload);
        if (res?.success || res?.id || res?.data) {
          setFeedback({ type: "success", text: "Siswa baru berhasil ditambahkan." });
          setShowModal(false);
          loadData();
        } else {
          setFeedback({ type: "error", text: res?.message || "Gagal membuat siswa." });
        }
      }
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Terjadi kesalahan." });
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    try {
      const res = await userService.deleteUser(deletingStudent.id);
      if (res?.success || res?.status === 200) {
        setFeedback({ type: "success", text: `Siswa '${deletingStudent.fullName}' berhasil dihapus.` });
        setShowDeleteModal(false);
        setDeletingStudent(null);
        loadData();
      } else {
        setFeedback({ type: "error", text: res?.message || "Gagal menghapus siswa." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Gagal menghapus siswa." });
    }
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) return;
    setImporting(true);
    setImportReport(null);
    try {
      const res = await userService.importStudents(csvContent);
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

  const handleExportCsv = async () => {
    try {
      const response = await userService.exportStudents({
        classId: selectedClass || undefined,
        departmentId: selectedDepartment || undefined,
      });

      const blob = new Blob([response.data || response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data_siswa_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setFeedback({ type: "error", text: "Gagal mengunduh CSV data siswa." });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2c1ee8] uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Master User Management</span>
          </div>
          <h2 className="text-xl font-black text-gray-900">Data Siswa</h2>
          <p className="text-xs text-gray-500 mt-0.5">Kelola seluruh data siswa, kelas, NIS/NISN, dan keanggotaan akademik.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-bold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => { setCsvContent(""); setImportReport(null); setShowImportModal(true); }}
            className="px-3.5 py-2.5 rounded-xl border border-blue-200 text-[#2c1ee8] bg-blue-50 hover:bg-blue-100 text-xs font-bold flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-[#2c1ee8] text-white hover:bg-blue-700 text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Alert Feedback */}
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
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama, NIS, NISN, atau Email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#2c1ee8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDepartment}
            onChange={(e) => { setSelectedDepartment(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 outline-none"
          >
            <option value="">Semua Jurusan</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 outline-none"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => loadData()}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-4">NIS</th>
                <th className="py-3.5 px-4">NISN</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Jurusan</th>
                <th className="py-3.5 px-4">No HP</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded-md w-full" /></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400 font-semibold">Tidak ada data siswa ditemukan.</td>
                </tr>
              ) : (
                students.map((st, index) => (
                  <tr key={st.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-400">{(page - 1) * pageSize + index + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-gray-900">{st.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{st.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{st.nis || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-500">{st.nisn || "—"}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">{st.className || "—"}</td>
                    <td className="py-3.5 px-4 font-extrabold text-violet-700">{st.departmentCode || "—"}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono">{st.phoneNumber || "—"}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${st.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500"}`}>
                        {st.isActive ? "Aktif" : "Non-Aktif"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(st)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeletingStudent(st); setShowDeleteModal(true); }}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition"
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Menampilkan {students.length} dari {totalCount} siswa</span>
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

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-base font-black text-gray-900">
                {editingStudent ? "Edit Data Siswa" : "Tambah Siswa Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">NIS *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">NISN</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Kelas *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.departmentCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Nomor Absen</label>
                  <input
                    type="number"
                    value={formData.studentNumber}
                    onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">No HP</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Alamat</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  Password {editingStudent ? "(Biarkan kosong jika tidak diubah)" : "Default *"}
                </label>
                <input
                  type="password"
                  required={!editingStudent}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#2c1ee8] outline-none"
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
                  className="px-5 py-2 rounded-xl bg-[#2c1ee8] text-white font-bold hover:bg-blue-700 shadow-md"
                >
                  {editingStudent ? "Simpan Perubahan" : "Tambah Siswa"}
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
                <FileText className="w-5 h-5 text-[#2c1ee8]" />
                <h3 className="text-base font-black text-gray-900">Import Data Siswa (CSV)</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="text-xs text-gray-500 space-y-2">
              <p className="font-semibold text-gray-700">Format Kolom CSV:</p>
              <code className="block p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-[10px] text-gray-800 overflow-x-auto whitespace-pre">
                Nama,NIS,NISN,Jurusan,Kelas,Email,HP,Gender,Tanggal Lahir,Alamat,Nomor Absen,Password
              </code>
              <p className="text-[11px] text-gray-400">Catatan: Jurusan & Kelas harus sudah terdaftar di sistem. NIS/NISN duplikat akan dilewati secara otomatis.</p>
            </div>

            <textarea
              rows="6"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Tempelkan isi file CSV di sini..."
              className="w-full p-3 rounded-xl border border-gray-200 font-mono text-xs outline-none focus:border-[#2c1ee8]"
            />

            {importReport && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                <p className="font-black text-gray-900">Laporan Hasil Import:</p>
                <div className="flex gap-4 text-xs font-bold">
                  <span className="text-emerald-600">✓ Berhasil: {importReport.successCount}</span>
                  <span className="text-amber-600">⊘ Dilewati: {importReport.skippedCount}</span>
                  <span className="text-rose-600">✕ Gagal: {importReport.failedCount}</span>
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
                className="px-5 py-2 rounded-xl bg-[#2c1ee8] text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-40 shadow-md"
              >
                {importing ? "Mengimpor..." : "Proses Import CSV"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && deletingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">Hapus Siswa?</h3>
            <p className="text-xs text-gray-500">
              Apakah Anda yakin ingin menghapus data siswa <strong className="text-gray-900">{deletingStudent.fullName}</strong> ({deletingStudent.nis})?
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
