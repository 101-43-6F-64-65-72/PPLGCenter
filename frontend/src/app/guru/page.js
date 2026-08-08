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

  const displayName = user?.fullName || user?.name || "Guru";

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-16">
        {/* Banner Header */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#2c1ee8] text-xs font-extrabold tracking-wide mb-3 border border-blue-100">
                <GraduationCap className="w-4 h-4" />
                <span>PANEL GURU & PEMBINA KEGIATAN</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Panel Guru & Pembina
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mt-2">
                Pusat verifikasi dan persetujuan kegiatan kesiswaan SMKN 2 Surakarta. Tinjau proposal kegiatan serta pengawasan unit ekstrakurikuler binaan.
              </p>
            </div>

            {/* Dynamic Profile & Role Badges (DB Sourced) */}
            <div className="bg-gray-50 p-4 sm:p-5 rounded-3xl border border-gray-200/80 flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-[#2c1ee8] text-white flex items-center justify-center font-bold text-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold block">Hak Akses Terautentikasi:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2c1ee8] text-xs font-black">
                    <UserCheck className="w-3 h-3" />
                    Guru
                  </span>

                  {/* Render dynamic Pembina badges only if DB relation exists */}
                  {supervisedExtracurriculars.map((ekskul) => (
                    <span
                      key={ekskul.id || ekskul.name}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200"
                    >
                      <Award className="w-3 h-3 text-emerald-600" />
                      Pembina {ekskul.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-100 pt-2 scrollbar-none">
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#2c1ee8] text-white shadow-md shadow-blue-500/20"
                      : "bg-gray-100/80 text-gray-600 hover:bg-gray-200"
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

