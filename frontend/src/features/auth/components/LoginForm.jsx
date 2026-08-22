"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, Eye, EyeOff } from "@/components/common/Icons";
import { GraduationCap, BookOpen, ShieldAlert, Sparkles, CheckCircle2, Check } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorAlert from "@/components/common/ErrorAlert";
import ForgotPasswordModal from "./ForgotPasswordModal";

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

export const LoginForm = ({ onSuccess, setMascotState }) => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  // Login type: 'Student' | 'Teacher' | 'Admin'
  const [loginType, setLoginType] = useState("Student");
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Fields state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successUserData, setSuccessUserData] = useState(null);

  // ─── Submitting / Loading Cycle: Alternate 'idle' <-> 'sad' every 1.5s ───
  useEffect(() => {
    let intervalId;
    if (isSubmitting) {
      if (setMascotState) setMascotState("idle");
      intervalId = setInterval(() => {
        if (setMascotState) {
          setMascotState((prev) => (prev === "idle" ? "sad" : "idle"));
        }
      }, 1500);
    }
    return () => clearInterval(intervalId);
  }, [isSubmitting, setMascotState]);

  // Input Focus Handlers
  const handleIdentifierFocus = () => {
    if (!isSubmitting && !isSuccess && setMascotState) {
      setMascotState("notif");
    }
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    if (!isSubmitting && !isSuccess && setMascotState) {
      setMascotState("notif");
    }
  };

  const handlePasswordFocus = () => {
    if (isSubmitting || isSuccess || !setMascotState) return;
    setMascotState(showPassword ? "peek" : "side");
  };

  const togglePasswordVisibility = () => {
    const nextShow = !showPassword;
    setShowPassword(nextShow);
    if (!isSubmitting && !isSuccess && setMascotState) {
      setMascotState(nextShow ? "peek" : "side");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validation
    if (!identifier.trim()) {
      const idLabel =
        loginType === "Student"
          ? "NIS atau NISN"
          : loginType === "Teacher"
          ? "NIP atau Email"
          : "Email atau Username Admin";
      const msg = `${idLabel} wajib diisi`;
      setErrorMessage(msg);
      if (setMascotState) setMascotState("sad");
      return;
    }
    if (!password) {
      setErrorMessage("Password wajib diisi");
      if (setMascotState) setMascotState("sad");
      return;
    }

    setIsSubmitting(true);
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
      if (setMascotState) setMascotState("happy");

      if (onSuccess) {
        onSuccess(res);
      }

      // Smooth post-login celebration delay before navigation
      setTimeout(() => {
        let dest = callbackUrl;
        if (callbackUrl === "/profile" || !callbackUrl || callbackUrl === "/") {
          if (loginType === "Admin") dest = "/admin";
          else if (loginType === "Teacher") dest = "/profile";
          else dest = "/profile";
        }
        router.push(dest);
      }, 2000);
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Gagal masuk. Silakan periksa kredensial Anda.";
      setErrorMessage(backendMessage);
      if (setMascotState) setMascotState("sad");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset inputs when switching loginType
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIdentifier("");
    setPassword("");
    setErrorMessage("");
  }, [loginType]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // POST-LOGIN CELEBRATION SUCCESS ANIMATION SCREEN
  if (isSuccess) {
    const roleLabel =
      loginType === "Student" ? "Siswa" : loginType === "Teacher" ? "Guru" : "Admin";
    const userName = successUserData?.fullName || successUserData?.name || identifier;

    return (
      <MotionDiv
        initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 24 }}
        className="w-full py-6 flex flex-col items-center justify-center text-center space-y-5"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Animated Glowing Ring & Checkmark */}
        <div className="relative flex items-center justify-center">
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: [0.8, 1.4, 1.1] }}
            transition={{ duration: 0.6, times: [0, 0.6, 1], ease: "easeOut" }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-500/30"
          >
            <MotionDiv
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 400 }}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-600/40"
            >
              <Check className="w-8 h-8 stroke-[3]" />
            </MotionDiv>
          </MotionDiv>

          {/* Sparkles Particle Accents */}
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 0], y: -20 }}
            transition={{ delay: 0.3, duration: 1, repeat: Infinity, repeatDelay: 0.2 }}
            className="absolute -top-2 -right-2 text-amber-300"
          >
            <Sparkles className="w-5 h-5" />
          </MotionDiv>
        </div>

        {/* Text Details */}
        <div className="space-y-1.5 max-w-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Login Berhasil
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Selamat Datang!
          </h2>
          <p className="text-xs text-white/80 font-medium truncate max-w-[260px] mx-auto">
            {userName}
          </p>
          <div className="pt-1">
            <span className="inline-block text-[11px] font-extrabold text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Akses Portal {roleLabel}
            </span>
          </div>
        </div>

        {/* Progress Fill Bar before redirect */}
        <div className="w-full max-w-xs space-y-1.5 pt-2">
          <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden p-0.5 border border-white/20">
            <MotionDiv
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-white rounded-full shadow-sm"
            />
          </div>
          <p className="text-[11px] font-bold text-white/70 animate-pulse">
            Mengalihkan ke dashboard...
          </p>
        </div>
      </MotionDiv>
    );
  }

  return (
    <div className="w-full space-y-5 [perspective:1200px]">
      {/* Interactive Role Selection Pills */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-black uppercase tracking-wider text-white/80">
          Login Sebagai
        </label>

        <div className="grid grid-cols-3 p-1.5 bg-[#1e0873]/60 backdrop-blur-md rounded-2xl border border-white/20 gap-1 relative">
          {[
            { id: "Student", label: "Siswa", icon: GraduationCap },
            { id: "Teacher", label: "Guru", icon: BookOpen },
            { id: "Admin", label: "Admin", icon: ShieldAlert },
          ].map((roleItem) => {
            const isActive = loginType === roleItem.id;
            const IconComponent = roleItem.icon;
            return (
              <button
                key={roleItem.id}
                type="button"
                onClick={() => setLoginType(roleItem.id)}
                className={`relative py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? roleItem.id === "Admin"
                      ? "text-slate-950"
                      : "text-[#2c1ee8]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {isActive && (
                  <MotionDiv
                    layoutId="activeRoleTab"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className={`absolute inset-0 rounded-xl shadow-md ${
                      roleItem.id === "Admin"
                        ? "bg-amber-400 shadow-amber-500/20"
                        : "bg-white shadow-black/20"
                    }`}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <IconComponent
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? roleItem.id === "Admin"
                          ? "text-slate-950"
                          : "text-[#2c1ee8]"
                        : "text-white/70"
                    }`}
                  />
                  <span>{roleItem.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D ROTATION FLIP CONTAINER ON OPTION SELECT */}
      <AnimatePresenceComponent mode="wait">
        <MotionDiv
          key={loginType}
          initial={{ rotateY: -90, opacity: 0.1, scale: 0.94 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1 }}
          exit={{ rotateY: 90, opacity: 0.1, scale: 0.94 }}
          transition={{ duration: 0.42, type: "spring", stiffness: 280, damping: 24 }}
          style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          className="w-full space-y-4"
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errorMessage && (
              <ErrorAlert
                title="Login Gagal"
                message={errorMessage}
                onClose={() => setErrorMessage("")}
              />
            )}

            {/* Identifier Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-white/90">
                {loginType === "Student"
                  ? "NIS / NISN"
                  : loginType === "Teacher"
                  ? "NIP / Email"
                  : "Email / Username Admin"}
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
                leftIcon={<User className="w-4 h-4 text-[#2c1ee8]" />}
                value={identifier}
                onFocus={handleIdentifierFocus}
                onChange={handleIdentifierChange}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-white/90">Password</label>
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                isRequired
                variant="dark"
                leftIcon={<Lock className="w-4 h-4 text-[#2c1ee8]" />}
                onFocus={handlePasswordFocus}
                rightIcon={
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end pt-0.5">
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
              className={`font-black py-3.5 text-sm sm:text-base rounded-2xl mt-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-xl ${
                loginType === "Admin"
                  ? "!bg-amber-400 hover:!bg-amber-300 !text-slate-950 shadow-amber-500/20"
                  : "!bg-white !text-[#2c1ee8] hover:!bg-slate-100 shadow-white/20"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Memverifikasi Akun...</span>
                </div>
              ) : (
                `Masuk Sebagai ${
                  loginType === "Student" ? "Siswa" : loginType === "Teacher" ? "Guru" : "Admin"
                }`
              )}
            </Button>
          </form>
        </MotionDiv>
      </AnimatePresenceComponent>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
};

export default LoginForm;
