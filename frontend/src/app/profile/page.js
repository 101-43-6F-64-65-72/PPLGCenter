"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import useAuth from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/userRoles";
import { Shield, LogOut, User, Lock, Mail, Phone, MapPin, CheckCircle, AlertCircle, Camera } from "@/components/common/Icons";
import { GraduationCap, BookOpen, Award, Hash } from "lucide-react";
import Button from "@/components/ui/Button";
import profileService from "@/services/profileService";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
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

  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Auto upload to Cloudinary immediately upon file selection
    setIsUploadingAvatar(true);
    setStatusMessage({ type: "info", text: "Mengunggah foto profil ke Cloudinary..." });
    try {
      const { uploadImageToCloudinary } = await import("@/services/cloudinaryService");
      const uploadedUrl = await uploadImageToCloudinary(file);
      if (uploadedUrl) {
        setAvatarPreview(uploadedUrl);
        // Automatically save uploaded photoUrl to database user profile
        let roleNum = 2;
        if (role === "Admin" || user?.role === "Admin") roleNum = 0;
        else if (role === "Teacher" || user?.role === "Teacher") roleNum = 1;
        else if (role === "OSIS" || user?.role === "OSIS") roleNum = 3;

        const payload = {
          fullName: user?.fullName || fullName,
          email: user?.email || email,
          phoneNumber: phone || null,
          address: address || null,
          photoUrl: uploadedUrl,
          role: roleNum,
        };

        const res = await profileService.updateProfile(user.id, payload);
        if (res?.success || res?.data) {
          setStatusMessage({ type: "success", text: "✓ Foto profil berhasil diunggah dan disimpan!" });
          await fetchProfile();
        } else {
          setStatusMessage({ type: "error", text: "Foto diunggah tapi gagal disimpan ke database." });
        }
      } else {
        setStatusMessage({ type: "error", text: "Gagal mengunggah foto ke Cloudinary." });
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

      let roleNum = 2; // Student
      if (role === "Admin" || user?.role === "Admin") roleNum = 0;
      else if (role === "Teacher" || user?.role === "Teacher") roleNum = 1;
      else if (role === "OSIS" || user?.role === "OSIS") roleNum = 3;

      const payload = {
        fullName,
        email,
        phoneNumber: phone || null,
        address: address || null,
        photoUrl: avatarPreview && avatarPreview.startsWith("http") ? avatarPreview : (user?.photoUrl || null),
        role: roleNum,
      };

      // Send update request directly to backend database via PUT /api/users/{id}
      const res = await profileService.updateProfile(user.id, payload);

      if (res?.success || res?.data) {
        setStatusMessage({
          type: "success",
          text: "✓ Data profil berhasil diperbarui!",
        });
        setIsEditingInfo(false);
        await fetchProfile();
      } else {
        setStatusMessage({
          type: "error",
          text: res?.message || "Gagal memperbarui profil di server database.",
        });
      }
    } catch (err) {
      console.error("Gagal memperbarui profil ke database:", err);
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Gagal menyimpan perubahan ke database.",
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
      if (!user?.id) {
        setStatusMessage({ type: "error", text: "ID Pengguna tidak ditemukan." });
        setIsSaving(false);
        return;
      }

      let roleNum = 2;
      if (role === "Admin" || user?.role === "Admin") roleNum = 0;
      else if (role === "Teacher" || user?.role === "Teacher") roleNum = 1;
      else if (role === "OSIS" || user?.role === "OSIS") roleNum = 3;

      const payload = {
        fullName: user?.fullName || fullName,
        email: user?.email || email,
        password: newPassword,
        role: roleNum,
      };

      const res = await profileService.updateProfile(user.id, payload);

      if (res?.success || res?.data) {
        setStatusMessage({
          type: "success",
          text: "✓ Password berhasil diperbarui di database backend!",
        });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        await fetchProfile();
      } else {
        setStatusMessage({
          type: "error",
          text: res?.message || "Gagal memperbarui password di database.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Gagal memperbarui password di server database.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Header Card */}
      <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
        <div className="relative h-56 sm:h-60 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-between px-8 text-white">
          <div className="space-y-2 z-10">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight opacity-90">STUDENT CENTER SMKN 2 SURAKARTA</h2>
            <p className="text-xs sm:text-sm font-medium text-blue-200/80">Sistem Informasi Kesiswaan, Akademik & Ekstrakurikuler Terpadu</p>
          </div>
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-5">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-indigo-50 shadow-md sm:h-32 sm:w-32 group">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar profile" fill className="object-cover" unoptimized />
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
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-200">Cloudinary</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-2 right-2 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-white text-[#2C1EE8] shadow-lg transition hover:scale-105 hover:bg-[#2C1EE8] hover:text-white cursor-pointer disabled:opacity-50"
                  aria-label="Ubah foto profil"
                  title="Ubah foto profil"
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4.5 w-4.5" />
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

              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {savedName}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-[#2C1EE8]">
                    <Shield className="h-3.5 w-3.5" />
                    {roleLabel}
                  </span>
                  {Array.isArray(advisorFor) && advisorFor.map((ekskul) => (
                    <span
                      key={ekskul.id || ekskul.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-extrabold text-emerald-800"
                    >
                      <Award className="h-3.5 w-3.5 text-emerald-600" />
                      Pembina {ekskul.name}
                    </span>
                  ))}
                  {Array.isArray(memberships) && memberships.map((ekskul) => (
                    <span
                      key={ekskul.extracurricularId || ekskul.id || ekskul.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-extrabold text-purple-800"
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-purple-600" />
                      Anggota {ekskul.name}
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-sm font-medium text-gray-500 sm:text-base">
                  ID Akun: <span className="font-semibold text-gray-900 font-mono">{savedEmail}</span>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={logout}
              leftIcon={<LogOut className="h-4 w-4" />}
              className="border-red-200! text-red-600! hover:bg-red-50! hover:border-red-300!"
            >
              Keluar Sesi
            </Button>
          </div>
        </div>
      </div>

      {/* Academic / Institutional Info Panel */}
      <AcademicInfoCard user={user} isStudent={isStudent} isTeacher={isTeacher} isAdmin={isAdmin} />

      {/* Main Profile Form Card */}
      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        {/* Navigation Sub-Tabs & Edit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "info"
                  ? "bg-[#2C1EE8] text-white shadow-md shadow-blue-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Informasi Profil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "password"
                  ? "bg-[#2C1EE8] text-white shadow-md shadow-blue-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Ubah Password
            </button>
          </div>

          {activeTab === "info" && !isEditingInfo && (
            <button
              type="button"
              onClick={() => setIsEditingInfo(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-indigo-200 bg-indigo-50 text-[#2C1EE8] hover:bg-indigo-100 transition cursor-pointer self-start sm:self-auto"
            >
              <User className="w-4 h-4" />
              <span>Edit Informasi Profil</span>
            </button>
          )}
        </div>

        {/* Status Toast Alert */}
        {statusMessage.text && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : statusMessage.type === "info"
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600" />
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

        {/* Tab 1: Informasi Profil */}
        {activeTab === "info" && (
          !isEditingInfo ? (
            /* READ-ONLY DISPLAY MODE */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Nama Lengkap</span>
                  <p className="text-base font-extrabold text-gray-900">{fullName || savedName}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Email / Identitas Akun</span>
                  <p className="text-base font-extrabold text-gray-900 font-mono">{email || savedEmail}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Nomor Telepon / WA</span>
                  <p className="text-base font-extrabold text-gray-900 font-mono">{phone || "Belum diisi"}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Alamat Domisili</span>
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed">{address || "Belum diisi"}</p>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT FORM MODE */
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
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
                  <User className={`w-4 h-4 absolute left-3.5 top-3.5 ${!isAdmin ? "text-slate-400" : "text-gray-400"}`} />
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm shadow-2xs outline-none transition ${
                      !isAdmin
                        ? "bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed select-none font-medium"
                        : "bg-white text-gray-900 border-gray-200 focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
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
                  <Mail className={`w-4 h-4 absolute left-3.5 top-3.5 ${!isAdmin ? "text-slate-400" : "text-gray-400"}`} />
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email atau NIS/NIP"
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm shadow-2xs outline-none transition ${
                      !isAdmin
                        ? "bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed select-none font-medium"
                        : "bg-white text-gray-900 border-gray-200 focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 082322377070"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Alamat Tempat Tinggal
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows="3"
                    placeholder="Masukkan alamat domisili Anda"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2C1EE8] px-8 py-3 text-sm font-semibold text-white shadow-md shadow-[#2C1EE8]/20 transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
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
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Password Saat Ini *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Password Baru *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Konfirmasi Password Baru *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru Anda"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-2xs outline-none transition focus:border-[#2C1EE8] focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2C1EE8] px-8 py-3 text-sm font-semibold text-white shadow-md shadow-[#2C1EE8]/20 transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
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
    if (user.nis)  items.push({ icon: Hash,         label: "NIS",     value: user.nis });
    if (user.nisn) items.push({ icon: Hash,         label: "NISN",    value: user.nisn });
    if (user.className) items.push({ icon: GraduationCap, label: "Kelas", value: user.className });
    if (user.departmentName) items.push({ icon: BookOpen,    label: "Jurusan", value: user.departmentName });
  } else if (isTeacher) {
    if (user.nip)      items.push({ icon: Hash,      label: "NIP",     value: user.nip });
    if (user.position) items.push({ icon: Award,     label: "Jabatan", value: user.position });
  } else if (isAdmin) {
    items.push({ icon: Shield, label: "Hak Akses", value: "Super Admin / Waka Kesiswaan" });
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
      <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Informasi Akademik</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((item) => {
          const IconComp = item.icon;
          return (
            <div key={item.label} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-gray-400">
                <IconComp className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </div>
              <span className="text-sm font-black text-gray-900 font-mono tracking-wide truncate">
                {item.value || "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}