"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { ROLE_LABELS } from "@/constants/userRoles";

/**
 * Client-Side AuthGuard & RoleGuard Wrapper
 * Enforces strict authentication and role-based access verification.
 * Even if a user manually forces the URL, access will be blocked if unauthenticated or unauthorized.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - Optional list of allowed roles (e.g. ["Admin", "Teacher", "OSIS"])
 */
export const AuthGuard = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, loading, role, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
<<<<<<< HEAD

  const userRole = role || user?.role || "Student";
=======
  const isDev = process.env.NODE_ENV === "development";
>>>>>>> c6427a23d5c889fa58b1e0348c871c51ae22edb1

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
              Verifikasi identitas dan hak akses pengguna...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Verification for unauthenticated visitors
  if (!isAuthenticated) {
    return null;
  }

  // 2. Verification for role authorization if allowedRoles is specified
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const hasRoleAccess = allowedRoles.some(
      (r) => r.toLowerCase() === userRole.toLowerCase()
    );

    if (!hasRoleAccess) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
          <div className="flex flex-col items-center gap-5 p-8 sm:p-10 rounded-3xl bg-white shadow-xl border border-red-100 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-inner">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider mb-2">
                403 Forbidden Access
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Akses Ditolak</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Akun Anda terdaftar sebagai <span className="font-bold text-gray-800">{ROLE_LABELS[userRole] || userRole}</span>. 
                Anda tidak memiliki hak akses untuk membuka halaman panel ini.
              </p>
            </div>

            <div className="pt-2 w-full flex flex-col gap-2.5">
              <Link
                href="/"
                className="w-full py-3 px-4 rounded-xl bg-[#2c1ee8] text-white font-bold text-sm shadow-md shadow-[#2c1ee8]/20 hover:bg-blue-700 transition-colors"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="/profile"
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs hover:bg-gray-200 transition-colors"
              >
                Lihat Profil Saya
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
