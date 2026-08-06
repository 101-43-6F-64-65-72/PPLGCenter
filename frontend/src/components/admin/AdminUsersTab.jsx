"use client";

import React, { useState, useEffect } from "react";
import userService from "@/services/userService";
import { UserPlus, Users, Trash2, ShieldCheck, Mail, Lock, User, RefreshCw } from "lucide-react";
import TableSkeleton from "@/components/ui/TableSkeleton";

const ROLE_OPTIONS = [
  { value: 0, label: "Admin (Waka Kesiswaan)", badgeBg: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: 1, label: "Pembina Ekskul / Guru (NIP)", badgeBg: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: 2, label: "Siswa Biasa (NIS / NISN)", badgeBg: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: 3, label: "Pengurus OSIS / Ekskul", badgeBg: "bg-amber-100 text-amber-700 border-amber-200" },
];

export default function AdminUsersTab() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: 2, // Default: Student
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getUsers({ pageSize: 50 });
      let userItems = [];
      if (res?.data?.items) {
        userItems = res.data.items;
      } else if (res?.items) {
        userItems = res.items;
      } else if (Array.isArray(res)) {
        userItems = res;
      }
      setUsers(userItems);
    } catch (err) {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: parseInt(formData.role, 10),
      };

      const res = await userService.createUser(payload);

      if (res?.success || res?.data || res?.id) {
        setStatusMessage({
          type: "success",
          text: `Akun ${formData.fullName} berhasil didaftarkan!`,
        });
        setFormData({ fullName: "", email: "", password: "", role: 2 });
        setIsModalOpen(false);
        await loadUsers();
      } else {
        setStatusMessage({
          type: "error",
          text: res?.message || "Gagal mendaftarkan akun.",
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
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun ${fullName}?`)) return;

    try {
      await userService.deleteUser(userId);
      setStatusMessage({
        type: "success",
        text: `Akun ${fullName} telah berhasil dihapus.`,
      });
      await loadUsers();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || "Gagal menghapus akun pengguna.",
      });
    }
  };

  const getRoleBadge = (roleValue) => {
    let roleNum = roleValue;
    if (typeof roleValue === "string") {
      const lower = roleValue.toLowerCase();
      if (lower.includes("admin")) roleNum = 0;
      else if (lower.includes("teacher") || lower.includes("guru")) roleNum = 1;
      else if (lower.includes("osis")) roleNum = 3;
      else roleNum = 2;
    }
    const found = ROLE_OPTIONS.find((r) => r.value === roleNum);
    return found || ROLE_OPTIONS[2];
  };

  return (
    <div className="space-y-6">
      {/* Alert Status Notification */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage({ type: "", text: "" })}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Panel User Management */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2c1ee8] flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Manajemen & Registrasi Akun</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Daftarkan pengguna baru (Admin, Guru, OSIS, Siswa) langsung ke sistem backend.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2c1ee8] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#2c1ee8]/20 hover:bg-blue-700 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Registrasi Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            Daftar Pengguna Terdaftar ({users.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-gray-500 uppercase tracking-wider font-extrabold text-[11px] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nama Pengguna</th>
                  <th className="px-6 py-4">Email / ID</th>
                  <th className="px-6 py-4">Role Hak Akses</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {users.map((u) => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#2c1ee8] flex items-center justify-center font-extrabold text-xs">
                            {u.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <span className="font-bold text-gray-900">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${badge.badgeBg}`}>
                          {badge.label.split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.fullName)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm font-medium text-gray-500">
            Belum ada pengguna terdaftar. Klik <strong>+ Registrasi Akun Baru</strong> untuk mendaftarkan akun.
          </div>
        )}
      </div>

      {/* Modal Registrasi Akun Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 sm:p-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-gray-500 hover:bg-slate-200 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#2c1ee8] text-white flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Registrasi Akun Baru</h3>
                <p className="text-xs text-gray-500">Buat kredensial akun pengguna sistem Student Center.</p>
              </div>
            </div>

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nama Lengkap *
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
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 focus:border-[#2c1ee8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Akun *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Contoh: samuel@studentcenter.id"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 focus:border-[#2c1ee8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Password *
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
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs sm:text-sm text-gray-900 focus:border-[#2c1ee8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Role / Hak Akses Pengguna *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 px-4 text-xs sm:text-sm text-gray-900 focus:border-[#2c1ee8] focus:outline-hidden"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-[#2c1ee8] text-xs sm:text-sm font-bold text-white shadow-md shadow-[#2c1ee8]/20 hover:bg-blue-700 disabled:opacity-50"
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
