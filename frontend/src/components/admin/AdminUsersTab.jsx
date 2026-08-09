"use client";

import React, { useState, useEffect, useCallback } from "react";
import userService from "@/services/userService";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Hash,
  Filter,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import TableSkeleton from "@/components/ui/TableSkeleton";

const ROLE_MAP = {
  0: { label: "Admin", title: "Admin / Waka", badge: "bg-purple-50 text-purple-700 border-purple-200", icon: ShieldCheck },
  1: { label: "Teacher", title: "Guru / Pembina", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: BookOpen },
  2: { label: "Student", title: "Siswa", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: GraduationCap },
  3: { label: "OSIS", title: "Pengurus OSIS", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: ShieldAlert },
};

function parseRoleNum(roleVal) {
  if (typeof roleVal === "number") return roleVal;
  if (!roleVal) return 2;
  const lower = String(roleVal).toLowerCase();
  if (lower.includes("admin")) return 0;
  if (lower.includes("teacher") || lower.includes("guru")) return 1;
  if (lower.includes("osis")) return 3;
  return 2;
}

export default function AdminUsersTab() {
  // Main Data States
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoleFilter, setActiveRoleFilter] = useState("ALL"); // 'ALL' | 0 | 1 | 2
  const [searchQuery, setSearchQuery] = useState("");

  // Statistics
  const [stats, setStats] = useState({ total: 0, admin: 0, teacher: 0, student: 0 });

  // Modals State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: 2,
    nis: "",
    nip: "",
    phoneNumber: "",
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch current list users for table display with search & role filters
      const params = { pageSize: 100 };
      if (activeRoleFilter !== "ALL") {
        params.role = activeRoleFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await userService.getUsers(params);
      let items = res?.data?.items || res?.items || (Array.isArray(res) ? res : []);
      setUsers(items);

      // Fetch accurate real database counts for each role in parallel
      const [adminRes, teacherRes, studentRes] = await Promise.all([
        userService.getUsers({ role: 0, pageSize: 1 }).catch(() => ({ data: { totalCount: 0 } })),
        userService.getUsers({ role: 1, pageSize: 1 }).catch(() => ({ data: { totalCount: 0 } })),
        userService.getUsers({ role: 2, pageSize: 1 }).catch(() => ({ data: { totalCount: 0 } })),
      ]);

      const adminCount = adminRes?.data?.totalCount ?? adminRes?.totalCount ?? 0;
      const teacherCount = teacherRes?.data?.totalCount ?? teacherRes?.totalCount ?? 0;
      const studentCount = studentRes?.data?.totalCount ?? studentRes?.totalCount ?? 0;
      const totalCount = adminCount + teacherCount + studentCount;

      setStats({
        total: totalCount || items.length,
        admin: adminCount,
        teacher: teacherCount,
        student: studentCount,
      });
    } catch (err) {
      console.error("Gagal memuat pengguna:", err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeRoleFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "role" ? parseInt(value, 10) : value,
    }));
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: parseInt(formData.role, 10),
        nis: formData.nis.trim() || null,
        nip: formData.nip.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
      };

      const res = await userService.createUser(payload);

      if (res?.success || res?.data || res?.id) {
        setStatusMessage({
          type: "success",
          text: `✓ Akun ${formData.fullName} berhasil didaftarkan!`,
        });
        setFormData({ fullName: "", email: "", password: "", role: 2, nis: "", nip: "", phoneNumber: "" });
        setIsRegisterModalOpen(false);
        await loadUsers();
      } else {
        setStatusMessage({
          type: "error",
          text: res?.message || "Gagal mendaftarkan akun pengguna.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Terjadi kesalahan saat mendaftarkan akun.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, fullName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun "${fullName}"? Data akun akan dihapus permanen.`)) return;

    try {
      await userService.deleteUser(userId);
      setStatusMessage({
        type: "success",
        text: `✓ Akun ${fullName} telah dihapus dari sistem.`,
      });
      if (selectedUserDetail?.id === userId) setSelectedUserDetail(null);
      await loadUsers();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || "Gagal menghapus akun pengguna.",
      });
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      await userService.updateUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
      );
      if (selectedUserDetail?.id === user.id) {
        setSelectedUserDetail((prev) => ({ ...prev, isActive: newStatus }));
      }
    } catch (err) {
      alert("Gagal memperbarui status user.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Status Toast ── */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage({ type: "", text: "" })}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Top Metric Cards (Database Overview) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveRoleFilter("ALL")}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeRoleFilter === "ALL"
              ? "bg-gradient-to-br from-[#2c1ee8] to-blue-700 text-white border-transparent shadow-lg shadow-blue-500/20"
              : "bg-white border-gray-100 text-gray-800 hover:border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${activeRoleFilter === "ALL" ? "opacity-80" : "text-gray-400"}`}>
              Total Pengguna
            </span>
            <div className={`p-2 rounded-2xl ${activeRoleFilter === "ALL" ? "bg-white/20" : "bg-blue-50 text-[#2c1ee8]"}`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black">{stats.total || users.length}</p>
          <span className={`text-[11px] font-medium mt-1 block ${activeRoleFilter === "ALL" ? "opacity-70" : "text-gray-400"}`}>
            Pengguna Aktif
          </span>
        </div>

        <div
          onClick={() => setActiveRoleFilter(0)}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeRoleFilter === 0
              ? "bg-gradient-to-br from-purple-700 to-indigo-800 text-white border-transparent shadow-lg shadow-purple-500/20"
              : "bg-white border-gray-100 text-gray-800 hover:border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${activeRoleFilter === 0 ? "opacity-80" : "text-gray-400"}`}>
              Super Admin
            </span>
            <div className={`p-2 rounded-2xl ${activeRoleFilter === 0 ? "bg-white/20" : "bg-purple-50 text-purple-600"}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black">{stats.admin}</p>
          <span className={`text-[11px] font-medium mt-1 block ${activeRoleFilter === 0 ? "opacity-70" : "text-gray-400"}`}>
            Akses Penuh Waka
          </span>
        </div>

        <div
          onClick={() => setActiveRoleFilter(1)}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeRoleFilter === 1
              ? "bg-gradient-to-br from-blue-600 to-cyan-700 text-white border-transparent shadow-lg shadow-cyan-500/20"
              : "bg-white border-gray-100 text-gray-800 hover:border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${activeRoleFilter === 1 ? "opacity-80" : "text-gray-400"}`}>
              Guru & Pembina
            </span>
            <div className={`p-2 rounded-2xl ${activeRoleFilter === 1 ? "bg-white/20" : "bg-blue-50 text-blue-600"}`}>
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black">{stats.teacher}</p>
          <span className={`text-[11px] font-medium mt-1 block ${activeRoleFilter === 1 ? "opacity-70" : "text-gray-400"}`}>
            Tenaga Pendidik (NIP)
          </span>
        </div>

        <div
          onClick={() => setActiveRoleFilter(2)}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeRoleFilter === 2
              ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-transparent shadow-lg shadow-emerald-500/20"
              : "bg-white border-gray-100 text-gray-800 hover:border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${activeRoleFilter === 2 ? "opacity-80" : "text-gray-400"}`}>
              Siswa Terdaftar
            </span>
            <div className={`p-2 rounded-2xl ${activeRoleFilter === 2 ? "bg-white/20" : "bg-emerald-50 text-emerald-600"}`}>
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black">{stats.student}</p>
          <span className={`text-[11px] font-medium mt-1 block ${activeRoleFilter === 2 ? "opacity-70" : "text-gray-400"}`}>
            Siswa Aktif (NIS/NISN)
          </span>
        </div>
      </div>

      {/* ── Toolbar: Search & Action Controls ── */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Role Tabs */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl overflow-x-auto gap-1">
          {[
            { id: "ALL", label: "Semua User" },
            { id: 0, label: "Admin" },
            { id: 1, label: "Guru / Pembina" },
            { id: 2, label: "Siswa" },
          ].map((tab) => (
            <button
              key={String(tab.id)}
              onClick={() => setActiveRoleFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeRoleFilter === tab.id
                  ? "bg-white text-[#2c1ee8] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Registration */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, NIS, NIP, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] text-xs sm:text-sm outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="p-2.5 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2c1ee8] px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#2c1ee8]/20 hover:bg-blue-700 transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Akun Baru</span>
          </button>
        </div>
      </div>

      {/* ── Main GUI Database Table ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2c1ee8]" />
            <h3 className="text-base font-black text-gray-900">
              Pengguna Terdaftar ({users.length})
            </h3>
          </div>
          <span className="text-xs font-semibold text-gray-400">Daftar Pengguna</span>
        </div>

        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#2c1ee8]" />
            <p className="font-bold text-gray-700 text-sm">Tidak ada pengguna ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci atau filter role.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-extrabold text-[11px] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Identitas (NIS/NIP)</th>
                  <th className="px-6 py-4">Kelas / Jabatan</th>
                  <th className="px-6 py-4">Kontak Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {users.map((u) => {
                  const roleNum = parseRoleNum(u.role);
                  const roleConfig = ROLE_MAP[roleNum] || ROLE_MAP[2];
                  const RoleIcon = roleConfig.icon;
                  const identifier = u.nis || u.nip || u.nisn || u.username || "-";

                  return (
                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-2xl overflow-hidden bg-indigo-50 border border-indigo-100 text-[#2c1ee8] flex items-center justify-center font-black text-xs shrink-0">
                            {u.photoUrl ? (
                              <img src={u.photoUrl} alt={u.fullName} className="w-full h-full object-cover" />
                            ) : (
                              u.fullName?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-gray-900 block group-hover:text-[#2c1ee8] transition-colors">
                              {u.fullName}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.badge}`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleConfig.title}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {identifier}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        {u.className || u.position || u.departmentCode || "—"}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-gray-500">
                        {u.email}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {u.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedUserDetail(u)}
                            className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Detail Profil GUI"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Detail User Profil (GUI Card) ── */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2c1ee8] font-black text-lg">
                  {selectedUserDetail.photoUrl ? (
                    <img src={selectedUserDetail.photoUrl} alt={selectedUserDetail.fullName} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    selectedUserDetail.fullName?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{selectedUserDetail.fullName}</h3>
                  <p className="text-xs font-mono text-gray-400">{selectedUserDetail.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase">Role System</span>
                <p className="font-extrabold text-gray-900">{ROLE_MAP[parseRoleNum(selectedUserDetail.role)]?.title}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase">Status Akun</span>
                <p className={`font-extrabold ${selectedUserDetail.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                  {selectedUserDetail.isActive ? "● Aktif (Bisa Login)" : "○ Nonaktif"}
                </p>
              </div>

              {selectedUserDetail.nis && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">NIS</span>
                  <p className="font-mono font-bold text-gray-800">{selectedUserDetail.nis}</p>
                </div>
              )}

              {selectedUserDetail.nisn && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">NISN</span>
                  <p className="font-mono font-bold text-gray-800">{selectedUserDetail.nisn}</p>
                </div>
              )}

              {selectedUserDetail.nip && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">NIP</span>
                  <p className="font-mono font-bold text-gray-800">{selectedUserDetail.nip}</p>
                </div>
              )}

              {selectedUserDetail.className && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">Kelas</span>
                  <p className="font-bold text-gray-800">{selectedUserDetail.className}</p>
                </div>
              )}

              {selectedUserDetail.phoneNumber && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">No. Telepon / WA</span>
                  <p className="font-mono font-bold text-gray-800">{selectedUserDetail.phoneNumber}</p>
                </div>
              )}

              {selectedUserDetail.address && (
                <div className="col-span-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">Alamat Domisili</span>
                  <p className="font-medium text-gray-800">{selectedUserDetail.address}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleToggleStatus(selectedUserDetail)}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                  selectedUserDetail.isActive
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {selectedUserDetail.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUserDetail.id, selectedUserDetail.fullName)}
                className="py-3 px-5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
              >
                Hapus User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Registrasi Akun Baru ── */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2c1ee8] text-white flex items-center justify-center shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Registrasi Akun Baru</h3>
                  <p className="text-xs text-gray-500">Kredensial pengguna sistem Student Center.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Contoh: Samuel Lyandro Saputra"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="samuel@studentcenter.id"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Role / Hak Akses <span className="text-rose-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#2c1ee8] outline-none font-bold"
                >
                  <option value={2}>🎓 Siswa (NIS / NISN)</option>
                  <option value={1}>👨‍🏫 Guru / Pembina (NIP)</option>
                  <option value={0}>👑 Admin (Waka Kesiswaan)</option>
                  <option value={3}>⭐ Pengurus OSIS</option>
                </select>
              </div>

              {/* Conditional Identifier inputs */}
              {formData.role === 2 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    NIS (Nomor Induk Siswa)
                  </label>
                  <input
                    type="text"
                    name="nis"
                    value={formData.nis}
                    onChange={handleInputChange}
                    placeholder="Contoh: 12345"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-xs text-gray-900 focus:bg-white focus:border-[#2c1ee8] outline-none"
                  />
                </div>
              )}

              {formData.role === 1 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    name="nip"
                    value={formData.nip}
                    onChange={handleInputChange}
                    placeholder="Contoh: 197512112005011005"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-xs text-gray-900 focus:bg-white focus:border-[#2c1ee8] outline-none font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-[#2c1ee8] text-xs font-bold text-white shadow-md shadow-[#2c1ee8]/20 hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Mendaftarkan..." : "Daftarkan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
