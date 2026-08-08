"use client";

import React, { useState, useEffect } from "react";
import {
  Users, GraduationCap, BookOpen, Layers, Award, Activity
} from "lucide-react";
import dashboardService from "@/services/dashboardService";

export default function AdminStatCards() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getSummary()
      .then((res) => {
        const data = res?.data || res;
        if (data) setSummary(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      id: "total-students",
      title: "Total Siswa",
      value: summary?.totalStudents ?? "—",
      subtext: "Siswa terdaftar di sistem",
      icon: GraduationCap,
      badge: "Siswa",
      badgeColor: "bg-blue-50 text-[#2c1ee8] border-blue-200",
      accentBg: "bg-blue-50 text-[#2c1ee8]",
    },
    {
      id: "total-teachers",
      title: "Total Guru",
      value: summary?.totalTeachers ?? "—",
      subtext: "Pengajar aktif di sistem",
      icon: BookOpen,
      badge: "Guru",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentBg: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "total-classes",
      title: "Total Kelas",
      value: summary?.totalClasses ?? "—",
      subtext: "Kelas aktif tahun ajaran ini",
      icon: Layers,
      badge: "Kelas",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
      accentBg: "bg-violet-50 text-violet-600",
    },
    {
      id: "total-departments",
      title: "Total Jurusan",
      value: summary?.totalDepartments ?? "—",
      subtext: "Program keahlian terdaftar",
      icon: Award,
      badge: "Jurusan",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      accentBg: "bg-amber-50 text-amber-600",
    },
    {
      id: "total-extracurriculars",
      title: "Ekstrakurikuler",
      value: summary?.totalExtracurriculars ?? "—",
      subtext: "Unit kegiatan aktif",
      icon: Activity,
      badge: "UKS",
      badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
      accentBg: "bg-pink-50 text-pink-600",
    },
    {
      id: "active-members",
      title: "Anggota Aktif",
      value: summary?.totalActiveMembers ?? "—",
      subtext: "Anggota aktif ekstrakurikuler",
      icon: Users,
      badge: "Members",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      accentBg: "bg-cyan-50 text-cyan-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((item) => {
        const IconComp = item.icon;
        return (
          <div
            key={item.id}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.accentBg}`}>
                <IconComp className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>

            <div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <span className="text-2xl font-black text-gray-900 leading-none">{item.value}</span>
              )}
              <p className="text-[10px] text-gray-500 mt-1 font-medium leading-tight">{item.title}</p>
              <p className="text-[10px] text-gray-400 font-medium leading-tight">{item.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
