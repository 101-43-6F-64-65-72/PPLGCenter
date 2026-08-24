"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import useAuth from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/userRoles";
import { Shield, LogOut, User, Lock, Mail, Phone, MapPin, CheckCircle, AlertCircle, Camera } from "@/components/common/Icons";
import { GraduationCap, BookOpen, Award, Hash, KeyRound } from "lucide-react";
import Button from "@/components/ui/Button";
import profileService from "@/services/profileService";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import { resolveImageUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "@/lib/motion";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
        <Navbar />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-8 font-sans">
          <ProfileContent />
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, role, memberships, advisorFor, logout, fetchProfile, loading } = useAuth();
  const fileInputRef = useRef(null);

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  // Active sub-tab state ('info' | 'password')
  const [activeTab, setActiveTab] = useState("info");
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Profile Form States
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Password Change States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status Notification Feedback
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync state automatically with authenticated user context
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || "");
      setEmail(user.email || user.identifier || "");
      setPhone(user.phone || user.phoneNumber || "");
      setAddress(user.address || "");
      if (user.photoUrl || user.avatar) {
        setAvatarPreview(user.photoUrl || user.avatar);
      }
    }
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Saved profile header display values (from context)
  const savedName = user?.fullName || user?.name || "Pengguna Student Center";
  const savedEmail = user?.email || user?.identifier || "-";
  const roleLabel = ROLE_LABELS[role] || role || "Siswa Biasa";
  const isAdmin = role === "Admin" || user?.role === "Admin";
  const isTeacher = role === "Teacher" || user?.role === "Teacher";
  const isStudent = !isAdmin && !isTeacher;

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError(false);
    setAvatarPreview(URL.createObjectURL(file));
    setIsUploadingAvatar(true);
    setStatusMessage({ type: "info", text: "Mengunggah foto profil..." });
    try {
      const { uploadImageToCloudinary } = await import("@/services/cloudinaryService");
      const uploadedUrl = await uploadImageToCloudinary(file);
      if (uploadedUrl) {
        setAvatarPreview(uploadedUrl);
        let roleNum = 2;
        if (role === "Admin" || user?.role === "Admin" || user?.role === 0) roleNum = 0;
        else if (role === "Teacher" || user?.role === "Teacher" || user?.role === 1) roleNum = 1;

        const payload = {
          fullName: user?.fullName || fullName,
          email: user?.email || email,
          phoneNumber: phone || user?.phoneNumber || null,
          address: address || user?.address || null,
          photoUrl: uploadedUrl,
          role: roleNum,
        };

        const res = await profileService.updateProfile(user.id, payload);
        if (res?.success || res?.data) {
          setStatusMessage({ type: "success", text: "Foto profil berhasil diunggah dan disimpan!" });
          await fetchProfile();
        } else {
          setStatusMessage({ type: "error", text: "Foto diunggah tapi gagal disimpan. Silakan coba lagi." });
        }
      } else {
        setStatusMessage({ type: "error", text: "Gagal mengunggah foto profil." });
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setStatusMessage({ type: "error", text: "Gagal mengunggah foto profil." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage({ type: "", text: "" });

    try {
      if (!user?.id) {
        setStatusMessage({ type: "error", text: "ID Pengguna tidak ditemukan." });
        setIsSaving(false);
        return;
      }

      let roleNum = 2;
      if (role === "Admin" || user?.role === "Admin" || user?.role === 0) roleNum = 0;
      else if (role === "Teacher" || user?.role === "Teacher" || user?.role === 1) roleNum = 1;

      const payload = {
        fullName,
        email,
        phoneNumber: phone || null,
        address: address || null,
        photoUrl: avatarPreview || user?.photoUrl || null,
        role: roleNum,
      };

      const res = await profileService.updateProfile(user.id, payload);

      if (res?.success || res?.data) {
        setStatusMessage({ type: "success", text: "Profil berhasil diperbarui!" });
        setIsEditingInfo(false);
        await fetchProfile();
      } else {
        setStatusMessage({
          type: "error",
          text: res?.message || "Gagal memperbarui profil. Silakan coba lagi.",
        });
      }
    } catch (err) {
      console.error("Gagal memperbarui profil:", err);
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Gagal menyimpan perubahan. Silakan coba lagi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage({ type: "", text: "" });

    if (newPassword.length < 6) {
      setStatusMessage({ type: "error", text: "Password baru minimal 6 karakter." });
      setIsSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: "error", text: "Konfirmasi password baru tidak cocok." });
      setIsSaving(false);
      return;
    }

    try {
      let roleNum = 2;
      if (role === "Admin" || user?.role === "Admin" || user?.role === 0) roleNum = 0;
      else if (role === "Teacher" || user?.role === "Teacher" || user?.role === 1) roleNum = 1;

      const payload = {
        fullName: user?.fullName || fullName,
        email: user?.email || email,
        password: newPassword,
        phoneNumber: phone || user?.phoneNumber || null,
        address: address || user?.address || null,
        photoUrl: avatarPreview || user?.photoUrl || null,
        role: roleNum,
      };

      const res = await profileService.updateProfile(user.id, payload);

      if (res?.success || res?.data) {
        setStatusMessage({
          type: "success",
          text: "Password berhasil diperbarui!",
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("sc_must_change_password");
        }
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        await fetchProfile();
      } else {
        setStatusMessage({
          type: "error",
          text: res?.message || "Gagal memperbarui password.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Gagal memperbarui password. Silakan coba lagi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Banner Hero Header Card */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#2C1EE8] via-indigo-700 to-[#1e0873] p-6 sm:p-10 text-white shadow-xl shadow-blue-900/15">
        {/* Ambient lighting glow overlays */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-400/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-white/10 flex items-center justify-center">
                {(avatarPreview || user?.photoUrl) && !imageError ? (
                  <img
                    src={resolveImageUrl(avatarPreview || user?.photoUrl)}
                    alt={savedName}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-3xl font-bold text-[#2C1EE8] sm:text-4xl">
                    {savedName.charAt(0).toUpperCase() || "U"}
                  </div>
                )}

                {isUploadingAvatar && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[2px] text-white rounded-full transition-all animate-pulse">
                    <svg className="animate-spin h-6 w-6 text-white mb-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-200">Profil</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-1.5 right-1.5 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-white text-[#2C1EE8] shadow-lg transition hover:scale-110 hover:bg-[#2C1EE8] hover:text-white cursor-pointer disabled:opacity-50"
                  aria-label="Ubah foto profil"
                  title="Ubah foto profil"
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {savedName}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md shadow-2xs">
                  <Shield className="h-3.5 w-3.5 text-blue-200" />
                  {roleLabel}
                </span>
                {/* Student: class badge */}
                {isStudent && user?.className && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-sky-500/20 px-3.5 py-1 text-xs font-bold text-sky-100 backdrop-blur-md">
                    <GraduationCap className="h-3.5 w-3.5 text-sky-300" />
                    {user.className}
                  </span>
                )}
                {/* Teacher: NIP badge */}
                {isTeacher && user?.nip && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/40 bg-teal-500/20 px-3.5 py-1 text-xs font-bold text-teal-100 backdrop-blur-md">
                    <Hash className="h-3.5 w-3.5 text-teal-300" />
                    NIP {user.nip}
                  </span>
                )}
                {Array.isArray(advisorFor) && advisorFor.map((ekskul) => (
                  <span
                    key={ekskul.id || ekskul.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-100 backdrop-blur-md"
                  >
                    <Award className="h-3.5 w-3.5 text-emerald-300" />
                    Pembina {ekskul.name}
                  </span>
                ))}
                {Array.isArray(memberships) && memberships.map((ekskul) => (
                  <span
                    key={ekskul.extracurricularId || ekskul.id || ekskul.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-purple-300/40 bg-purple-500/20 px-3.5 py-1 text-xs font-bold text-purple-100 backdrop-blur-md"
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-purple-300" />
                    Anggota {ekskul.name}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-sm font-medium text-blue-100 sm:text-base">
                ID Akun: <span className="font-extrabold text-white">{savedEmail}</span>
              </p>
              {/* Student: department subtitle */}
              {isStudent && user?.departmentName && (
                <p className="mt-1 text-xs text-blue-200 font-medium">
                  <BookOpen className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  {user.departmentName}
                </p>
              )}
              {/* Teacher: position subtitle */}
              {isTeacher && user?.position && (
                <p className="mt-1 text-xs text-teal-200 font-medium">
                  <Award className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  {user.position}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={logout}
            leftIcon={<LogOut className="h-4 w-4" />}
            className="border-white/30 text-white hover:bg-white/15 bg-white/10 backdrop-blur-md transition-all font-bold"
          >
            Keluar Sesi
          </Button>
        </div>
      </div>

      {/* Academic / Institutional Info Panel */}
      <AcademicInfoCard user={user} isStudent={isStudent} isTeacher={isTeacher} isAdmin={isAdmin} />

      {/* Main Profile Form Card */}
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 font-sans">
        {/* Navigation Sub-Tabs & Edit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${activeTab === "info"
                ? "bg-[#2C1EE8] text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              <User className="w-4 h-4" />
              <span>Informasi Profil</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${activeTab === "password"
                ? "bg-[#2C1EE8] text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Ubah Password</span>
            </button>
          </div>

          {activeTab === "info" && !isEditingInfo && (
            <button
              type="button"
              onClick={() => setIsEditingInfo(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold border border-indigo-200 bg-indigo-50/80 text-[#2C1EE8] hover:bg-indigo-100 transition cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <User className="w-4 h-4" />
              <span>Edit Informasi Profil</span>
            </button>
          )}
        </div>

        {/* Status Toast Alert */}
        <AnimatePresence>
          {statusMessage.text && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-6 p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : statusMessage.type === "info"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
            >
              <div className="flex items-center gap-2.5">
                {statusMessage.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage({ type: "", text: "" })}
                className="text-xs opacity-60 hover:opacity-100 font-bold px-2 py-1"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: Informasi Profil */}
        {activeTab === "info" && (
          !isEditingInfo ? (
            /* READ-ONLY DISPLAY MODE */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Nama Lengkap</span>
                  <p className="text-base font-extrabold text-slate-900">{fullName || savedName}</p>
                </div>

                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Email / Identitas Akun</span>
                  <p className="text-base font-extrabold text-slate-900">{email || savedEmail}</p>
                </div>

                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Nomor Telepon / WA</span>
                  <p className="text-base font-extrabold text-slate-900">{phone || "Belum diisi"}</p>
                </div>

                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Alamat Domisili</span>
                  <p className="text-sm font-extrabold text-slate-800 leading-relaxed">{address || "Belum diisi"}</p>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT FORM MODE */
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Nama Lengkap *
                  </label>
                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Dikunci Otoritas Sekolah</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3.5 top-3.5 ${!isAdmin ? "text-slate-400" : "text-slate-400"}`} />
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm font-semibold shadow-2xs outline-none transition ${!isAdmin
                      ? "bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed select-none"
                      : "bg-white text-slate-900 border-slate-200 focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Email / NIS / NIP *
                  </label>
                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Dikunci Otoritas Sekolah</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3.5 top-3.5 ${!isAdmin ? "text-slate-400" : "text-slate-400"}`} />
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email atau NIS/NIP"
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm font-semibold shadow-2xs outline-none transition ${!isAdmin
                      ? "bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed select-none"
                      : "bg-white text-slate-900 border-slate-200 focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 082322377070"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Alamat Tempat Tinggal
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows="3"
                    placeholder="Masukkan alamat domisili Anda"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2C1EE8] px-8 py-3 text-sm font-bold text-white shadow-md shadow-[#2C1EE8]/20 transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    "Simpan Perubahan Profil"
                  )}
                </button>
              </div>
            </form>
          )
        )}

        {/* Tab 2: Ubah Password Form */}
        {activeTab === "password" && (
          <form onSubmit={handleChangePassword} className="space-y-5 font-sans">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Password Saat Ini *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Password Baru *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Konfirmasi Password Baru *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru Anda"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2C1EE8] px-8 py-3 text-sm font-bold text-white shadow-md shadow-[#2C1EE8]/20 transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memperbarui Password...</span>
                </>
              ) : (
                "Perbarui Password Akun"
              )}
            </button>
          </form>
        )}
      </div>

      {/* Manual Guide Settings Card at the bottom of Profile */}
      <ManualGuideSettingsCard />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Academic / Institutional Info Card
// ─────────────────────────────────────────────────────────────────────────────
function AcademicInfoCard({ user, isStudent, isTeacher, isAdmin }) {
  if (!user) return null;

  const items = [];

  if (isStudent) {
    if (user.nis) items.push({ icon: Hash, label: "NIS", value: user.nis });
    if (user.nisn) items.push({ icon: Hash, label: "NISN", value: user.nisn });
    if (user.className) items.push({ icon: GraduationCap, label: "Kelas", value: user.className });
    if (user.departmentName) items.push({ icon: BookOpen, label: "Jurusan", value: user.departmentName });
  } else if (isTeacher) {
    if (user.nip) items.push({ icon: Hash, label: "NIP", value: user.nip });
    if (user.position) items.push({ icon: Award, label: "Jabatan", value: user.position });
  } else if (isAdmin) {
    items.push({ icon: Shield, label: "Hak Akses", value: "Super Admin / Waka Kesiswaan" });
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs font-sans">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Akademik</h2>
      <div className="flex flex-wrap gap-4">
        {items.map((item) => {
          const IconComp = item.icon;
          return (
            <div key={item.label} className="flex-1 min-w-[200px] flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-400">
                <IconComp className="w-3.5 h-3.5 text-[#2C1EE8]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{item.label}</span>
              </div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                {item.value || "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual Guide Settings Card (Positioned at the very bottom of Profile Page)
// ─────────────────────────────────────────────────────────────────────────────
function ManualGuideSettingsCard() {
  const handleStartGuide = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:start-manual-guide"));
    }
  };

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Panduan Manual Replyz
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pelajari alur dan fitur utama PPLG Center kapan saja.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartGuide}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#2C1EE8] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
        >
          Buka Panduan Manual
        </button>
      </div>
    </div>
  );
}
