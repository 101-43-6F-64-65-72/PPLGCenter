"use client";

import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorAlert from "@/components/common/ErrorAlert";
import { User, Lock, KeyRound, CheckCircle2, Clock, X, Sparkles, ShieldCheck } from "lucide-react";
import apiClient from "@/lib/api";

let motionImport = null;
let animatePresenceImport = null;

try {
  const m = require("motion/react");
  motionImport = m.motion;
  animatePresenceImport = m.AnimatePresence;
} catch (e) {
  try {
    const f = require("framer-motion");
    motionImport = f.motion;
    animatePresenceImport = f.AnimatePresence;
  } catch (e2) {}
}

const FallbackDiv = React.forwardRef(({ children, className, style, onClick }, ref) => (
  <div ref={ref} className={className} style={style} onClick={onClick}>
    {children}
  </div>
));
FallbackDiv.displayName = "FallbackDiv";

const MotionDiv = motionImport?.div || FallbackDiv;
const AnimatePresenceComponent = animatePresenceImport || (({ children }) => <>{children}</>);

export default function ForgotPasswordModal({ isOpen, onClose }) {
  // Steps: 'request' | 'pending' | 'set_new' | 'success'
  const [step, setStep] = useState("request");

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");

  // Request data
  const [requestId, setRequestId] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);

  // New Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Step 1: Submit Reset Request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!identifier.trim()) {
      setError("NIS / NISN / NIP wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/reset-password/request", {
        identifier: identifier.trim(),
        reason: reason.trim() || null,
      });

      const data = res?.data;
      setRequestId(data?.requestId);
      setMessage(res?.message || "Permohonan reset password diajukan.");
      setStep("pending");
    } catch (err) {
      setError(err?.message || "Gagal mengajukan permohonan reset password.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Check Approval Status
  const handleCheckStatus = async () => {
    setError("");
    setMessage("");

    if (!identifier.trim() && !requestId) {
      setError("Identitas akun wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = identifier.trim()
        ? `/api/auth/reset-password/status-by-identifier/${encodeURIComponent(identifier.trim())}`
        : `/api/auth/reset-password/status/${requestId}`;

      const res = await apiClient.get(endpoint);
      const data = res?.data;
      setRequestStatus(data);
      if (data?.id) setRequestId(data.id);

      if (data?.isValidForReset) {
        setStep("set_new");
        setMessage("Permohonan Anda telah DISETUJUI oleh Admin! Silakan masukkan password baru.");
      } else if (data?.status === 2 || data?.statusText === "Rejected") {
        setError(`Permohonan ditolak oleh Admin. ${data.adminNotes ? `Catatan: ${data.adminNotes}` : ""}`);
      } else if (data?.status === 4 || data?.statusText === "Expired") {
        setError("Permohonan reset password ini sudah kadaluwarsa. Silakan ajukan ulang.");
      } else if (data?.status === 3 || data?.statusText === "Consumed") {
        setError("Permohonan ini sudah digunakan. Silakan buat permohonan baru jika lupa password kembali.");
      } else {
        setMessage("Permohonan Anda masih MENUNGGU persetujuan Admin. Silakan periksa kembali nanti.");
      }
    } catch (err) {
      setError(err?.message || "Gagal mengecek status permohonan.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Confirm New Password
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword || newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/reset-password/confirm", {
        identifier: identifier.trim(),
        requestId: requestId || null,
        newPassword,
      });

      setMessage(res?.message || "Password berhasil diperbarui!");
      setStep("success");
    } catch (err) {
      setError(err?.message || "Gagal memperbarui password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetModal = () => {
    setStep("request");
    setIdentifier("");
    setFullName("");
    setReason("");
    setRequestId("");
    setRequestStatus(null);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
    onClose();
  };

  return (
    <AnimatePresenceComponent mode="wait">
      {isOpen && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans"
          onClick={handleResetModal}
        >
          <MotionDiv
            initial={{ opacity: 0, scale: 0.84, y: 35, rotateX: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 25, rotateX: 6 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="relative w-full max-w-md bg-[#2c1ee8]/95 border border-white/25 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl shadow-slate-950/80 backdrop-blur-2xl space-y-6 overflow-hidden my-auto pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing Ambient Background Orbs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-400/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-400/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center border-b border-white/15 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-blue-200 shadow-inner">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-[11px] text-white/70 font-medium">
                    Layanan Lupa Password Siswa & Guru
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetModal}
                className="text-white/60 hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-white/20 hover:scale-110 hover:rotate-90 cursor-pointer border border-transparent hover:border-white/20"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <ErrorAlert title="Perhatian" message={error} onClose={() => setError("")} />}

            {message && (
              <MotionDiv
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold flex items-center gap-2 backdrop-blur-md"
              >
                <Sparkles className="w-4 h-4 text-blue-300 shrink-0" />
                <span>{message}</span>
              </MotionDiv>
            )}

            {/* STEP CONTENT WITH MOTION TRANSITIONS */}
            <div className="relative z-10">
              <AnimatePresenceComponent mode="wait">
                {/* STEP 1: CREATE REQUEST */}
                {step === "request" && (
                  <MotionDiv
                    key="step-request"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <form onSubmit={handleCreateRequest} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-white/90">
                          NIS / NISN / NIP / Email
                        </label>
                        <Input
                          type="text"
                          placeholder="Masukkan identitas akun Anda"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          variant="dark"
                          leftIcon={<User className="w-4 h-4 text-blue-300" />}
                          isRequired
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-white/90">
                          Alasan Lupa Password (Opsional)
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Contoh: Lupa kata sandi lama atau akun terkunci"
                          className="w-full bg-[#1e0873]/60 border border-white/20 rounded-2xl p-3 text-xs text-white placeholder-white/50 outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                          rows={2}
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={loading}
                        disabled={loading}
                        className="!bg-white !text-[#2c1ee8] hover:!bg-slate-100 font-black py-3.5 text-sm rounded-2xl shadow-xl shadow-white/20 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Ajukan Reset Password
                      </Button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={handleCheckStatus}
                          className="text-xs text-blue-200 hover:text-white underline font-semibold transition cursor-pointer"
                        >
                          Cek status persetujuan sebelumnya
                        </button>
                      </div>
                    </form>
                  </MotionDiv>
                )}

                {/* STEP 2: PENDING APPROVAL */}
                {step === "pending" && (
                  <MotionDiv
                    key="step-pending"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5 text-center py-2"
                  >
                    <div className="relative flex items-center justify-center">
                      <MotionDiv
                        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 rounded-full bg-blue-400/20 border border-blue-300/40 flex items-center justify-center mx-auto text-blue-200 shadow-lg shadow-blue-500/30"
                      >
                        <Clock className="w-8 h-8" />
                      </MotionDiv>
                    </div>

                    <div>
                      <h3 className="font-black text-white text-base tracking-tight">
                        Permohonan Menunggu Persetujuan Admin
                      </h3>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">
                        Silakan hubungi Pembina / Admin sekolah untuk menyetujui tiket reset password Anda.
                      </p>
                    </div>

                    <div className="bg-[#1e0873]/70 p-3.5 rounded-2xl border border-white/20 text-left space-y-1 flex items-center justify-between">
                      <p className="text-[11px] font-extrabold text-white/70 uppercase tracking-wider">
                        Identitas Akun
                      </p>
                      <p className="font-mono text-xs text-blue-200 font-black break-all">
                        {identifier}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <Button
                        type="button"
                        onClick={handleCheckStatus}
                        variant="primary"
                        fullWidth
                        isLoading={loading}
                        disabled={loading}
                        className="!bg-emerald-500 hover:!bg-emerald-400 font-black py-3.5 text-sm rounded-2xl shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-[0.98] transition-all"
                      >
                        Cek Status Persetujuan Admin
                      </Button>
                      <button
                        type="button"
                        onClick={() => setStep("request")}
                        className="text-xs text-white/70 hover:text-white underline block mx-auto font-semibold transition cursor-pointer"
                      >
                        ← Ajukan Ulang / Ganti Identitas
                      </button>
                    </div>
                  </MotionDiv>
                )}

                {/* STEP 3: SET NEW PASSWORD */}
                {step === "set_new" && (
                  <MotionDiv
                    key="step-setnew"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <form onSubmit={handleConfirmReset} className="space-y-4">
                      <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
                        <span>Permohonan Disetujui! Silakan buat password baru.</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-white/90">
                          Password Baru
                        </label>
                        <Input
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          variant="dark"
                          leftIcon={<Lock className="w-4 h-4 text-emerald-300" />}
                          isRequired
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-white/90">
                          Konfirmasi Password Baru
                        </label>
                        <Input
                          type="password"
                          placeholder="Ulangi password baru"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          variant="dark"
                          leftIcon={<Lock className="w-4 h-4 text-emerald-300" />}
                          isRequired
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={loading}
                        disabled={loading}
                        className="!bg-emerald-500 hover:!bg-emerald-400 font-black py-3.5 text-sm rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Simpan Password Baru
                      </Button>
                    </form>
                  </MotionDiv>
                )}

                {/* STEP 4: SUCCESS */}
                {step === "success" && (
                  <MotionDiv
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 350, damping: 25 }}
                    className="space-y-5 text-center py-4"
                  >
                    <div className="relative flex items-center justify-center">
                      <MotionDiv
                        initial={{ scale: 0 }}
                        animate={{ scale: [0.8, 1.3, 1.1] }}
                        transition={{ duration: 0.5 }}
                        className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-300 shadow-lg shadow-emerald-500/30"
                      >
                        <ShieldCheck className="w-9 h-9" />
                      </MotionDiv>
                    </div>

                    <div>
                      <h3 className="font-black text-white text-lg tracking-tight">
                        Password Berhasil Diperbarui!
                      </h3>
                      <p className="text-xs text-white/80 mt-1 font-medium">
                        Silakan gunakan password baru Anda untuk masuk ke sistem.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleResetModal}
                      variant="primary"
                      fullWidth
                      className="!bg-white !text-[#2c1ee8] hover:!bg-slate-100 font-black py-3.5 text-sm rounded-2xl shadow-xl shadow-white/20 cursor-pointer active:scale-[0.98] transition-all"
                    >
                      Kembali ke Halaman Login
                    </Button>
                  </MotionDiv>
                )}
              </AnimatePresenceComponent>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresenceComponent>
  );
}
