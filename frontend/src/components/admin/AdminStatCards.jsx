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
    { id: "total-students", title: "Total Siswa", value: summary?.totalStudents ?? "—", icon: GraduationCap },
    { id: "total-teachers", title: "Total Guru", value: summary?.totalTeachers ?? "—", icon: BookOpen },
    { id: "total-classes", title: "Total Kelas", value: summary?.totalClasses ?? "—", icon: Layers },
    { id: "total-departments", title: "Total Jurusan", value: summary?.totalDepartments ?? "—", icon: Award },
    { id: "total-extracurriculars", title: "Ekstrakurikuler", value: summary?.totalExtracurriculars ?? "—", icon: Activity },
    { id: "active-members", title: "Anggota Aktif", value: summary?.totalActiveMembers ?? "—", icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 font-sans">
      {cards.map((item) => {
        const IconComp = item.icon;
        return (
          <div
            key={item.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[110px] transition-all hover:shadow-md hover:border-blue-200/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.title}</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#2c1ee8] border border-blue-100">
                <IconComp className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-14 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
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
