"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import ErrorAlert from "@/components/common/ErrorAlert";
import { CheckCircle2, Clock, X, Sparkles, ShieldCheck } from "lucide-react";
import apiClient from "@/lib/api";
import gsap from "gsap";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  // Steps: 'request' | 'pending' | 'set_new' | 'success'
  const [step, setStep] = useState("request");

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("");

  // Request data
  const [requestId, setRequestId] = useState("");

  // New Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const modalRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when overlay is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const ctx = gsap.context(() => {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0, backdropFilter: "blur(0px)" },
          { opacity: 1, backdropFilter: "blur(8px)", duration: 0.3 }
        );
      }
      gsap.fromTo(
        modalRef.current,
        { scale: 0.86, y: 30, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "back.out(1.35)" }
      );
    });
    return () => ctx.revert();
  }, [isOpen, step]);

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
      setMessage(res?.message || "Permohonan reset password berhasil diajukan.");
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
      if (data?.id) setRequestId(data.id);

      if (data?.isValidForReset) {
        setStep("set_new");
        setMessage("Permohonan Anda telah DISETUJUI Admin! Silakan buat password baru.");
      } else if (data?.status === 2 || data?.statusText === "Rejected") {
        setError(`Permohonan ditolak Admin. ${data.adminNotes ? `Catatan: ${data.adminNotes}` : ""}`);
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
    if (modalRef.current && backdropRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.88,
        y: 15,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          setStep("request");
          setIdentifier("");
          setReason("");
          setRequestId("");
          setNewPassword("");
          setConfirmPassword("");
          setError("");
          setMessage("");
          onClose();
        },
      });
    } else {
      setStep("request");
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans select-none overflow-y-auto">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={handleResetModal}
      />

      {/* Card: Clean White Card with Royal Blue CTA Button */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md bg-white border border-slate-300 rounded-none p-6 sm:p-8 text-slate-900 shadow-2xl space-y-6 overflow-hidden my-auto pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative z-10 flex justify-between items-center border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Logo SMKN 2 Surakarta"
                width={36}
                height={36}
                style={{ width: "auto", height: "auto" }}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-black tracking-wider uppercase leading-tight font-sans">
                Lupa Password
              </h2>
              <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest font-sans">
                SMKN 2 SURAKARTA
              </p>
            </div>
          </div>
          <button
            onClick={handleResetModal}
            className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black flex items-center justify-center transition-colors cursor-pointer border border-slate-300"
            aria-label="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <ErrorAlert title="Perhatian" message={error} onClose={() => setError("")} />}

        {message && (
          <div className="p-3.5 rounded-none bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* STEP CONTENT */}
        <div className="relative z-10">
          {step === "request" && (
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-black tracking-wider uppercase font-sans">
                  NIS / NISN / NIP
                </label>
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Masukkan NIS / NISN / NIP Anda"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full bg-white text-black font-medium px-3.5 py-2.5 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-black tracking-wider uppercase font-sans">
                  Alasan Lupa Password (Opsional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Lupa password lama atau akun terkunci"
                  className="w-full bg-white border border-black rounded-none p-3 text-xs text-black placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2c1ee8] transition resize-none"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2c1ee8] hover:bg-[#2317be] active:bg-[#1d129f] text-white font-bold py-3 text-sm rounded-none transition-all cursor-pointer disabled:opacity-75 uppercase tracking-wider mt-2 flex items-center justify-center gap-2 font-sans"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mengirim Permohonan...</span>
                  </div>
                ) : (
                  <span>Ajukan Reset Password</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  className="text-xs text-blue-600 hover:text-blue-800 italic transition-colors cursor-pointer font-semibold"
                >
                  Cek status persetujuan tiket sebelumnya
                </button>
              </div>
            </form>
          )}

          {step === "pending" && (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto text-blue-700">
                <Clock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-extrabold text-black text-base tracking-tight font-sans">
                  Permohonan Menunggu Persetujuan
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Silakan hubungi Admin / Guru Pembina untuk menyetujui tiket permohonan reset password Anda.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-none border border-slate-300 text-left space-y-1 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                  Identitas Akun
                </p>
                <p className="font-mono text-xs text-blue-700 font-bold break-all">
                  {identifier}
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-sm rounded-none cursor-pointer transition-all uppercase tracking-wider flex items-center justify-center gap-2 font-sans"
                >
                  {loading ? "Memeriksa..." : "Cek Status Persetujuan Admin"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-xs text-slate-600 hover:text-black block mx-auto transition cursor-pointer font-semibold"
                >
                  ← Ajukan Ulang / Ganti Identitas
                </button>
              </div>
            </div>
          )}

          {step === "set_new" && (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div className="p-3 rounded-none bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Permohonan Disetujui! Silakan masukkan password baru.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-black tracking-wider uppercase font-sans">
                  Password Baru
                </label>
                <div className="relative w-full">
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-white text-black font-medium px-3.5 py-2.5 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-black tracking-wider uppercase font-sans">
                  Konfirmasi Password Baru
                </label>
                <div className="relative w-full">
                  <input
                    type="password"
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-white text-black font-medium px-3.5 py-2.5 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-sm rounded-none transition-all cursor-pointer disabled:opacity-75 uppercase tracking-wider mt-2 font-sans"
              >
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-extrabold text-black text-lg tracking-tight font-sans">
                  Password Berhasil Diperbarui!
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Silakan gunakan password baru Anda untuk masuk ke sistem PPLG Center.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetModal}
                className="w-full bg-[#2c1ee8] hover:bg-[#2317be] text-white font-bold py-3 text-sm rounded-none cursor-pointer transition-all uppercase tracking-wider font-sans"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
