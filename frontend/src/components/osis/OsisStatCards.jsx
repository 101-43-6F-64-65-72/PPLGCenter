"use client";

import React from "react";
import { FileText, Building2, Newspaper, Users } from "lucide-react";

export default function OsisStatCards({ summaryData, loading }) {
  const proposalsCount = summaryData?.totalProposalsCount ?? summaryData?.pendingProposalsCount ?? 0;
  const pendingProposals = summaryData?.pendingProposalsCount ?? 0;
  const bookingsCount = summaryData?.totalFacilitiesCount ?? 0;
  const madingCount = summaryData?.totalDiscussionCount ?? 0;
  const ekskulCount = summaryData?.totalExtracurriculars ?? summaryData?.totalExtracurricularsCount ?? 18;

  const stats = [
    {
      title: "Proposal Kegiatan",
      value: proposalsCount,
      subtext: pendingProposals > 0 ? `${pendingProposals} menunggu verifikasi` : "Proposal terdaftar di sistem",
      icon: FileText,
      color: "bg-blue-50 text-[#2c1ee8]",
      border: "border-blue-100",
      badge: "Real-time DB",
      badgeColor: "bg-blue-100 text-[#2c1ee8]",
    },
    {
      title: "Fasilitas Terdaftar",
      value: bookingsCount,
      subtext: "Sarpras & lokasi aktif",
      icon: Building2,
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
      badge: "Sarpras",
      badgeColor: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Pengumuman & Diskusi",
      value: madingCount,
      subtext: "Informasi aktif terpublikasi",
      icon: Newspaper,
      color: "bg-purple-50 text-purple-600",
      border: "border-purple-100",
      badge: "Mading",
      badgeColor: "bg-purple-100 text-purple-700",
    },
    {
      title: "Ekstrakurikuler Aktif",
      value: ekskulCount,
      subtext: "Binaan Pengurus OSIS",
      icon: Users,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
      badge: "SMKN 2 Surakarta",
      badgeColor: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className={`bg-white p-5 sm:p-6 rounded-3xl border ${stat.border} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center font-bold`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>

            <div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse my-1" />
              ) : (
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
              )}
              <p className="text-sm font-extrabold text-gray-800 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
