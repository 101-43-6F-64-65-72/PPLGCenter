"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import StudentGradesTab from "@/components/student/StudentGradesTab";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { Award } from "lucide-react";

export default function StudentGradesPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.ADMIN, USER_ROLES.TEACHER]}>
      <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-16 space-y-6">
          <PageHeader
            icon={Award}
            title="Nilai & Transkrip Akademik"
            description="Lihat rincian nilai per mata pelajaran, riwayat kuis & tugas, IPK semester, serta ringkasan rapor akademik Anda."
            badge={<Badge variant="info">Buku Nilai & Rapor</Badge>}
          />

          <StudentGradesTab />
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}

