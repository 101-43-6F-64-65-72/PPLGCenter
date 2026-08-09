"use client";

import React from "react";
import { FileText, Building2, Award, CheckCircle2 } from "lucide-react";

export default function GuruStatCards({ teacherDash, supervisedExtracurriculars = [] }) {
  const pendingProposalCount = teacherDash?.pendingProposalsCount ?? 0;
  const supervisedCount = supervisedExtracurriculars.length || (teacherDash?.advisingExtracurricularCount ?? 0);
  const pendingSessionCount = teacherDash?.unopenedAttendanceSessionsCount ?? 0;
  const completedReviewCount = teacherDash?.completedVerificationCount ?? 0;

  const ekskulNames = supervisedExtracurriculars.map((e) => e.name).join(", ");

  const stats = [
    {
      id: "proposal-acc",
      title: "Proposal Menunggu ACC Guru",
      value: String(pendingProposalCount),
      subtext: ekskulNames ? `Unit: ${ekskulNames}` : "Proposal unit binaan",
      icon: FileText,
      badge: pendingProposalCount > 0 ? "Perlu Aksik" : "Selesai",
      badgeColor: pendingProposalCount > 0 
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentBg: "bg-amber-100 text-amber-700 border border-amber-200",
    },
    {
      id: "facility-approval",
      title: "Persetujuan Peminjaman",
      value: String(pendingSessionCount),
      subtext: "Sesi & fasilitas aktif",
      icon: Building2,
      badge: "Real-time",
      badgeColor: "bg-blue-50 text-[#2c1ee8] border-blue-200",
      accentBg: "bg-blue-100 text-[#2c1ee8] border border-blue-200",
    },
    {
      id: "ekskul-binaan",
      title: "Ekskul Binaan Saya",
      value: String(supervisedCount),
      subtext: ekskulNames || "Belum ada unit binaan",
      icon: Award,
      badge: supervisedCount > 0 ? "Aktif" : "Kosong",
      badgeColor: supervisedCount > 0 
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-gray-50 text-gray-500 border-gray-200",
      accentBg: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
    {
      id: "total-verified",
      title: "Total Verifikasi Selesai",
      value: String(completedReviewCount),
      subtext: "Proposal disetujui Guru",
      icon: CheckCircle2,
      badge: "Terverifikasi",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      accentBg: "bg-purple-100 text-purple-700 border border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((item) => {
        const IconComp = item.icon;
        return (
          <div
            key={item.id}
            className="group relative bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-2xs ${item.accentBg}`}>
                <IconComp className="w-6 h-6" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>

            <div>
              <span className="text-3xl sm:text-4xl font-black text-gray-900 leading-none block tracking-tight">
                {item.value}
              </span>
              <h4 className="text-sm font-extrabold text-gray-800 mt-2">
                {item.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1 font-medium line-clamp-1">
                {item.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
