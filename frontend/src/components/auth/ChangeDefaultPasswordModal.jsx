"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";
import BloubMascot from "@/components/BloubMascot";
import useAuth from "@/hooks/useAuth";
import profileService from "@/services/profileService";

export default function ChangeDefaultPasswordModal({ isOpen, onClose, onSuccess }) {
  const { user, role, fetchProfile } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [mascotState, setMascotState] = useState("idle");

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrorMsg("");
      setIsSuccess(false);
      setMascotState("idle");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle typing & dynamic mascot reactions
  const handleNewPasswordChange = (val) => {
    setNewPassword(val);
    if (!isSuccess && !isSubmitting) {
      setMascotState(showNewPassword ? "side" : "notif");
    }
  };

  const handleConfirmPasswordChange = (val) => {
    setConfirmPassword(val);
    if (!isSuccess && !isSubmitting) {
      setMascotState(showConfirmPassword ? "side" : "notif");
    }
  };

  const toggleShowNewPassword = () => {
    const next = !showNewPassword;
    setShowNewPassword(next);
    if (!isSuccess && !isSubmitting) {
      setMascotState(next ? "side" : "notif");
    }
  };

  const toggleShowConfirmPassword = () => {
    const next = !showConfirmPassword;
    setShowConfirmPassword(next);
    if (!isSuccess && !isSubmitting) {
      setMascotState(next ? "side" : "notif");
    }
  };

  const handleFocusNew = () => {
    if (!isSuccess && !isSubmitting) {
      setMascotState(showNewPassword ? "side" : "notif");
    }
  };

  const handleFocusConfirm = () => {
    if (!isSuccess && !isSubmitting) {
      setMascotState(showConfirmPassword ? "side" : "notif");
    }
  };

  const handleBlur = () => {
    if (!isSuccess && !isSubmitting && !newPassword && !confirmPassword) {
      setMascotState("idle");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password baru minimal 6 karakter.");
      setMascotState("sad");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password baru tidak cocok.");
      setMascotState("sad");
      return;
    }

    const defaultPasswords = [
      "student123!",
      "guru123!",
      "admin123!",
      "pplg123",
      "123456",
      "12345678",
      "password",
      "admin",
    ];

    if (defaultPasswords.includes(newPassword.toLowerCase())) {
      setErrorMsg("Password baru tidak boleh sama dengan password default.");
      setMascotState("sad");
      return;
    }

    setIsSubmitting(true);
    setMascotState("thinking");

    try {
      if (!user?.id) {
        throw new Error("ID Pengguna tidak ditemukan. Silakan login ulang.");
      }

      let roleNum = 2;
      if (role === "Admin" || user?.role === "Admin" || user?.role === 0) roleNum = 0;
      else if (role === "Teacher" || user?.role === "Teacher" || user?.role === 1) roleNum = 1;

      const payload = {
        fullName: user?.fullName || user?.name || "",
        email: user?.email || "",
        password: newPassword,
        phoneNumber: user?.phoneNumber || null,
        address: user?.address || null,
        photoUrl: user?.photoUrl || null,
        role: roleNum,
      };

      const res = await profileService.updateProfile(user.id, payload);

      if (res?.success || res?.data) {
        setIsSuccess(true);
        setMascotState("happy");
        if (typeof window !== "undefined") {
          localStorage.removeItem("sc_must_change_password");
        }
        await fetchProfile();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res?.message || "Gagal mengubah password.");
      }
    } catch (err) {
      console.error("Change default password error:", err);
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        "Gagal mengganti password. Silakan coba lagi."
      );
      setMascotState("sad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sc_dismissed_pwd_warning", "true");
    }
    onClose();
  };

  const userName = user?.fullName || user?.name || "Pengguna PPLG";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in no-print">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative text-slate-900 font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer z-10"
          title="Tutup (Ingatkan Nanti)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot & Header Visual Section */}
        <div className="pt-7 pb-4 px-6 text-center flex flex-col items-center bg-gradient-to-b from-blue-50/80 via-white to-white relative">
          <div className="relative p-2.5 bg-slate-900 rounded-3xl border border-slate-700/80 shadow-lg mb-3">
            <BloubMascot size={84} state={mascotState} badge={false} />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Peringatan Keamanan Akun</span>
          </span>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {isSuccess ? "Password Berhasil Diperbarui!" : "Yuk, Ganti Password Bawaanmu!"}
          </h3>

          <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
            {isSuccess
              ? "Akunmu sekarang sudah terlindungi dengan password baru yang aman."
              : `Hai ${userName}, demi keamanan, ganti password default akunmu sekarang.`}
          </p>
        </div>

        {/* Modal Body / Form */}
        <div className="px-6 pb-6 pt-2">
          {isSuccess ? (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password baru telah aktif dan tersimpan di sistem.</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-[#2C1EE8] hover:bg-[#2013ce] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Mulai Akses Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Password Baru */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Minimal 6 karakter..."
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    onFocus={handleFocusNew}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={toggleShowNewPassword}
                    className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ulangi Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Ketik ulang password baru..."
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    onFocus={handleFocusConfirm}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={toggleShowConfirmPassword}
                    className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || !confirmPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2C1EE8] hover:bg-[#2013ce] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Menyimpan Password..." : "Simpan & Ganti Password"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Ingatkan Saya Nanti
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
