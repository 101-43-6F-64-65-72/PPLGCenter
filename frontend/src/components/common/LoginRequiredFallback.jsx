"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ErrorFallback from "@/components/ErrorFallback";

/**
 * Reusable Login Required Fallback Component
 * Renders ErrorFallback in embedded mode when an unauthenticated visitor tries to access protected feature data.
 */
export const LoginRequiredFallback = ({
  title,
  description,
  featureName = "Fitur Ini",
  redirectPath = null,
  className = "",
}) => {
  const pathname = usePathname();
  const targetUrl = redirectPath || pathname || "/";
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(targetUrl)}`;

  const defaultTitle = `Akses ${featureName} Memerlukan Login`;
  const defaultDesc = `Untuk melihat informasi lengkap ${featureName.toLowerCase()} dan berinteraksi di Student Center SMK Negeri 2 Surakarta, silakan masuk terlebih dahulu dengan akun siswa atau guru Anda.`;

  return (
    <div className={`w-full py-8 flex justify-center ${className}`}>
      <ErrorFallback
        statusCode={401}
        title={title || defaultTitle}
        description={description || defaultDesc}
        primaryAction={{ label: "Login Sekarang", href: loginUrl }}
        secondaryAction={{ label: "Ke Beranda", href: "/" }}
        fullPage={false}
      />
    </div>
  );
};

export default LoginRequiredFallback;
