"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "../schemas/loginSchema";
import useAuth from "@/hooks/useAuth";

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

  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

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
      await login(data);
      if (typeof onSuccess === "function") {
        onSuccess();
      }
      router.push(callbackUrl);
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
