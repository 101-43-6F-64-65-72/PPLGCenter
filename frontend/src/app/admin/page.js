"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import AdminStatCards from "@/components/admin/AdminStatCards";
import AdminProposalTab from "@/components/admin/AdminProposalTab";
import AdminFacilityTab from "@/components/admin/AdminFacilityTab";
import AdminAnnouncementsTab from "@/components/admin/AdminAnnouncementsTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import {
  LayoutDashboard,
  FileCheck,
  Building2,
  Newspaper,
  ShieldAlert,
  Users,
  Settings
} from "lucide-react";

export default function AdminPanelPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.ADMIN]}>
      <AdminPanelContent />
    </AuthGuard>
  );
}

function AdminPanelContent() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'proposals' | 'facilities' | 'announcements' | 'users'

  const tabs = [
    { id: "overview", label: "Overview Admin", icon: LayoutDashboard },
    { id: "users", label: "Kelola & Registrasi Akun", icon: Users },
    { id: "proposals", label: "Persetujuan Proposal Final", icon: FileCheck },
    { id: "facilities", label: "Kelola Sarpras & Booking", icon: Building2 },
    { id: "announcements", label: "Publikasi Mading", icon: Newspaper },
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
                <ShieldAlert className="w-4 h-4" />
                <span>PANEL KONTROL KESISWAAN & SUPER ADMIN</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Panel Super Admin
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mt-2">
                Pusat kontrol utama sistem Student Center SMKN 2 Surakarta. Verifikasi persetujuan akhir proposal kegiatan, manajemen inventaris fasilitas sekolah, serta publikasi mading digital resmi.
              </p>
            </div>

            {/* Quick Info Pill */}
            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2c1ee8] text-white flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-bold block">Hak Akses Sesi:</span>
                <span className="text-xs font-black text-gray-900">Super Admin / Waka Kesiswaan</span>
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
            <AdminStatCards />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Proposal Quick Section */}
              <div className="lg:col-span-7">
                <AdminProposalTab />
              </div>

              {/* Facility Quick Section */}
              <div className="lg:col-span-5">
                <AdminFacilityTab />
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && <AdminUsersTab />}
        {activeTab === "proposals" && <AdminProposalTab />}
        {activeTab === "facilities" && <AdminFacilityTab />}
        {activeTab === "announcements" && <AdminAnnouncementsTab />}
      </main>
    </div>
  );
}
