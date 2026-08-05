"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";

/**
 * Client-Side AuthGuard Wrapper
 * Displays loading spinner while AuthContext resolves, redirects to /login if unauthenticated.
 */
export const AuthGuard = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!isDev && !loading && !isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isDev, isAuthenticated, loading, pathname, router]);

  // Development preview only.
  if (isDev) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white shadow-xl border border-gray-100 max-w-sm w-full text-center">
          <LoadingSpinner size="lg" color="primary" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Memuat Sesi...</h3>
            <p className="text-xs text-gray-500 mt-1">
              Mohon tunggu sejenak, mengidentifikasi pengguna.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
