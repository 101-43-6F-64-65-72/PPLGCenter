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
export const useLogin = () => {
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
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setErrorMessage("");
      setIsSubmitting(true);
      await login(data);
      router.push(callbackUrl);
    } catch (error) {
      setErrorMessage(
        error.message || "Gagal masuk. Silakan periksa NIS/NIP dan password Anda."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    errorMessage,
    clearError: () => setErrorMessage(""),
  };
};

export default useLogin;
