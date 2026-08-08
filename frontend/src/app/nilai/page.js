"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import StudentGradesTab from "@/components/student/StudentGradesTab";

export default function StudentGradesPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.ADMIN, USER_ROLES.TEACHER]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-16">
          <div className="mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
              📊 KARTU HASIL BUKU NILAI & RAPOR
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">Nilai & Transkrip Akademik</h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Lihat rincian nilai per mata pelajaran, riwayat kuis & tugas, IPK semester, serta ringkasan rapor akademik Anda.
            </p>
          </div>

          <StudentGradesTab />
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
