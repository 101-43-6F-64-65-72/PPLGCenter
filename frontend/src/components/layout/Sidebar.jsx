"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  KeyRound
} from "lucide-react";

export default function Sidebar({ role, activeTab, onTabChange }) {
  const pathname = usePathname();
  const userRole = (role || "").toLowerCase();

  // Menu lists
  const studentMenu = [
    { name: "Home", path: "/", icon: Home },
    { name: "Notifikasi", path: "/notifications", icon: Bell },
    { name: "Pesan & Chat", path: "/chat", icon: FileText },
    { name: "Nilai Saya", path: "/nilai", icon: Award },
    { name: "Mading", path: "/mading", icon: Newspaper },
    { name: "Kalender", path: "/kalender", icon: Calendar },
    { name: "Ekstrakurikuler", path: "/ekstrakurikuler", icon: Award },
    { name: "Proposal", path: "/proposal", icon: FileText },
    { name: "Booking", path: "/fasilitas", icon: Building2 },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const teacherMenu = [
    { name: "Home", path: "/", icon: Home },
    { name: "Notifikasi", path: "/notifications", icon: Bell },
    { name: "Pesan & Chat", path: "/chat", icon: FileText },
    { name: "Buku Nilai", path: "/guru", queryTab: "gradebook", icon: Award },
    { name: "Approval Proposal", path: "/proposal", icon: FileCheck },
    { name: "Approval Booking", path: "/guru", queryTab: "bookings", icon: CheckSquare },
    { name: "Ekstrakurikuler", path: "/ekstrakurikuler", icon: Award },
    { name: "Kalender", path: "/kalender", icon: Calendar },
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
    { name: "Kategori Penilaian", tabId: "grade-categories", icon: Award, category: "AKADEMIK" },
    { name: "Skala & Predikat", tabId: "grade-scales", icon: Award, category: "AKADEMIK" },

    { name: "Kelola User", tabId: "users", icon: Users, category: "MANAJEMEN" },
    { name: "Ekstrakurikuler", tabId: "extracurriculars", icon: Award, category: "MANAJEMEN" },
    { name: "Proposal", tabId: "proposals", icon: FileText, category: "MANAJEMEN" },
    { name: "Booking Facilities", tabId: "facilities", icon: Building2, category: "MANAJEMEN" },
    { name: "Mading Digital", tabId: "announcements", icon: Newspaper, category: "MANAJEMEN" },
    { name: "Reset Password", tabId: "password-reset", icon: KeyRound, category: "MANAJEMEN" },
  ];

  if (userRole === "admin") {
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
              {role || "Admin"}
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
                const isActive = activeTab === item.tabId;
                return (
                  <button
                    key={item.tabId}
                    suppressHydrationWarning={true}
                    onClick={() => onTabChange && onTabChange(item.tabId)}
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

  // Teacher / Student flat sidebar layout
  const menuItems = userRole === "teacher" ? teacherMenu : studentMenu;

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
