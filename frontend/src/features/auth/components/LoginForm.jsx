"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Sparkles, CheckCircle2, ShieldAlert, ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import BloubMascot from "@/components/BloubMascot";
import ErrorAlert from "@/components/common/ErrorAlert";
import apiClient from "@/lib/api";
import gsap from "gsap";

export const LoginForm = ({ onSuccess, mascotState, setMascotState }) => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  // Current active mode: 'login' | 'forgot'
  const [activeMode, setActiveMode] = useState("login");

  // ─── LOGIN STATES ───
  const [loginType, setLoginType] = useState("Student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successUserData, setSuccessUserData] = useState(null);

  // ─── FORGOT PASSWORD STATES ───
  const [forgotStep, setForgotStep] = useState("request");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotReason, setForgotReason] = useState("");
  const [forgotRequestId, setForgotRequestId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  // DOM Refs for GSAP Transitions
  const slidingContainerRef = useRef(null);
  const loginViewRef = useRef(null);
  const forgotViewRef = useRef(null);

  // Mascot interaction cycle when submitting login
  useEffect(() => {
    let intervalId;
    if (isSubmitting) {
      if (setMascotState) setMascotState("thinking");
      const loadingStates = ["thinking", "peek", "thinking", "closed"];
      let stepIndex = 0;
      intervalId = setInterval(() => {
        stepIndex = (stepIndex + 1) % loadingStates.length;
        if (setMascotState) {
          setMascotState(loadingStates[stepIndex]);
        }
      }, 500);
    }
    return () => clearInterval(intervalId);
  }, [isSubmitting, setMascotState]);

  // ─── SMOOTH GSAP SLIDE TRANSFORMS (Zero Vertical Jump & Dynamic Height) ───
  const switchToForgot = () => {
    setLoginError("");
    setForgotError("");
    setForgotMessage("");
    if (setMascotState) setMascotState("thinking");

    if (loginViewRef.current && forgotViewRef.current) {
      gsap.set(forgotViewRef.current, { display: "block", position: "absolute", top: 0, left: 0, width: "100%", xPercent: 105, opacity: 0 });
      gsap.set(loginViewRef.current, { position: "relative", width: "100%" });

      const tl = gsap.timeline();

      // Animate Login inputs out to the left
      tl.to(loginViewRef.current, {
        xPercent: -105,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });

      // Animate Forgot inputs in from the right
      tl.to(
        forgotViewRef.current,
        {
          xPercent: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.inOut",
          onComplete: () => {
            setActiveMode("forgot");
            gsap.set([loginViewRef.current, forgotViewRef.current], { clearProps: "all" });
          },
        },
        "-=0.15"
      );
    } else {
      setActiveMode("forgot");
    }
  };

  const switchToLogin = () => {
    setForgotError("");
    setForgotMessage("");
    setLoginError("");
    if (setMascotState) setMascotState("idle");

    if (loginViewRef.current && forgotViewRef.current) {
      gsap.set(loginViewRef.current, { display: "block", position: "absolute", top: 0, left: 0, width: "100%", xPercent: -105, opacity: 0 });
      gsap.set(forgotViewRef.current, { position: "relative", width: "100%" });

      const tl = gsap.timeline();

      // Animate Forgot inputs out to the right
      tl.to(forgotViewRef.current, {
        xPercent: 105,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });

      // Animate Login inputs in from the left
      tl.to(
        loginViewRef.current,
        {
          xPercent: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.inOut",
          onComplete: () => {
            setActiveMode("login");
            gsap.set([loginViewRef.current, forgotViewRef.current], { clearProps: "all" });
          },
        },
        "-=0.15"
      );
    } else {
      setActiveMode("login");
    }
  };

  // ─── LOGIN HANDLERS ───
  const handleIdentifierFocus = () => {
    if (!isSubmitting && !isSuccess && setMascotState) {
      setMascotState("notif");
    }
  };

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    setIdentifier(val);
    if (!isSubmitting && !isSuccess && setMascotState) {
      setMascotState(val.length > 0 ? "notif" : "idle");
    }
    if (val.toLowerCase().includes("admin")) {
      setLoginType("Admin");
    } else if (val.toLowerCase().includes("guru") || val.toLowerCase().includes("nip")) {
      setLoginType("Teacher");
    }
  };

  const handlePasswordFocus = () => {
    if (isSubmitting || isSuccess || !setMascotState) return;
    setMascotState(showPassword ? "peek" : "side");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (!isSubmitting && !isSuccess && setMascotState) {
      setMascotState(showPassword ? "peek" : "closed");
    }
  };

  const togglePasswordVisibility = () => {
    const nextShow = !showPassword;
    setShowPassword(nextShow);
    if (!isSubmitting && !isSuccess && setMascotState) {
      setMascotState(nextShow ? "peek" : "side");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!identifier.trim()) {
      setLoginError("NIS / NISN / NIP wajib diisi");
      if (setMascotState) setMascotState("sad");
      return;
    }
    if (!password) {
      setLoginError("Password wajib diisi");
      if (setMascotState) setMascotState("sad");
      return;
    }

    setIsSubmitting(true);
    if (setMascotState) setMascotState("thinking");

    try {
      const payload = {
        loginType,
        identifier: identifier.trim(),
        password,
      };

      const res = await login(payload);
      const userData = res?.data?.user || res?.data || res?.user || res;
      setSuccessUserData(userData);
      setIsSuccess(true);

      const defaultPasswords = [
        "student123!", "guru123!", "admin123!", "pplg123", "123456", "12345678", "password", "admin",
      ];
      const isDefault = defaultPasswords.includes(password.toLowerCase()) || password.trim() === identifier.trim();

      if (isDefault && typeof window !== "undefined") {
        localStorage.setItem("sc_must_change_password", "true");
      }

      if (setMascotState) setMascotState(isDefault ? "notif" : "love");
      if (onSuccess) onSuccess(res);
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Gagal masuk. Silakan periksa kredensial Anda.";
      setLoginError(backendMessage);
      if (setMascotState) setMascotState("sad");

      if (loginViewRef.current) {
        gsap.fromTo(
          loginViewRef.current,
          { x: -8 },
          { x: 8, duration: 0.08, repeat: 4, yoyo: true, ease: "sine.inOut" }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── FORGOT PASSWORD HANDLERS ───
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    if (!forgotIdentifier.trim()) {
      setForgotError("NIS / NISN / NIP wajib diisi!");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await apiClient.post("/api/auth/reset-password/request", {
        identifier: forgotIdentifier.trim(),
        reason: forgotReason.trim() || null,
      });

      const data = res?.data;
      setForgotRequestId(data?.requestId);
      setForgotMessage(res?.message || "Permohonan reset password berhasil diajukan.");
      setForgotStep("pending");
      if (setMascotState) setMascotState("notif");
    } catch (err) {
      setForgotError(err?.message || "Gagal mengajukan permohonan reset password.");
      if (setMascotState) setMascotState("sad");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCheckForgotStatus = async () => {
    setForgotError("");
    setForgotMessage("");

    if (!forgotIdentifier.trim() && !forgotRequestId) {
      setForgotError("Identitas akun wajib diisi.");
      return;
    }

    setForgotLoading(true);
    try {
      const endpoint = forgotIdentifier.trim()
        ? `/api/auth/reset-password/status-by-identifier/${encodeURIComponent(forgotIdentifier.trim())}`
        : `/api/auth/reset-password/status/${forgotRequestId}`;

      const res = await apiClient.get(endpoint);
      const data = res?.data;
      if (data?.id) setForgotRequestId(data.id);

      if (data?.isValidForReset) {
        setForgotStep("set_new");
        setForgotMessage("Permohonan Anda telah DISETUJUI Admin! Silakan buat password baru.");
        if (setMascotState) setMascotState("happy");
      } else if (data?.status === 2 || data?.statusText === "Rejected") {
        setForgotError(`Permohonan ditolak Admin. ${data.adminNotes ? `Catatan: ${data.adminNotes}` : ""}`);
        if (setMascotState) setMascotState("sad");
      } else if (data?.status === 4 || data?.statusText === "Expired") {
        setForgotError("Permohonan reset password sudah kadaluwarsa. Silakan ajukan ulang.");
      } else if (data?.status === 3 || data?.statusText === "Consumed") {
        setForgotError("Permohonan ini sudah digunakan. Silakan buat permohonan baru jika lupa password kembali.");
      } else {
        setForgotMessage("Permohonan Anda masih MENUNGGU persetujuan Admin.");
        if (setMascotState) setMascotState("thinking");
      }
    } catch (err) {
      setForgotError(err?.message || "Gagal mengecek status permohonan.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmNewPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    if (!newPassword || newPassword.length < 6) {
      setForgotError("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await apiClient.post("/api/auth/reset-password/confirm", {
        identifier: forgotIdentifier.trim(),
        requestId: forgotRequestId || null,
        newPassword,
      });

      setForgotMessage(res?.message || "Password berhasil diperbarui!");
      setForgotStep("success");
      if (setMascotState) setMascotState("love");
    } catch (err) {
      setForgotError(err?.message || "Gagal memperbarui password.");
      if (setMascotState) setMascotState("sad");
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── POST-LOGIN SUCCESS CELEBRATION ───
  if (isSuccess) {
    const roleLabel = loginType === "Student" ? "Siswa" : loginType === "Teacher" ? "Guru" : "Admin";
    const userName = successUserData?.fullName || successUserData?.name || identifier;
    const isUsingDefaultPassword = typeof window !== "undefined" && localStorage.getItem("sc_must_change_password") === "true";

    const handleProceed = () => {
      let dest = callbackUrl;
      if (!searchParams?.get("callbackUrl")) {
        dest = loginType === "Admin" ? "/admin" : "/";
      }
      if (onSuccess) onSuccess(successUserData);
      router.push(dest);
    };

    return (
      <div className="w-full py-4 flex flex-col items-center justify-center text-center space-y-4 font-sans text-slate-900">
        <div className="flex items-center justify-center">
          <BloubMascot size={120} state={isUsingDefaultPassword ? "idle" : "love"} badge={false} />
        </div>

        <div className="space-y-1.5 max-w-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Login Berhasil
          </span>
          <h2 className="text-xl font-black text-black tracking-tight">
            Selamat Datang, {userName}!
          </h2>
          <p className="text-xs text-slate-700 font-medium">
            Akses portal sebagai <span className="font-bold text-[#2c1ee8]">{roleLabel}</span> PPLG Center.
          </p>

          {isUsingDefaultPassword && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 text-left flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Perhatian:</strong> Akun Anda masih menggunakan password default. Disarankan segera menggantinya di profil.
              </span>
            </div>
          )}
        </div>

        <div className="w-full max-w-xs pt-2">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-3 px-4 bg-[#2c1ee8] hover:bg-[#2317be] active:bg-[#1d129f] text-white font-bold text-sm rounded-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>Lanjutkan ke Portal</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col font-sans text-black">
      {/* ─── SHARED STATIC HEADER (Fixed at top, never moves or jumps, unclipped logo) ─── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-visible">
          <Image
            src="/images/logo.png"
            alt="Logo SMKN 2 Surakarta"
            width={48}
            height={48}
            style={{ width: "auto", height: "auto" }}
            className="object-contain max-h-12 max-w-12"
            priority
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-lg sm:text-xl font-black text-black tracking-wide uppercase leading-tight font-sans">
            PPLG CENTER
          </h1>
          <p className="text-[11px] font-black text-black tracking-widest uppercase font-sans">
            SMKN 2 SURAKARTA
          </p>
        </div>
      </div>

      {/* Hidden select for Playwright e2e */}
      <select
        name="loginType"
        aria-label="Tipe Login"
        value={loginType}
        onChange={(e) => setLoginType(e.target.value)}
        className="sr-only"
      >
        <option value="Student">Siswa</option>
        <option value="Teacher">Guru</option>
        <option value="Admin">Admin</option>
      </select>

      {/* ─── SLIDING FORM CONTAINER (Contained Overflow & Clean Flow) ─── */}
      <div ref={slidingContainerRef} className="relative w-full overflow-hidden transition-all">
        {/* ─── 1. LOGIN FORM VIEW ─── */}
        <div
          ref={loginViewRef}
          className={`w-full space-y-4 ${activeMode === "login" ? "relative block" : "hidden absolute top-0 left-0"}`}
        >
          <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
            {loginError && (
              <ErrorAlert
                title="Login Gagal"
                message={loginError}
                onClose={() => setLoginError("")}
              />
            )}

            {/* Field 1: NIS/NISN/NIP */}
            <div className="space-y-1">
              <label
                htmlFor="identifier"
                className="block text-xs font-black text-black tracking-wider uppercase font-sans"
              >
                NIS/NISN/NIP
              </label>
              <div className="relative w-full">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={identifier}
                  onFocus={handleIdentifierFocus}
                  onChange={handleIdentifierChange}
                  required
                  className="w-full bg-white text-black font-semibold px-3 py-2 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-sm shadow-none"
                />
              </div>
            </div>

            {/* Field 2: PASSWORD */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-xs font-black text-black tracking-wider uppercase font-sans"
              >
                PASSWORD
              </label>
              <div className="relative flex items-center w-full">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onFocus={handlePasswordFocus}
                  onChange={handlePasswordChange}
                  required
                  className="w-full bg-white text-black font-semibold px-3 py-2 pr-9 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-sm shadow-none"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black hover:text-slate-700 transition-colors focus:outline-none cursor-pointer p-1"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-black" /> : <Eye className="w-4 h-4 text-black" />}
                </button>
              </div>

              {/* "lupa" trigger */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="text-xs text-[#2c1ee8] hover:text-[#2317be] italic transition-colors cursor-pointer font-bold"
                >
                  lupa
                </button>
              </div>
            </div>

            {/* CTA Button: Solid Electric Royal Blue "#2c1ee8" */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#2c1ee8] hover:bg-[#2317be] active:bg-[#1d129f] text-white font-black text-sm py-2.5 px-4 rounded-none transition-all duration-200 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide font-sans shadow-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <span className="font-black text-sm uppercase tracking-wider">Login</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ─── 2. FORGOT PASSWORD FORM VIEW ─── */}
        <div
          ref={forgotViewRef}
          className={`w-full space-y-3 ${activeMode === "forgot" ? "relative block" : "hidden absolute top-0 left-0"}`}
        >
          {/* Sub-header navigation with back link */}
          <div className="flex items-center justify-between pb-0.5">
            <button
              type="button"
              onClick={switchToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2c1ee8] hover:text-[#2317be] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Login</span>
            </button>
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
              Lupa Password
            </span>
          </div>

          {forgotError && (
            <ErrorAlert
              title="Perhatian"
              message={forgotError}
              onClose={() => setForgotError("")}
            />
          )}

          {forgotMessage && (
            <div className="p-2.5 rounded-none bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2c1ee8] shrink-0" />
              <span>{forgotMessage}</span>
            </div>
          )}

          {/* STEP 1: Request Form */}
          {forgotStep === "request" && (
            <form onSubmit={handleForgotRequest} className="space-y-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-black text-black tracking-wider uppercase font-sans">
                  NIS / NISN / NIP
                </label>
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Masukkan NIS / NISN / NIP Anda"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                    className="w-full bg-white text-black font-semibold px-3 py-2 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black tracking-wider uppercase font-sans">
                  Alasan Lupa Password (Opsional)
                </label>
                <textarea
                  value={forgotReason}
                  onChange={(e) => setForgotReason(e.target.value)}
                  placeholder="Contoh: Lupa kata sandi lama atau akun terkunci"
                  className="w-full bg-white text-black font-medium border border-black rounded-none p-2 text-xs placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2c1ee8] transition resize-none"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-[#2c1ee8] hover:bg-[#2317be] active:bg-[#1d129f] text-white font-black py-2.5 text-xs rounded-none transition-all cursor-pointer disabled:opacity-75 uppercase tracking-wider mt-1 flex items-center justify-center gap-2 font-sans"
              >
                {forgotLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mengirim Permohonan...</span>
                  </div>
                ) : (
                  <span>Ajukan Reset Password</span>
                )}
              </button>

              <div className="pt-0.5 text-center">
                <button
                  type="button"
                  onClick={handleCheckForgotStatus}
                  className="text-[11px] text-[#2c1ee8] hover:text-[#2317be] italic transition-colors cursor-pointer font-bold"
                >
                  Cek status persetujuan tiket sebelumnya
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Pending Approval */}
          {forgotStep === "pending" && (
            <div className="space-y-3.5 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto text-[#2c1ee8]">
                <Clock className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-black text-black text-sm tracking-tight font-sans">
                  Permohonan Menunggu Persetujuan
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                  Hubungi Admin / Guru Pembina untuk menyetujui tiket Anda.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-none border border-slate-300 text-left space-y-1 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                  Identitas Akun
                </p>
                <p className="font-mono text-xs text-[#2c1ee8] font-bold break-all">
                  {forgotIdentifier}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckForgotStatus}
                  disabled={forgotLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 text-xs rounded-none cursor-pointer transition-all uppercase tracking-wider flex items-center justify-center gap-2 font-sans"
                >
                  {forgotLoading ? "Memeriksa..." : "Cek Status Persetujuan Admin"}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotStep("request")}
                  className="text-xs text-slate-600 hover:text-black block mx-auto transition cursor-pointer font-bold"
                >
                  ← Ajukan Ulang / Ganti Identitas
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Set New Password */}
          {forgotStep === "set_new" && (
            <form onSubmit={handleConfirmNewPassword} className="space-y-3">
              <div className="p-2.5 rounded-none bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Permohonan Disetujui! Silakan buat password baru.</span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black tracking-wider uppercase font-sans">
                  Password Baru
                </label>
                <div className="relative w-full">
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-white text-black font-semibold px-3.5 py-2 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black tracking-wider uppercase font-sans">
                  Konfirmasi Password Baru
                </label>
                <div className="relative w-full">
                  <input
                    type="password"
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-white text-black font-semibold px-3.5 py-2 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 text-xs rounded-none transition-all cursor-pointer disabled:opacity-75 uppercase tracking-wider mt-2 font-sans"
              >
                {forgotLoading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          )}

          {/* STEP 4: Success Message */}
          {forgotStep === "success" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-black text-black text-base tracking-tight font-sans">
                  Password Berhasil Diperbarui!
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Silakan login dengan password baru Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={switchToLogin}
                className="w-full bg-[#2c1ee8] hover:bg-[#2317be] text-white font-black py-2.5 text-xs rounded-none cursor-pointer transition-all uppercase tracking-wider font-sans"
              >
                Kembali ke Form Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
