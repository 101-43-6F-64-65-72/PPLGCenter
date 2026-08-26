"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Newspaper,
  Calendar,
  Award,
  FileText,
  Building2,
  User,
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  FileCheck,
  CheckSquare,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Bookmark,
  Bell,
  KeyRound,
  Mail,
  MessageSquareHeart,
  Zap
} from "lucide-react";

import useAuth from "@/hooks/useAuth";

export default function Sidebar({ role, activeTab, onTabChange }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const userRole = (role || user?.role || "").toLowerCase();
  const position = (user?.position || "").toLowerCase();
  const isPplgTeacher = userRole === "teacher" && (position.includes("pengembangan perangkat lunak dan gim") || position.includes("pplg"));
  const isAdminOrPplgTeacher = userRole === "admin" || isPplgTeacher;

  // Menu lists
  const studentMenu = [
    { name: "Home", path: "/", icon: Home },
    { name: "Pengumuman", path: "/pengumuman", icon: Bell },
    { name: "Notifikasi", path: "/notifications", icon: Bell },
    { name: "Pesan & Chat", path: "/chat", icon: FileText },
    { name: "Nilai Saya", path: "/nilai", icon: Award },
    { name: "Kalender", path: "/kalender", icon: Calendar },
    { name: "Booking", path: "/fasilitas", icon: Building2 },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const adminMenu = [
    { name: "Dashboard", tabId: "overview", icon: LayoutDashboard, category: "OVERVIEW" },
    
    { name: "Master Siswa", tabId: "students", icon: GraduationCap, category: "DATA MASTER" },
    { name: "Master Guru", tabId: "teachers", icon: BookOpen, category: "DATA MASTER" },
    { name: "Master Jurusan", tabId: "departments", icon: Briefcase, category: "DATA MASTER" },
    { name: "Master Kelas", tabId: "classes", icon: Layers, category: "DATA MASTER" },
    { name: "Mata Pelajaran", tabId: "subjects", icon: BookOpen, category: "DATA MASTER" },
    { name: "Penugasan Guru", tabId: "teacher-subjects", icon: Users, category: "DATA MASTER" },
    { name: "Mapel Kelas", tabId: "class-subjects", icon: Layers, category: "DATA MASTER" },
    { name: "Tahun Akademik", tabId: "academic-years", icon: CalendarDays, category: "DATA MASTER" },
    { name: "Master Semester", tabId: "semesters", icon: Bookmark, category: "DATA MASTER" },

    { name: "Jadwal Pelajaran", tabId: "schedules", icon: Calendar, category: "AKADEMIK" },
    { name: "Kalender Akademik", tabId: "academic-events", icon: CalendarDays, category: "AKADEMIK" },
    { name: "Absensi Pelajaran", tabId: "attendance", icon: CheckSquare, category: "AKADEMIK" },
    { name: "Materi Pelajaran", tabId: "materials", icon: FileText, category: "AKADEMIK" },
    { name: "Tugas & Submisi", tabId: "assignments", icon: BookOpen, category: "AKADEMIK" },
    { name: "Kuis Harian RPL", path: "/kuis", icon: Zap, category: "AKADEMIK" },
    { name: "Kategori Penilaian", tabId: "grade-categories", icon: Award, category: "AKADEMIK" },
    { name: "Skala & Predikat", tabId: "grade-scales", icon: Award, category: "AKADEMIK" },

    { name: "Kelola User", tabId: "users", icon: Users, category: "MANAJEMEN" },
    { name: "Booking Facilities", tabId: "facilities", icon: Building2, category: "MANAJEMEN" },
    { name: "Pengumuman Resmi", tabId: "pengumuman-link", path: "/pengumuman", icon: Bell, category: "MANAJEMEN" },
    { name: "Umpan Balik", tabId: "feedback", icon: MessageSquareHeart, category: "MANAJEMEN" },
    { name: "Reset Password", tabId: "password-reset", icon: KeyRound, category: "MANAJEMEN" },
    { name: "Email Debugger", path: "/admin/email-debug", icon: Mail, category: "MANAJEMEN" },
  ];

  if (isAdminOrPplgTeacher) {
    // Group admin menu items by category
    const categories = ["OVERVIEW", "DATA MASTER", "AKADEMIK", "MANAJEMEN"];
    const groupedItems = categories.map((cat) => ({
      category: cat,
      items: adminMenu.filter((item) => item.category === cat),
    }));

    return (
      <aside className="w-[250px] bg-white border-r border-slate-200/60 flex flex-col h-[calc(100vh-6rem)] sticky top-24 shrink-0 overflow-hidden shadow-xs">
        {/* Title / Logo header inside Sidebar */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2c1ee8] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-500/20">
            SC
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-900 leading-none">Student Center</h2>
            <span className="text-[9px] text-[#2c1ee8] font-extrabold block mt-1.5 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              {isPplgTeacher ? "Admin PPLG" : (role || "Admin")}
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-thin">
          {groupedItems.map((group) => (
            <div key={group.category} className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-3 mb-1.5 select-none">
                {group.category}
              </span>
              {group.items.map((item) => {
                const IconComp = item.icon;
                const isActive = item.tabId ? activeTab === item.tabId : pathname.startsWith(item.path || "");
                return (
                  <button
                    key={item.tabId || item.path || item.name}
                    suppressHydrationWarning={true}
                    onClick={() => {
                      if (item.path) {
                        router.push(item.path);
                      } else if (onTabChange && item.tabId) {
                        onTabChange(item.tabId);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                      isActive
                        ? "bg-[#2c1ee8] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  // Student / Non-PPLG Teacher flat sidebar layout
  const menuItems = studentMenu;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/60 flex flex-col h-full shrink-0 shadow-xs">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#2c1ee8] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-500/20">
          SC
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-900 leading-none">Navigation</h2>
          <span className="text-[10px] text-[#2c1ee8] font-extrabold block mt-1 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            {role || "Siswa"}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComp = item.icon;
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-[#2c1ee8] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <IconComp className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
