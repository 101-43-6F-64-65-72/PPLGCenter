"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Lock, Eye, EyeOff } from "@/components/common/Icons";
import useLogin from "../hooks/useLogin";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorAlert from "@/components/common/ErrorAlert";

export const LoginForm = () => {
  const { register, handleSubmit, errors, isSubmitting, errorMessage, clearError } =
    useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full" noValidate>
      {errorMessage && (
        <ErrorAlert
          title="Login Gagal"
          message={errorMessage}
          onClose={clearError}
        />
      )}

      {/* Identifier Input (NIS/NISN/NIP) */}
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="Contoh: admin@studentcenter.id"
        isRequired
        variant="dark"
        leftIcon={<User className="w-5 h-5 text-[#2c1ee8]" />}
        error={errors.email?.message}
        {...register("email")}
      />

      {/* Password Input */}
      <Input
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        placeholder="Masukkan password Anda"
        isRequired
        variant="dark"
        leftIcon={<Lock className="w-5 h-5 text-[#2c1ee8]" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-500 hover:text-[#2c1ee8] transition-colors focus:outline-none"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        }
        error={errors.password?.message}
        {...register("password")}
      />

      {/* Forgot Password Link */}
      <div className="flex justify-end text-sm">
        <Link
          href="#"
          className="font-medium text-white/90 hover:text-white underline decoration-white/40 hover:decoration-white transition-all"
        >
          Lupa password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
        className="!bg-white !text-[#2c1ee8] hover:!bg-slate-100 shadow-xl shadow-white/20 font-bold py-4 text-base rounded-2xl"
      >
        Masuk Ke Student Center
      </Button>
    </form>
  );
};

export default LoginForm;
