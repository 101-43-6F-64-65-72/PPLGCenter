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
      title: "Proposal Menunggu ACC",
      value: String(pendingProposalCount),
      icon: FileText,
    },
    {
      id: "facility-approval",
      title: "Persetujuan Peminjaman",
      value: String(pendingSessionCount),
      icon: Building2,
    },
    {
      id: "ekskul-binaan",
      title: "Ekskul Binaan Saya",
      value: String(supervisedCount),
      icon: Award,
    },
    {
      id: "total-verified",
      title: "Verifikasi Selesai",
      value: String(completedReviewCount),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((item) => {
        const IconComp = item.icon;
        return (
          <div
            key={item.id}
            className="bg-white p-4 rounded-lg border border-slate-200 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.title}</span>
              <IconComp className="w-4 h-4 text-slate-400" />
            </div>

            <div>
              <span className="text-2xl font-bold text-slate-900 block tracking-tight">
                {item.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
