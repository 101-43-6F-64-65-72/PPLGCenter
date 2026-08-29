"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  BookOpen,
  Layers,
  Briefcase,
  Building2,
  Bell,
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
    { id: "total-students", title: "Total Siswa", value: summary?.totalStudents ?? "—", icon: GraduationCap },
    { id: "total-teachers", title: "Total Guru", value: summary?.totalTeachers ?? "—", icon: BookOpen },
    { id: "total-classes", title: "Total Kelas", value: summary?.totalClasses ?? "—", icon: Layers },
    { id: "total-departments", title: "Jurusan", value: summary?.totalDepartments ?? "—", icon: Briefcase },
    { id: "total-facilities", title: "Fasilitas Lab", value: summary?.totalFacilities ?? summary?.totalClassrooms ?? "—", icon: Building2 },
    { id: "total-announcements", title: "Pengumuman", value: summary?.totalAnnouncements ?? "—", icon: Bell },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 font-sans text-left">
      {cards.map((item) => {
        const IconComp = item.icon;
        return (
          <div
            key={item.id}
            className="bg-white p-4 rounded-none border border-slate-200 shadow-xs flex flex-col justify-between min-h-[105px] transition-colors hover:border-[#2C1EE8]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider leading-none">
                {item.title}
              </span>
              <div className="p-1 rounded-none bg-blue-50 text-[#2C1EE8] border border-blue-100">
                <IconComp className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-none animate-pulse" />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none font-mono">
                  {item.value}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
