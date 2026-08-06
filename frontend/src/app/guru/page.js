"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import GuruStatCards from "@/components/guru/GuruStatCards";
import GuruProposalTab from "@/components/guru/GuruProposalTab";
import GuruFacilityTab from "@/components/guru/GuruFacilityTab";
import {
  LayoutDashboard,
  FileText,
  Building2,
  ShieldCheck,
  GraduationCap
} from "lucide-react";

export default function GuruPanelPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
      <GuruPanelContent />
    </AuthGuard>
  );
}

function GuruPanelContent() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'proposals' | 'facilities'

  const tabs = [
    { id: "overview", label: "Overview Guru", icon: LayoutDashboard },
    { id: "proposals", label: "Persetujuan Proposal", icon: FileText },
    { id: "facilities", label: "Persetujuan Fasilitas", icon: Building2 },
  ];

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
                <span>PANEL GURU PEMBINA & WAKA KESISWAAN</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Panel Guru & Pembina
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mt-2">
                Pusat verifikasi dan persetujuan kegiatan kesiswaan SMKN 2 Surakarta. Tinjau proposal kegiatan ekstrakurikuler serta persetujuan penggunaan fasilitas sekolah.
              </p>
            </div>

            {/* Quick Info Pill */}
            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2c1ee8] text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-bold block">Role Akses Pengguna:</span>
                <span className="text-xs font-black text-gray-900">Guru Pembina / Tenaga Pendidik</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
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
            <GuruStatCards />

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

        {activeTab === "proposals" && <GuruProposalTab />}
        {activeTab === "facilities" && <GuruFacilityTab />}
      </main>
      <Footer />
    </div>
  );
}
