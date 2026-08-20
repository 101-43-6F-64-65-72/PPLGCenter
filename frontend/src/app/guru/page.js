"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function GuruPanelPage() {
  const router = useRouter();
  const { user, role, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      const userRole = (role || user?.role || "").toString().toLowerCase();
      const position = (user?.position || "").toString().toLowerCase();
      const isPplgTeacher = userRole === "teacher" && (position.includes("pengembangan perangkat lunak dan gim") || position.includes("pplg"));
      const isAdminOrPplg = userRole === "admin" || isPplgTeacher;

      if (isAdminOrPplg) {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [loading, isAuthenticated, role, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold text-sm">
      Mengarahkan ke panel...
    </div>
  );
}
