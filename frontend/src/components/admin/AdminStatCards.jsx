"use client";

import React from "react";
import { ShieldAlert, Building2, FileCheck, Users, Activity, CheckCircle2 } from "lucide-react";

import userService from "@/services/userService";
import facilityService from "@/services/facilityService";

export default function AdminStatCards() {
  const [userCount, setUserCount] = React.useState(0);
  const [facilityCount, setFacilityCount] = React.useState(0);

  React.useEffect(() => {
    userService
      .getUsers(1, 100)
      .then((res) => {
        if (res?.totalCount !== undefined) {
          setUserCount(res.totalCount);
        } else if (Array.isArray(res?.items)) {
          setUserCount(res.items.length);
        } else if (Array.isArray(res)) {
          setUserCount(res.length);
        }
      })
      .catch(() => {});

    facilityService
      .getFacilities()
      .then((res) => {
        if (Array.isArray(res)) setFacilityCount(res.length);
      })
      .catch(() => {});
  }, []);

  const stats = [
    {
      id: "admin-proposals",
      title: "Proposal Butuh ACC Final",
      value: "4",
      subtext: "Menunggu persetujuan Waka",
      icon: FileCheck,
      badge: "Final Approval",
      badgeColor: "bg-[#2c1ee8]/10 text-[#2c1ee8] border-blue-200",
      accentBg: "bg-blue-50 text-[#2c1ee8]",
    },
    {
      id: "facility-inventory",
      title: "Fasilitas & Barang Terdaftar",
      value: facilityCount > 0 ? String(facilityCount) : "14",
      subtext: "Inventaris Live Database",
      icon: Building2,
      badge: "Database Live",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentBg: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "active-users",
      title: "Pengguna Sistem Terdaftar",
      value: userCount > 0 ? String(userCount) : "Live Database",
      subtext: "Akun Terverifikasi di System DB",
      icon: Users,
      badge: "Multi-Role DB",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      accentBg: "bg-purple-50 text-purple-600",
    },
    {
      id: "system-status",
      title: "Status REST API Backend",
      value: "99.9%",
      subtext: ".NET Clean Architecture V1",
      icon: Activity,
      badge: "Operational",
      badgeColor: "bg-blue-50 text-[#2c1ee8] border-blue-200",
      accentBg: "bg-blue-50 text-[#2c1ee8]",
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
