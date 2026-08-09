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
      subtext: "Siswa terdaftar",
      icon: GraduationCap,
      badge: "Siswa",
      badgeColor: "bg-blue-50 text-[#2c1ee8] border-blue-200",
      accentBg: "bg-blue-100 text-[#2c1ee8] border border-blue-200",
    },
    {
      id: "total-teachers",
      title: "Total Guru",
      value: summary?.totalTeachers ?? "—",
      subtext: "Pengajar aktif",
      icon: BookOpen,
      badge: "Guru",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentBg: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
    {
      id: "total-classes",
      title: "Total Kelas",
      value: summary?.totalClasses ?? "—",
      subtext: "Tahun ajaran ini",
      icon: Layers,
      badge: "Kelas",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
      accentBg: "bg-violet-100 text-violet-700 border border-violet-200",
    },
    {
      id: "total-departments",
      title: "Total Jurusan",
      value: summary?.totalDepartments ?? "—",
      subtext: "Program keahlian",
      icon: Award,
      badge: "Jurusan",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      accentBg: "bg-amber-100 text-amber-700 border border-amber-200",
    },
    {
      id: "total-extracurriculars",
      title: "Ekstrakurikuler",
      value: summary?.totalExtracurriculars ?? "—",
      subtext: "Unit kegiatan aktif",
      icon: Activity,
      badge: "Ekskul",
      badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
      accentBg: "bg-pink-100 text-pink-700 border border-pink-200",
    },
    {
      id: "active-members",
      title: "Anggota Aktif",
      value: summary?.totalActiveMembers ?? "—",
      subtext: "Peserta ekskul",
      icon: Users,
      badge: "Anggota",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      accentBg: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((item) => {
        const IconComp = item.icon;
        return (
          <div
            key={item.id}
            className="group bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-2xs ${item.accentBg}`}>
                <IconComp className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>

            <div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none block tracking-tight">
                  {item.value}
                </span>
              )}
              <p className="text-xs font-extrabold text-gray-800 mt-1.5 leading-tight">{item.title}</p>
              <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{item.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
