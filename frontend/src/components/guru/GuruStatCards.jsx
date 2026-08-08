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
      subtext: ekskulNames ? `Dari unit: ${ekskulNames}` : "Proposal dari unit binaan",
      icon: FileText,
      badge: pendingProposalCount > 0 ? "Perlu Tindakan" : "Selesai",
      badgeColor: pendingProposalCount > 0 
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentBg: "bg-amber-50 text-amber-600",
    },
    {
      id: "facility-approval",
      title: "Persetujuan Peminjaman",
      value: String(pendingSessionCount),
      subtext: "Sesi & fasilitas aktif",
      icon: Building2,
      badge: "Real-time",
      badgeColor: "bg-blue-50 text-[#2c1ee8] border-blue-200",
      accentBg: "bg-blue-50 text-[#2c1ee8]",
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
      accentBg: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "total-verified",
      title: "Total Verifikasi Selesai",
      value: String(completedReviewCount),
      subtext: "Proposal telah direview",
      icon: CheckCircle2,
      badge: "Verifikasi Guru",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      accentBg: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((item) => {
        const IconComp = item.icon;
        return (
          <div
            key={item.id}
            className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${item.accentBg}`}>
                <IconComp className="w-6 h-6" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>

            <div>
              <span className="text-3xl sm:text-4xl font-black text-gray-900 leading-none">
                {item.value}
              </span>
              <h4 className="text-sm font-bold text-gray-800 mt-1">
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

