"use client";

import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorAlert from "@/components/common/ErrorAlert";
import { User, Lock, KeyRound, CheckCircle2, Clock } from "lucide-react";
import apiClient from "@/lib/api";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#2c1ee8] border border-white/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="text-lg font-bold text-white">Reset Password</h2>
          <button
            onClick={handleResetModal}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-xl hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {error && <ErrorAlert title="Perhatian" message={error} onClose={() => setError("")} />}

        {message && (
          <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-400/30 text-blue-200 text-xs font-medium flex items-center gap-2">
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: CREATE REQUEST */}
        {step === "request" && (
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-white/80">NIS / NISN / NIP / Email</label>
              <Input
                type="text"
                placeholder="Masukkan identitas akun Anda"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                variant="dark"
                leftIcon={<User className="w-4 h-4 text-blue-400" />}
                isRequired
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white/80">Alasan Lupa Password (Opsional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#ffffff] border border-white/20 rounded-2xl p-3 text-xm text-black outline-none focus:border-white transition"
                rows={2}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              className="!bg-blue-600 hover:!bg-blue-500 font-bold py-3 text-sm rounded-2xl"
            >
              Ajukan Reset Password
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleCheckStatus}
                className="text-xs text-blue-300 hover:text-blue-200 underline font-semibold"
              >
                Cek status persetujuan
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PENDING APPROVAL */}
        {step === "pending" && (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto text-white-300 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Permohonan Menunggu Persetujuan Admin</h3>
              <p className="text-xs text-white/60 mt-1">
                Silakan hubungi Waka Kesiswaan / Admin sekolah untuk menyetujui tiket ini.
              </p>
            </div>

            <div className="bg-[#2B2DEC] p-3.5 rounded-2xl border border-white/20 text-left space-y-1 flex item-center justify-between">
              <p className="text-[11px] font-bold text-white/85 uppercase tracking-wide">Identitas Akun</p>
              <p className="font-mono text-xs text-blue-300 font-bold break-all">{identifier}</p>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleCheckStatus}
                variant="primary"
                fullWidth
                isLoading={loading}
                className="!bg-emerald-600 hover:!bg-emerald-500 font-bold py-3 text-sm rounded-2xl"
              >
                Cek Status Persetujuan Admin
              </Button>
              <button
                type="button"
                onClick={() => setStep("request")}
                className="text-xs text-white/60 hover:text-white underline block mx-auto cursor-pointer"
              >
                ← Ajukan Ulang / Ganti Identitas
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SET NEW PASSWORD */}
        {step === "set_new" && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Permohonan Disetujui! Masukkan password baru Anda.</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white/80">Password Baru</label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="dark"
                leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
                isRequired
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white/80">Konfirmasi Password Baru</label>
              <Input
                type="password"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="dark"
                leftIcon={<Lock className="w-4 h-4 text-emerald-400" />}
                isRequired
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              className="!bg-emerald-600 hover:!bg-emerald-500 font-bold py-3 text-sm rounded-2xl"
            >
              Simpan Password Baru
            </Button>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "success" && (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Password Berhasil Diperbarui!</h3>
              <p className="text-xs text-white/70 mt-1">
                Silakan gunakan password baru Anda untuk masuk ke sistem.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleResetModal}
              variant="primary"
              fullWidth
              className="!bg-blue-600 hover:!bg-blue-500 font-bold py-3 text-sm rounded-2xl"
            >
              Kembali ke Halaman Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
