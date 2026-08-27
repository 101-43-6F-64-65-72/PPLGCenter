"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import useAuth from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/userRoles";
import { Shield, LogOut, User, Lock, Mail, Phone, MapPin, CheckCircle, AlertCircle, Camera } from "@/components/common/Icons";
import { GraduationCap, BookOpen, Award, Hash, KeyRound, Bell } from "lucide-react";
import Button from "@/components/ui/Button";
import profileService from "@/services/profileService";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import NotificationEmailSection from "@/components/profile/NotificationEmailSection";
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
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-none p-5 sm:p-7 shadow-xs text-slate-900 text-left space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative group shrink-0">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-none overflow-hidden border border-slate-200 shadow-xs bg-slate-100 flex items-center justify-center">
                {(avatarPreview || user?.photoUrl) && !imageError ? (
                  <img
                    src={resolveImageUrl(avatarPreview || user?.photoUrl)}
                    alt={savedName}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-50 text-2xl font-bold text-[#2C1EE8] sm:text-3xl">
                    {savedName.charAt(0).toUpperCase() || "U"}
                  </div>
                )}

                {isUploadingAvatar && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white rounded-none transition-all">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                    <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-white">Upload...</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 z-30 flex h-7 w-7 items-center justify-center rounded-none border border-slate-200 bg-white text-[#2C1EE8] shadow-xs transition hover:bg-[#2C1EE8] hover:text-white cursor-pointer disabled:opacity-50"
                  aria-label="Ubah foto profil"
                  title="Ubah foto profil"
                >
                  {isUploadingAvatar ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
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

            <div className="flex flex-col items-center text-center sm:items-start sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-slate-900">
                  {savedName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-none border border-blue-200 bg-blue-50 px-2 py-0.2 text-[10px] font-bold font-mono uppercase text-[#2C1EE8]">
                  <Shield className="h-3 w-3 text-[#2C1EE8]" />
                  {roleLabel}
                </span>
                {/* Student: class badge */}
                {isStudent && user?.className && (
                  <span className="inline-flex items-center gap-1 rounded-none border border-slate-200 bg-slate-100 px-2 py-0.2 text-[10px] font-bold font-mono uppercase text-slate-700">
                    <GraduationCap className="h-3 w-3 text-slate-600" />
                    {user.className}
                  </span>
                )}
                {/* Teacher: NIP badge */}
                {isTeacher && user?.nip && (
                  <span className="inline-flex items-center gap-1 rounded-none border border-teal-200 bg-teal-50 px-2 py-0.2 text-[10px] font-bold font-mono uppercase text-teal-800">
                    <Hash className="h-3 w-3 text-teal-700" />
                    NIP {user.nip}
                  </span>
                )}
                {Array.isArray(advisorFor) && advisorFor.map((ekskul) => (
                  <span
                    key={ekskul.id || ekskul.name}
                    className="inline-flex items-center gap-1 rounded-none border border-emerald-200 bg-emerald-50 px-2 py-0.2 text-[10px] font-bold font-mono uppercase text-emerald-800"
                  >
                    <Award className="h-3 w-3 text-emerald-700" />
                    Pembina {ekskul.name}
                  </span>
                ))}
                {Array.isArray(memberships) && memberships.map((ekskul) => (
                  <span
                    key={ekskul.extracurricularId || ekskul.id || ekskul.name}
                    className="inline-flex items-center gap-1 rounded-none border border-purple-200 bg-purple-50 px-2 py-0.2 text-[10px] font-bold font-mono uppercase text-purple-800"
                  >
                    <GraduationCap className="h-3 w-3 text-purple-700" />
                    Anggota {ekskul.name}
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-500 font-medium">
                ID Akun: <span className="font-bold text-slate-800 font-mono">{savedEmail}</span>
              </p>
              {/* Student: department subtitle */}
              {isStudent && user?.departmentName && (
                <p className="text-[11px] text-slate-500 font-normal">
                  <BookOpen className="inline w-3 h-3 mr-1 -mt-0.5" />
                  {user.departmentName}
                </p>
              )}
              {/* Teacher: position subtitle */}
              {isTeacher && user?.position && (
                <p className="text-[11px] text-slate-500 font-normal">
                  <Award className="inline w-3 h-3 mr-1 -mt-0.5" />
                  {user.position}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
          >
            Keluar Sesi
          </Button>
        </div>
      </div>

      {/* Academic / Institutional Info Panel */}
      <AcademicInfoCard user={user} isStudent={isStudent} isTeacher={isTeacher} isAdmin={isAdmin} />

      {/* Main Profile Form Card */}
      <div className="rounded-none border border-slate-200 bg-white p-5 sm:p-6 shadow-xs font-sans text-left">
        {/* Navigation Sub-Tabs & Edit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${activeTab === "info"
                ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Informasi Profil</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notification")}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${activeTab === "notification"
                ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Email Notifikasi</span>
              {user?.emailNotif && (user?.emailVerifiedAt || user?.isEmailNotifVerified) && (
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${activeTab === "password"
                ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ubah Password</span>
            </button>
          </div>

          {activeTab === "info" && !isEditingInfo && (
            <button
              type="button"
              onClick={() => setIsEditingInfo(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none text-xs font-bold uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <User className="w-3.5 h-3.5 text-[#2C1EE8]" />
              <span>Edit Profil</span>
            </button>
          )}
        </div>

        {/* Status Toast Alert */}
        <AnimatePresence>
          {statusMessage.text && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`mb-4 p-3 rounded-none border text-xs font-semibold flex items-center justify-between transition-colors ${statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : statusMessage.type === "info"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage({ type: "", text: "" })}
                className="text-xs opacity-60 hover:opacity-100 font-bold px-1.5 cursor-pointer"
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-none bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Nama Lengkap</span>
                  <p className="text-sm font-bold text-slate-900 uppercase">{fullName || savedName}</p>
                </div>

                <div className="p-3.5 rounded-none bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Email / Identitas Akun</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">{email || savedEmail}</p>
                </div>

                <div className="p-3.5 rounded-none bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Nomor Telepon / WA</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">{phone || "Belum diisi"}</p>
                </div>

                <div className="p-3.5 rounded-none bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Alamat Domisili</span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">{address || "Belum diisi"}</p>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT FORM MODE */
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider text-slate-700">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase text-amber-700 bg-amber-50 px-2 py-0.2 rounded-none border border-amber-200">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Terkunci</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className={`w-full rounded-none border py-2.5 pl-9 pr-3 text-xs sm:text-sm font-semibold outline-none transition-colors ${!isAdmin
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none"
                      : "bg-white text-slate-900 border-slate-200 focus:border-[#2C1EE8]"
                      }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider text-slate-700">
                    Email / NIS / NIP <span className="text-rose-500">*</span>
                  </label>
                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase text-amber-700 bg-amber-50 px-2 py-0.2 rounded-none border border-amber-200">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Terkunci</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email atau NIS/NIP"
                    className={`w-full rounded-none border py-2.5 pl-9 pr-3 text-xs sm:text-sm font-semibold outline-none transition-colors ${!isAdmin
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none"
                      : "bg-white text-slate-900 border-slate-200 focus:border-[#2C1EE8]"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 082322377070"
                    className="w-full rounded-none border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#2C1EE8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows="3"
                    placeholder="Masukkan alamat domisili Anda"
                    className="w-full rounded-none border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-normal text-slate-900 outline-none transition-colors focus:border-[#2C1EE8]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 rounded-none border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-none bg-[#2C1EE8] px-6 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#2013ce] active:bg-[#1d129f] disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          )
        )}

        {/* Tab 2: Ubah Password Form */}
        {activeTab === "password" && (
          <form onSubmit={handleChangePassword} className="space-y-4 font-sans text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password Saat Ini <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full rounded-none border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#2C1EE8]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-none border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#2C1EE8]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Konfirmasi Password Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru Anda"
                  className="w-full rounded-none border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#2C1EE8]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-1.5 rounded-none bg-[#2C1EE8] px-6 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#2013ce] active:bg-[#1d129f] disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? "Memperbarui..." : "Perbarui Password Akun"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Email Notifikasi Tab */}
        {activeTab === "notification" && (
          <NotificationEmailSection user={user} onProfileUpdated={fetchProfile} />
        )}
      </div>

      {/* Persistent Notification Email Section on Profile (when on info tab) */}
      {activeTab === "info" && (
        <NotificationEmailSection user={user} onProfileUpdated={fetchProfile} />
      )}

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
    <div className="rounded-none border border-slate-200 bg-white p-4 sm:p-5 shadow-xs font-sans text-left">
      <h2 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">Informasi Akademik</h2>
      <div className="flex flex-wrap gap-2.5">
        {items.map((item) => {
          const IconComp = item.icon;
          return (
            <div key={item.label} className="w-full sm:flex-1 sm:min-w-[140px] flex flex-col gap-1 p-3 rounded-none bg-slate-50 border border-slate-200 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 text-slate-400">
                <IconComp className="w-3.5 h-3.5 text-[#2C1EE8] shrink-0" />
                <span className="text-[9.5px] font-bold font-mono uppercase tracking-wider truncate">{item.label}</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase truncate">
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
    <div className="rounded-none border border-slate-200 bg-white p-4 sm:p-5 shadow-xs font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-tight">
            Panduan Manual Replyz
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Pelajari alur dan fitur utama PPLG Center kapan saja.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartGuide}
          className="inline-flex items-center justify-center px-4 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer shrink-0"
        >
          Buka Panduan Manual
        </button>
      </div>
    </div>
  );
}
