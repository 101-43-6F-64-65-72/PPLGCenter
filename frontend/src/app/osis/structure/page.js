"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import OrgChartTree from "@/components/pemilos/OrgChartTree";
import osisRecruitmentService from "@/services/osisRecruitmentService";
import { extracurricularService } from "@/services/extracurricularService";
import { GitBranch, ChevronDown, Loader2, Calendar, History } from "lucide-react";

export default function OsisStructurePage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.OSIS]}>
      <StructureContent />
    </AuthGuard>
  );
}

function StructureContent() {
  const [cabinetMembers, setCabinetMembers] = useState([]);
  const [osisInfo, setOsisInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears] = useState([
    { id: null, name: "Tahun Aktif" },
  ]);

  const loadCabinet = useCallback(async (yearId) => {
    setLoading(true);
    try {
      const res = await osisRecruitmentService.getCabinetStructure(yearId);
      const members = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setCabinetMembers(members);
    } catch (err) {
      console.error("Error loading cabinet structure:", err);
      setCabinetMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCabinet(selectedYear);
    extracurricularService
      .getExtracurriculars({ page: 1, pageSize: 50 })
      .then((res) => {
        const items = res?.data?.items || res?.data || res?.items || (Array.isArray(res) ? res : []);
        const osis = items.find((e) => e.name && e.name.toUpperCase().includes("OSIS"));
        if (osis) setOsisInfo(osis);
      })
      .catch((err) => {
        console.error("Error loading OSIS extracurricular info:", err);
      });
  }, [loadCabinet, selectedYear]);

  const currentYearLabel = availableYears.find((y) => y.id === selectedYear)?.name ?? "Tahun Aktif";

  // Group members by academic year for archive display
  const groupedByYear = cabinetMembers.reduce((acc, m) => {
    const key = m.academicYearName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold tracking-wide mb-3 border border-purple-200">
            <GitBranch className="w-4 h-4" />
            <span>STRUKTUR ORGANISASI OSIS</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Kepengurusan OSIS</h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                Struktur kabinet dan arsip kepengurusan OSIS per tahun ajaran.
              </p>
            </div>
            {/* Year selector */}
            <div className="relative">
              <select
                value={selectedYear ?? ""}
                onChange={(e) => setSelectedYear(e.target.value || null)}
                className="appearance-none bg-white border border-gray-200 rounded-2xl px-4 py-2.5 pr-9 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y.id ?? "active"} value={y.id ?? ""}>{y.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Current Year Stat */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Pengurus", value: cabinetMembers.length, color: "text-[#2c1ee8]" },
            { label: "Departemen", value: new Set(cabinetMembers.map((m) => m.department)).size, color: "text-emerald-600" },
            { label: "Anggota OSIS (DB)", value: osisInfo ? osisInfo.currentMembers : cabinetMembers.filter((m) => m.isActive).length, color: "text-purple-600" },
            { label: "Tahun Ajaran", value: currentYearLabel, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Org Chart */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="font-black text-gray-900 text-base">Bagan Struktur Organisasi</h2>
            <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {currentYearLabel}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm text-gray-400">Memuat struktur kabinet...</p>
            </div>
          ) : (
            <OrgChartTree members={cabinetMembers} academicYearName={currentYearLabel} />
          )}
        </div>

        {/* Historical Archive */}
        {Object.keys(groupedByYear).length > 1 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Arsip Kepengurusan</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(groupedByYear).map(([year, members]) => (
                <details key={year} className="group bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <summary className="flex items-center gap-3 p-4 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{year}</p>
                      <p className="text-xs text-gray-400">{members.length} Pengurus</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="border-t border-gray-100 p-4">
                    <OrgChartTree members={members} academicYearName={year} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
