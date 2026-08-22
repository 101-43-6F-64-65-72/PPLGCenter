"use client";

import React from "react";
import { usePathname } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import Skeleton from "@/components/ui/Skeleton";
import { ROLE_LABELS } from "@/constants/userRoles";
import UnauthorizedPage from "@/components/UnauthorizedPage";

/**
 * Client-Side AuthGuard & RoleGuard Wrapper
 * Enforces strict authentication and role-based access verification.
 * Renders UnauthorizedPage (ErrorFallback 401/403) for unauthenticated/unauthorized users without auto-redirecting.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - Optional list of allowed roles (e.g. ["Admin", "Teacher", "OSIS"])
 */
export const AuthGuard = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, loading, role, user } = useAuth();
  const pathname = usePathname();

  const userRole = role || user?.role || "Student";

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white shadow-xl border border-gray-100 max-w-sm w-full text-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="w-full space-y-2 flex flex-col items-center">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // 1. Verification for unauthenticated visitors: Render Unauthorized Error Page (NO auto-redirect)
  if (!isAuthenticated) {
    return (
      <UnauthorizedPage
        statusCode={401}
        title="Akses Terbatas (401 - Unauthorized)"
        subtitle="Kamu harus masuk (login) dengan akun terdaftar untuk mengakses ekosistem dan modul ini."
        loginUrl={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
        homeUrl="/"
        fullPage={true}
      />
    );
  }

  // 2. Verification for role authorization if allowedRoles is specified
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const position = (user?.position || "").toString().toLowerCase();
    const isPplgTeacher = userRole.toLowerCase() === "teacher" && (position.includes("pengembangan perangkat lunak dan gim") || position.includes("pplg"));

    const hasRoleAccess = allowedRoles.some((r) => {
      const rLower = r.toLowerCase();
      if (rLower === "admin" && isPplgTeacher) return true;
      return rLower === userRole.toLowerCase();
    });

    if (!hasRoleAccess) {
      return (
        <UnauthorizedPage
          statusCode={403}
          title="Akses Ditolak (Forbidden)"
          subtitle={`Akun Anda terdaftar sebagai ${ROLE_LABELS[userRole] || userRole}. Anda tidak memiliki hak akses untuk membuka halaman panel ini.`}
          loginUrl={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
          homeUrl="/"
          fullPage={true}
        />
      );
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
