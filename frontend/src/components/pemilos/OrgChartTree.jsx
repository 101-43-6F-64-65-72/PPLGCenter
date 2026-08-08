"use client";

import React, { useMemo } from "react";
import { Crown, Users, GitBranch } from "lucide-react";

const DEPT_COLORS = {
  "BPH": "bg-blue-100 text-blue-700",
  "Sekbid 1": "bg-emerald-100 text-emerald-700",
  "Sekbid 2": "bg-purple-100 text-purple-700",
  "Sekbid 3": "bg-orange-100 text-orange-700",
  "Sekbid 4": "bg-rose-100 text-rose-700",
};

function MemberCard({ member, isChairman }) {
  return (
    <div className={`relative p-3 rounded-2xl border text-center transition-all hover:shadow-md hover:-translate-y-0.5 ${
      isChairman
        ? "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
        : "border-gray-100 bg-white"
    }`}>
      {isChairman && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <div className="bg-amber-400 rounded-full p-1">
            <Crown className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-lg mb-2 overflow-hidden ${
        isChairman
          ? "bg-gradient-to-br from-amber-400 to-yellow-400 shadow-md"
          : "bg-gradient-to-br from-[#2c1ee8] to-blue-500"
      }`}>
        {member.photoUrl
          ? <img src={member.photoUrl} alt={member.studentName} className="w-full h-full object-cover" />
          : member.studentName?.[0] ?? "?"}
      </div>
      <p className="font-bold text-gray-900 text-xs leading-tight truncate">{member.studentName}</p>
      <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{member.positionTitle}</p>
    </div>
  );
}

export default function OrgChartTree({ members = [], academicYearName }) {
  const grouped = useMemo(() => {
    const depts = {};
    members.forEach((m) => {
      const dept = m.department || "Umum";
      if (!depts[dept]) depts[dept] = [];
      depts[dept].push(m);
    });
    return depts;
  }, [members]);

  const chairman = members.find(
    (m) => m.positionTitle?.toLowerCase().includes("ketua") && !m.positionTitle?.toLowerCase().includes("wakil")
  );
  const vice = members.find((m) => m.positionTitle?.toLowerCase().includes("wakil"));
  const others = Object.entries(grouped).filter(([dept]) => dept !== "BPH");

  if (members.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-semibold text-sm">Belum ada struktur kabinet tercatat</p>
        <p className="text-xs mt-1">{academicYearName}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* BPH — Top Level */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-4">
          <Crown className="w-3 h-3" />
          Badan Pengurus Harian (BPH)
        </div>
        <div className="flex items-start justify-center gap-6">
          {chairman && <MemberCard member={chairman} isChairman={true} />}
          {vice && <MemberCard member={vice} isChairman={false} />}
        </div>
        {/* Connector line */}
        {others.length > 0 && (
          <div className="flex justify-center mt-4">
            <div className="w-px h-8 bg-gray-200"></div>
          </div>
        )}
      </div>

      {/* Department sections */}
      {others.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {others.map(([dept, deptMembers]) => {
            const colorClass = DEPT_COLORS[dept] ?? "bg-gray-100 text-gray-700";
            return (
              <div key={dept} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${colorClass}`}>
                  <Users className="w-3 h-3" />
                  {dept}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {deptMembers.map((m) => (
                    <MemberCard key={m.id} member={m} isChairman={false} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
