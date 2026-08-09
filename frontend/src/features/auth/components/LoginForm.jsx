"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, Eye, EyeOff } from "@/components/common/Icons";
import useAuth from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorAlert from "@/components/common/ErrorAlert";
import ForgotPasswordModal from "./ForgotPasswordModal";

export const LoginForm = () => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  // Login type: 'Student' | 'Teacher' | 'Admin'
  const [loginType, setLoginType] = useState("Student");
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  
  // Fields state
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (loginType !== "Admin" && !fullName.trim()) {
      setErrorMessage("Nama lengkap wajib diisi");
      return;
    }
    if (!identifier.trim()) {
      const idLabel = loginType === "Student" ? "NIS atau NISN" : loginType === "Teacher" ? "NIP atau Email" : "Email atau Username Admin";
      setErrorMessage(`${idLabel} wajib diisi`);
      return;
    }
    if (!password) {
      setErrorMessage("Password wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        loginType,
        fullName: loginType === "Admin" ? "Admin" : fullName,
        identifier,
        password,
      };

      await login(payload);
      setSuccessMessage("Login berhasil! Mengalihkan ke dashboard...");
      
      setTimeout(() => {
        router.push(callbackUrl);
      }, 800);
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Gagal masuk. Silakan periksa kredensial Anda.";
      setErrorMessage(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset inputs when switching loginType
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setFullName("");
    setIdentifier("");
    setPassword("");
    setErrorMessage("");
  }, [loginType]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="w-full space-y-6">
      {/* Selector Dropdown / Nav */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-white/80">Login Sebagai</label>
        <select
          value={loginType}
          onChange={(e) => setLoginType(e.target.value)}
          className="w-full bg-[#1b1b36] border border-white/20 rounded-2xl py-3.5 px-4 text-sm font-semibold text-white outline-none focus:border-white focus:ring-1 focus:ring-white transition"
        >
          <option value="Student">Siswa</option>
          <option value="Teacher">Guru</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {errorMessage && (
          <ErrorAlert
            title="Login Gagal"
            message={errorMessage}
            onClose={() => setErrorMessage("")}
          />
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
            <span>{successMessage}</span>
          </div>
        )}

        {/* Full Name Input (Not for Admin) */}
        {loginType !== "Admin" && (
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-white/80">Nama Lengkap</label>
            <Input
              name="fullName"
              type="text"
              placeholder="Masukkan nama lengkap"
              isRequired
              variant="dark"
              leftIcon={<User className="w-5 h-5 text-[#2c1ee8]" />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        {/* Identifier Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-white/80">
            {loginType === "Student" ? "NIS / NISN" : loginType === "Teacher" ? "NIP / Email" : "Email / Username Admin"}
          </label>
          <Input
            name="identifier"
            type="text"
            placeholder={
              loginType === "Student"
                ? "Masukkan NIS atau NISN"
                : loginType === "Teacher"
                ? "Masukkan NIP atau Email"
                : "Masukkan Email atau Username Admin"
            }
            isRequired
            variant="dark"
            leftIcon={<User className="w-5 h-5 text-[#2c1ee8]" />}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-white/80">Password</label>
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password"
            isRequired
            variant="dark"
            leftIcon={<Lock className="w-5 h-5 text-[#2c1ee8]" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-white transition-colors focus:outline-none"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setIsForgotOpen(true)}
              className="text-xs font-semibold text-white/80 hover:text-white underline transition cursor-pointer"
            >
              Lupa Password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="!bg-white !text-[#2c1ee8] hover:!bg-slate-100 shadow-xl shadow-white/20 font-bold py-4 text-base rounded-2xl mt-4 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#2c1ee8]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Memverifikasi Akun...</span>
            </>
          ) : (
            `Masuk Sebagai ${loginType === "Student" ? "Siswa" : loginType === "Teacher" ? "Guru" : "Admin"}`
          )}
        </Button>
      </form>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
};

export default LoginForm;
