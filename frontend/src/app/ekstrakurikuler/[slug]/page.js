"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useAuth from "@/hooks/useAuth";
import useExtracurricularDetail from "@/hooks/useExtracurricularDetail";
import JoinExtracurricularModal from "@/components/ekstrakurikuler/JoinExtracurricularModal";
import LeaveExtracurricularModal from "@/components/ekstrakurikuler/LeaveExtracurricularModal";
import CreateExtracurricularModal from "@/components/ekstrakurikuler/CreateExtracurricularModal";
import { extracurricularService } from "@/services/extracurricularService";
import { resolveImageUrl } from "@/lib/utils";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Check,
  LogOut,
  ShieldAlert,
  Users,
  Edit,
  Edit2
} from "lucide-react";

export default function ExtracurricularDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug?.toString()?.toLowerCase();
  const { user, isAuthenticated, role } = useAuth();

  const {
    detailData: data,
    isLoading,
    isJoined,
    isPending,
    currentMembers,
    maxMembers,
    isActive,
    fetchError,
    refetch,
  } = useExtracurricularDetail(slug);

  const [isConfirmJoinOpen, setIsConfirmJoinOpen] = useState(false);
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Role & Authorization Checks (Only Pembimbing and Admin can edit)
  const isStudentRole = !isAuthenticated || role === "Student" || role === "OSIS";
  const isTeacherRole = role === "Teacher";
  const isAdminRole = role === "Admin" || role === "Super Admin";

  const isPembimbing = isTeacherRole && (
    !data?.supervisorTeacherId ||
    String(data?.supervisorTeacherId || data?.managedByUserId || data?.supervisor?.id || "") === String(user?.id || user?.Id || "") ||
    (user?.fullName && data?.instructor?.toLowerCase()?.includes(user.fullName.toLowerCase())) ||
    (user?.name && data?.instructor?.toLowerCase()?.includes(user.name.toLowerCase())) ||
    (user?.fullName && data?.advisorName?.toLowerCase()?.includes(user.fullName.toLowerCase()))
  );
  const canEditExtracurricular = isAdminRole || isPembimbing;

  const showToastNotification = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // Evaluate Join Button Configuration for Student
  const getJoinButtonConfig = () => {
    if (!isAuthenticated) {
      return {
        label: "Masuk untuk Bergabung",
        disabled: false,
        onClick: () => router.push(`/login?returnUrl=/ekstrakurikuler/${slug}`),
        className: "bg-[#2c1ee8] hover:bg-[#2218a3] text-white shadow-md shadow-blue-500/25 active:scale-95",
      };
    }

    if (isPending) {
      return {
        label: "Menunggu Persetujuan Pembina",
        disabled: true,
        onClick: null,
        className: "bg-amber-100 text-amber-800 border border-amber-300 font-extrabold cursor-not-allowed opacity-90 shadow-sm",
      };
    }

    if (isJoined) {
      return {
        label: "Terdaftar sebagai Anggota Aktif",
        disabled: true,
        onClick: null,
        className: "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold cursor-not-allowed opacity-90",
      };
    }

    if (!isActive) {
      return {
        label: "Tidak Tersedia",
        disabled: true,
        onClick: null,
        className: "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed font-bold",
      };
    }

    if (currentMembers >= maxMembers && maxMembers > 0) {
      return {
        label: "Kuota Penuh",
        disabled: true,
        onClick: null,
        className: "bg-rose-100 text-rose-700 border border-rose-200 cursor-not-allowed font-bold",
      };
    }

    return {
      label: isSubmittingJoin ? "Mengirim Pengajuan..." : "Gabung Ekstrakurikuler Ini",
      disabled: isSubmittingJoin,
      onClick: () => {
        setModalError("");
        setIsConfirmJoinOpen(true);
      },
      className: "bg-[#2c1ee8] hover:bg-[#2218a3] text-white shadow-md shadow-blue-500/25 active:scale-95",
    };
  };

  // Handle Join Submission
  const handleConfirmJoin = async () => {
    if (!data?.id) return;
    setIsSubmittingJoin(true);
    setModalError("");

    try {
      const res = await extracurricularService.joinExtracurricular(data.id);

      if (res && res.success) {
        setIsConfirmJoinOpen(false);
        showToastNotification(`Pengajuan pendaftaran ke ${data.name} berhasil dikirim! Menunggu persetujuan Guru Pembina.`, "success");
        await refetch();
      } else {
        const rawMsg = res?.message || "";
        let friendlyErr = "Terjadi kesalahan. Silakan coba lagi.";

        if (res?.statusCode === 403 || rawMsg.includes("Only students") || rawMsg.includes("hanya siswa")) {
          friendlyErr = "Hanya siswa yang dapat bergabung dengan ekstrakurikuler.";
        } else if (rawMsg.includes("already a member")) {
          friendlyErr = "Anda sudah menjadi anggota ekstrakurikuler ini.";
        } else if (rawMsg.includes("capacity")) {
          friendlyErr = "Kuota ekstrakurikuler sudah penuh.";
        } else if (rawMsg.includes("inactive")) {
          friendlyErr = "Ekstrakurikuler tidak tersedia.";
        }

        setModalError(friendlyErr);
      }
    } catch (err) {
      const status = err?.statusCode || err?.response?.status;
      const rawErrMsg = err?.response?.data?.message || err?.message || "";

      if (status === 401 || rawErrMsg.includes("Unauthorized")) {
        setIsConfirmJoinOpen(false);
        router.push(`/login?returnUrl=/ekstrakurikuler/${slug}`);
        return;
      }

      let friendlyErr = "Terjadi kesalahan. Silakan coba lagi.";
      if (status === 403 || rawErrMsg.includes("Only students") || rawErrMsg.includes("students can join")) {
        friendlyErr = "Hanya siswa yang dapat bergabung dengan ekstrakurikuler.";
      } else if (rawErrMsg.includes("already a member")) {
        friendlyErr = "Anda sudah menjadi anggota ekstrakurikuler ini.";
      } else if (rawErrMsg.includes("capacity")) {
        friendlyErr = "Kuota ekstrakurikuler sudah penuh.";
      } else if (rawErrMsg.includes("inactive")) {
        friendlyErr = "Ekstrakurikuler tidak tersedia.";
      }

      setModalError(friendlyErr);
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  // Handle Immediate Leave Submission
  const handleConfirmLeave = async () => {
    if (!data?.id) return;
    setIsSubmittingLeave(true);
    setModalError("");

    try {
      const res = await extracurricularService.leaveExtracurricular(data.id);

      if (res && res.success) {
        setIsConfirmLeaveOpen(false);
        showToastNotification("Berhasil keluar dari ekstrakurikuler.", "success");
        // Real-time update without browser reload
        await refetch();
      } else {
        const rawMsg = res?.message || "";
        let friendlyErr = "Gagal keluar dari ekstrakurikuler. Silakan coba lagi.";
        if (res?.statusCode === 403 || rawMsg.includes("Only students")) {
          friendlyErr = "Hanya siswa yang dapat mengelola keanggotaan ekstrakurikuler.";
        } else if (rawMsg.includes("not found") || rawMsg.includes("not member")) {
          friendlyErr = "Anda bukan anggota ekstrakurikuler ini.";
        }
        setModalError(friendlyErr);
      }
    } catch (err) {
      const status = err?.statusCode || err?.response?.status;
      const rawErrMsg = err?.response?.data?.message || err?.message || "";

      if (status === 401 || rawErrMsg.includes("Unauthorized")) {
        setIsConfirmLeaveOpen(false);
        router.push(`/login?returnUrl=/ekstrakurikuler/${slug}`);
        return;
      }

      let friendlyErr = "Gagal keluar dari ekstrakurikuler. Silakan coba lagi.";
      if (status === 403 || rawErrMsg.includes("Only students")) {
        friendlyErr = "Hanya siswa yang dapat mengelola keanggotaan ekstrakurikuler.";
      } else if (rawErrMsg.includes("not found") || rawErrMsg.includes("Membership not found")) {
        friendlyErr = "Anda bukan anggota ekstrakurikuler ini.";
      }
      setModalError(friendlyErr);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const btnConfig = getJoinButtonConfig();

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      <Navbar />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-24 right-5 z-50 animate-bounce-in">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold ${
              toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20"
                : "bg-rose-600 text-white border-rose-500 shadow-rose-600/20"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        {/* Back Link & Edit Action Bar */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/ekstrakurikuler"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#2c1ee8] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Daftar Ekstrakurikuler</span>
          </Link>

          {canEditExtracurricular && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Ekstrakurikuler</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded-lg mx-auto mb-4" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg mx-auto" />
          </div>
        ) : !data ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-lg font-bold text-gray-800">Ekstrakurikuler tidak ditemukan</p>
            <p className="mt-1 text-xs text-gray-500">
              {fetchError || "Data ekstrakurikuler yang dicari tidak ditemukan."}
            </p>
            <Link
              href="/ekstrakurikuler"
              className="mt-4 inline-block rounded-xl bg-[#2c1ee8] px-5 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              Kembali ke Daftar
            </Link>
          </div>
        ) : (
          /* Detail Card Container */
          <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
            {/* Layout Grid: Desktop 2 Kolom */}
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Kolom Kiri: Card Foto */}
              <div className="lg:col-span-5 w-full">
                <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-gray-200 bg-slate-100 flex flex-col items-center justify-center text-center shadow-xs">
                  {data.imageUrl ? (
                    <img
                      src={resolveImageUrl(data.imageUrl)}
                      alt={data.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(44,30,232,0.06),transparent_70%)] pointer-events-none" />
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/90 text-[#2c1ee8] shadow-md border border-blue-100/80 mb-4 relative z-10">
                        <svg
                          className="h-10 w-10"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <span className="rounded-xl bg-white/80 px-4 py-2 text-xs font-bold text-gray-500 border border-gray-200 shadow-2xs backdrop-blur-xs relative z-10">
                        Foto belum tersedia
                      </span>
                      <p className="mt-2 text-[11px] text-gray-400 max-w-[200px] relative z-10">
                        Foto resmi kegiatan {data.name} akan segera diunggah.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Informasi Ekstrakurikuler */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {/* Badge Kategori */}
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2c1ee8]">
                      {data.category}
                    </div>

                    {/* Status Badge Handling for Student */}
                    {isStudentRole && isJoined && (
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-extrabold text-emerald-800 animate-fade-in shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Anggota Aktif</span>
                      </div>
                    )}
                  </div>

                  {/* Nama Ekstrakurikuler */}
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                    {data.name}
                  </h1>

                  {/* Deskripsi */}
                  <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
                    {data.description}
                  </p>

                  {/* Info Jadwal Latihan */}
                  <div className="mt-6 rounded-2xl border border-gray-200/80 bg-slate-50/80 p-5 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-[#2c1ee8]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Jadwal Latihan
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div className="rounded-xl bg-white p-3 border border-gray-200/60 shadow-2xs">
                        <span className="block text-xs text-gray-400 font-medium">Hari</span>
                        <span className="block text-sm font-extrabold text-gray-900 mt-0.5">
                          {data.schedule.day}
                        </span>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-gray-200/60 shadow-2xs">
                        <span className="block text-xs text-gray-400 font-medium">Waktu</span>
                        <span className="block text-sm font-extrabold text-gray-900 mt-0.5">
                          {data.schedule.time}
                        </span>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-gray-200/60 shadow-2xs">
                        <span className="block text-xs text-gray-400 font-medium">Tempat</span>
                        <span
                          className="block text-sm font-extrabold text-gray-900 mt-0.5 truncate"
                          title={data.schedule.location}
                        >
                          {data.schedule.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informasi Maksimal Anggota */}
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-[#f8faff] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#2c1ee8]">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 font-medium">
                          Kapasitas Member
                        </span>
                        <span className="block text-base font-extrabold text-[#2c1ee8]">
                          {currentMembers} / {maxMembers} Siswa
                        </span>
                      </div>
                    </div>

                    {data.instructor && (
                      <div className="text-right">
                        <span className="block text-xs text-gray-400 font-medium">Pembina</span>
                        <span className="block text-sm font-bold text-gray-800">
                          {data.instructor}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Area strictly based on User Role */}
                <div className="pt-4 space-y-3">
                  {isTeacherRole ? (
                    /* Teacher Role Informational Card */
                    <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-3">
                      <div className="flex items-center gap-2.5 text-amber-800 text-xs font-bold">
                        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Akses Akun Guru / Pembina</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed font-medium">
                        Anda masuk sebagai <strong>Pembina/Guru</strong>. Guru tidak dapat menjadi anggota ekstrakurikuler.
                      </p>

                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        {canEditExtracurricular && (
                          <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit Informasi & Cover</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => router.push("/guru")}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-[#2c1ee8] hover:text-[#2c1ee8] transition-all cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span>Kelola Anggota</span>
                        </button>
                      </div>
                    </div>
                  ) : isAdminRole ? (
                    /* Admin Role Informational Card */
                    <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-3">
                      <div className="flex items-center gap-2.5 text-[#2c1ee8] text-xs font-bold">
                        <ShieldAlert className="w-4 h-4 text-[#2c1ee8] flex-shrink-0" />
                        <span>Akses Akun Administrator</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium">
                        Anda masuk sebagai <strong>Admin</strong>. Admin tidak dapat menjadi anggota ekstrakurikuler.
                      </p>

                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        {canEditExtracurricular && (
                          <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit Informasi & Cover</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => router.push("/admin")}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2c1ee8] hover:bg-[#2218a3] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span>Lihat Data Anggota</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Student / Student-OSIS Role Action Buttons */
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Primary Status/Join Button */}
                        <button
                          type="button"
                          onClick={btnConfig.onClick}
                          disabled={btnConfig.disabled}
                          className={`rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${btnConfig.className}`}
                        >
                          {isSubmittingJoin && <Loader2 className="w-4 h-4 animate-spin" />}
                          <span>{btnConfig.label}</span>
                        </button>

                        {/* Secondary Button: "Keluar dari Ekstrakurikuler" for Active Members */}
                        {isJoined && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalError("");
                              setIsConfirmLeaveOpen(true);
                            }}
                            disabled={isSubmittingLeave}
                            className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-[#2c1ee8]/10 hover:bg-rose-50 hover:text-rose-700 text-[#2c1ee8] font-bold text-sm border border-[#2c1ee8]/20 hover:border-rose-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Keluar dari Ekstrakurikuler</span>
                          </button>
                        )}

                        {/* Hubungi Pembina Link */}
                        <a
                          href="https://wa.me/6282322377070"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white border border-gray-200 px-6 py-4 text-sm font-bold text-gray-700 hover:border-[#2c1ee8] hover:text-[#2c1ee8] transition-all duration-200"
                        >
                          {/* WhatsApp SVG Icon */}
                          <svg className="w-5 h-5 fill-current text-emerald-600" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.002 3.661 3.745-.985z" />
                          </svg>
                          <span>Hubungi Pembina</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Join Confirmation Modal */}
      <JoinExtracurricularModal
        isOpen={isConfirmJoinOpen}
        onClose={() => !isSubmittingJoin && setIsConfirmJoinOpen(false)}
        onConfirm={handleConfirmJoin}
        extracurricularName={data?.name || ""}
        isSubmitting={isSubmittingJoin}
        errorMessage={modalError}
      />

      {/* Immediate Leave Confirmation Modal */}
      <LeaveExtracurricularModal
        isOpen={isConfirmLeaveOpen}
        onClose={() => !isSubmittingLeave && setIsConfirmLeaveOpen(false)}
        onConfirm={handleConfirmLeave}
        extracurricularName={data?.name || ""}
        isSubmitting={isSubmittingLeave}
        errorMessage={modalError}
      />

      {/* Edit Extracurricular Modal for Pembimbing & Admin */}
      {canEditExtracurricular && (
        <CreateExtracurricularModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingItem={data}
          onSuccess={async () => {
            setIsEditModalOpen(false);
            showToastNotification("Informasi ekstrakurikuler berhasil diperbarui!", "success");
            await refetch();
          }}
        />
      )}

      <Footer />
    </div>
  );
}
