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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((item) => {
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
              {loading ? (
                <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 block tracking-tight">
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
