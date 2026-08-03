"use client";

import React from "react";
import { FileText, Building2, Award, CheckCircle2, Clock, Users, ShieldCheck } from "lucide-react";

export default function GuruStatCards() {
  const stats = [
    {
      id: "proposal-acc",
      title: "Proposal Menunggu ACC Guru",
      value: "3",
      subtext: "2 dari Ekskul Binaan",
      icon: FileText,
      badge: "Perlu Tindakan",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      accentBg: "bg-blue-50 text-[#2c1ee8]",
    },
    {
      id: "facility-approval",
      title: "Persetujuan Peminjaman",
      value: "5",
      subtext: "3 disetujui minggu ini",
      icon: Building2,
      badge: "Real-time",
      badgeColor: "bg-blue-50 text-[#2c1ee8] border-blue-200",
      accentBg: "bg-blue-50 text-[#2c1ee8]",
    },
    {
      id: "ekskul-binaan",
      title: "Ekskul Binaan Saya",
      value: "2",
      subtext: "Pramuka & Basketball Club",
      icon: Award,
      badge: "Aktif",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentBg: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "total-verified",
      title: "Total Verifikasi Selesai",
      value: "28",
      subtext: "Semester Genap 2026",
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
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {item.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
