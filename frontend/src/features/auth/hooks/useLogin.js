"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "../schemas/loginSchema";
import useAuth from "@/hooks/useAuth";

/**
 * Resolve the post-login redirect destination based on role.
 * Admin  → /admin
 * Others → /dashboard
 */
function resolveRedirect(role, callbackUrl) {
  // If an explicit callbackUrl was provided (e.g. from AuthGuard), honour it
  if (callbackUrl && callbackUrl !== "/profile" && callbackUrl !== "/") {
    return callbackUrl;
  }
  const normalizedRole = (role || "").toLowerCase();
  if (normalizedRole === "admin") return "/admin";
  return "/dashboard";
}

/**
 * Custom hook encapsulating all Login Form logic & submission
 */
export const useLogin = (options = {}) => {
  const { onSuccess } = options;
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setErrorMessage("");
      setIsSubmitting(true);
      const res = await login(data);

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      // Determine effective role from login response
      const resData = res?.data || res;
      const effectiveRole = resData?.userType || resData?.role || resData?.user?.role || "Student";
      const destination = resolveRedirect(effectiveRole, callbackUrl);
      router.push(destination);
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Gagal masuk. Silakan periksa ID Akun dan password Anda.";
      setErrorMessage(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (formErrors) => {
    const firstError =
      formErrors?.identifier?.message ||
      formErrors?.password?.message ||
      "Mohon isi ID Akun dan Password dengan benar.";
    setErrorMessage(firstError);
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit, onInvalid),
    errors,
    isSubmitting,
    errorMessage,
    clearError: () => setErrorMessage(""),
  };
};

export default useLogin;
