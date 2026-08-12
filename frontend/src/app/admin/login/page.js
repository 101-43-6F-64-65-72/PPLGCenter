"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorAlert from "@/components/common/ErrorAlert";

let motionImport = null;
try {
  const m = require("motion/react");
  motionImport = m.motion;
} catch (e) {
  try {
    const f = require("framer-motion");
    motionImport = f.motion;
  } catch (e2) {}
}

const FallbackDiv = React.forwardRef(({ children, className, style, onClick }, ref) => (
  <div ref={ref} className={className} style={style} onClick={onClick}>
    {children}
  </div>
));
FallbackDiv.displayName = "FallbackDiv";

const MotionDiv = motionImport?.div || FallbackDiv;

export default function AdminLoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto redirect if already logged in as Admin
  React.useEffect(() => {
    if (isAuthenticated && (user?.role === "Admin" || user?.role === "admin")) {
      router.push("/admin");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim()) {
      setErrorMessage("Email atau Username Admin wajib diisi!");
      return;
    }
    if (!password) {
      setErrorMessage("Password Admin wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        loginType: "Admin",
        identifier: identifier.trim(),
        password,
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 2500);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Gagal masuk sebagai Admin. Periksa kembali kredensial Anda.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#071225] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Ambient Glowing Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Header / Back Link */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl border border-white/15 backdrop-blur-md transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Student Center</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black text-amber-300 bg-amber-500/10 border border-amber-400/30 px-3 py-1 rounded-full backdrop-blur-md">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          PORTAL RESTRIKSI ADMIN
        </span>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-8">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
          className="relative bg-gradient-to-b from-[#0b1630] via-[#0d1c3a] to-[#071225] border border-white/20 rounded-[36px] p-7 sm:p-9 shadow-2xl shadow-slate-950/90 backdrop-blur-2xl overflow-hidden"
        >
          {/* Top Logo & Branding */}
          <div className="text-center space-y-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto shadow-inner backdrop-blur-md">
              <Image
                src="/images/logo.png"
                alt="Logo SMKN 2 Surakarta"
                width={42}
                height={42}
                className="object-contain"
                priority
              />
            </div>

            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-widest text-blue-300 bg-blue-500/20 px-3 py-0.5 rounded-full border border-blue-400/30 mb-1.5">
                EXECUTIVE SECURITY PORTAL
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Control Center Admin
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                Portal Otentikasi Khusus Pengelola Sistem & Waka Kesiswaan SMKN 2 Surakarta
              </p>
            </div>
          </div>

          {/* Success Screen State */}
          {isSuccess ? (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-300 shadow-lg shadow-emerald-500/30">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Otentikasi Berhasil
                </span>
                <h2 className="text-xl font-black text-white">Selamat Datang, Admin!</h2>
                <p className="text-xs text-slate-300">Menyiapkan Panel Kontrol Kesiswaan...</p>
              </div>

              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden p-0.5 border border-white/15">
                <MotionDiv
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.3, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500 rounded-full"
                />
              </div>
            </MotionDiv>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMessage && (
                <ErrorAlert
                  title="Akses Ditolak"
                  message={errorMessage}
                  onClose={() => setErrorMessage("")}
                />
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-200">
                  Email / Username Admin
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan Email atau Username Admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  variant="dark"
                  leftIcon={<User className="w-4 h-4 text-blue-400" />}
                  isRequired
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-200">Password Admin</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  variant="dark"
                  leftIcon={<Lock className="w-4 h-4 text-blue-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  isRequired
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="!bg-[#2c1ee8] hover:!bg-blue-600 !text-white font-black py-3.5 text-sm rounded-2xl shadow-xl shadow-blue-900/40 active:scale-[0.98] transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? "Memverifikasi Akses..." : "Masuk ke Panel Control"}
              </Button>

              {/* Audit Notice */}
              <div className="pt-3 border-t border-white/10 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  🔒 <strong className="text-slate-300">Audit Security:</strong> Seluruh percobaan masuk ke sistem kontrol ini dicatat berdasarkan timestamp & IP address.
                </p>
              </div>
            </form>
          )}
        </MotionDiv>
      </div>

      {/* Footer Branding */}
      <div className="w-full max-w-6xl mx-auto text-center text-xs text-slate-400 font-medium z-10">
        © {new Date().getFullYear()} SMK Negeri 2 Surakarta. All Rights Reserved.
      </div>
    </div>
  );
}
