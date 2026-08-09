"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import useAuth from "@/hooks/useAuth";
import { extracurricularService } from "@/services/extracurricularService";
import { dashboardService } from "@/services/dashboardService";
import GuruStatCards from "@/components/guru/GuruStatCards";
import GuruProposalTab from "@/components/guru/GuruProposalTab";
import GuruFacilityTab from "@/components/guru/GuruFacilityTab";
import GuruSupervisedTab from "@/components/guru/GuruSupervisedTab";
import TeacherGradebookTab from "@/components/teacher/TeacherGradebookTab";
import {
  LayoutDashboard,
  FileText,
  Building2,
  ShieldCheck,
  GraduationCap,
  Award,
  UserCheck
} from "lucide-react";

export default function GuruPanelPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
      <GuruPanelContent />
    </AuthGuard>
  );
}

function GuruPanelContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'gradebook' | 'supervised' | 'proposals' | 'facilities'
  const [supervisedExtracurriculars, setSupervisedExtracurriculars] = useState([]);
  const [teacherDash, setTeacherDash] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live supervised extracurriculars directly from PostgreSQL source of truth
  const loadTeacherData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [supRes, dashRes] = await Promise.all([
        extracurricularService.getSupervisedByMe().catch(() => ({ data: [] })),
        dashboardService.getTeacherDashboard().catch(() => ({ data: null })),
      ]);

      const liveSupervised = supRes?.data || dashRes?.data?.advisingExtracurriculars || [];
      setSupervisedExtracurriculars(liveSupervised);
      if (dashRes?.data) setTeacherDash(dashRes.data);
    } catch (err) {
      console.error("Failed to load teacher panel data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) loadTeacherData();
    });
    return () => {
      isMounted = false;
    };
  }, [loadTeacherData]);

  // Construct dynamic tabs list: Tab 'Ekskul Binaan' appears ONLY if teacher supervises at least 1 unit
  const tabs = [
    { id: "overview", label: "Overview Guru", icon: LayoutDashboard },
    { id: "gradebook", label: "Buku Nilai (Gradebook)", icon: Award },
  ];

  if (supervisedExtracurriculars.length > 0) {
    tabs.push({ id: "supervised", label: "Ekskul Binaan", icon: Award });
  }

  tabs.push(
    { id: "proposals", label: "Persetujuan Proposal", icon: FileText },
    { id: "facilities", label: "Persetujuan Fasilitas", icon: Building2 }
  );

  const displayName = user?.fullName || user?.name || "Guru & Pembina";

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-16">
        {/* Banner Header (Executive Gradient Card) */}
        <div className="mb-8 space-y-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#071329] via-[#0f172a] to-[#2c1ee8] p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-slate-900/10 border border-white/10">
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-blue-200 text-xs font-black tracking-wide border border-white/20">
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                  <span>PANEL GURU & PEMBINA KEGIATAN</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Selamat Datang, {displayName}
                </h1>

                <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
                  Pusat kontrol dan verifikasi kegiatan kesiswaan SMKN 2 Surakarta. Tinjau permohonan proposal, pengajuan fasilitas, serta pengawasan unit binaan Anda.
                </p>
              </div>

              {/* Profile & Role Badge Card */}
              <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/20 space-y-2 shrink-0 max-w-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Hak Akses Terautentikasi</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/30 text-white text-xs font-black border border-blue-400/40">
                    <UserCheck className="w-3.5 h-3.5 text-blue-300" />
                    Guru Pengampu
                  </span>
                  {supervisedExtracurriculars.map((ekskul) => (
                    <span
                      key={ekskul.id || ekskul.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/30 text-emerald-200 text-xs font-black border border-emerald-400/40"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-300" />
                      Pembina {ekskul.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200 pt-2 scrollbar-none">
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#2c1ee8] text-white shadow-md shadow-blue-500/25 active:scale-95"
                      : "bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <GuruStatCards
              teacherDash={teacherDash}
              supervisedExtracurriculars={supervisedExtracurriculars}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Proposal Quick Section */}
              <div className="lg:col-span-7">
                <GuruProposalTab />
              </div>

              {/* Facility Quick Section */}
              <div className="lg:col-span-5">
                <GuruFacilityTab />
              </div>
            </div>
          </div>
        )}

        {activeTab === "gradebook" && <TeacherGradebookTab />}
        {activeTab === "supervised" && (
          <GuruSupervisedTab
            supervisedExtracurriculars={supervisedExtracurriculars}
            teacherName={displayName}
          />
        )}
        {activeTab === "proposals" && <GuruProposalTab />}
        {activeTab === "facilities" && <GuruFacilityTab />}
      </main>
      <Footer />
    </div>
  );
}

