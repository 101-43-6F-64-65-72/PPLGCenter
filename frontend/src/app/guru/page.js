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
        {/* Top Clean Header */}
        <div className="mb-6 border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                PANEL TENAGA PENDIDIK & PEMBINA SMKN 2 SURAKARTA
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {displayName}
              </h1>
            </div>

            {/* Profile & Role Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guru Pengampu</span>
              </span>
              {supervisedExtracurriculars.map((ekskul) => (
                <span
                  key={ekskul.id || ekskul.name}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Pembina {ekskul.name}
                </span>
              ))}
            </div>
          </div>

          {/* Dynamic Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 border-b border-slate-200 pt-4 scrollbar-none">
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#2c1ee8] text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
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

