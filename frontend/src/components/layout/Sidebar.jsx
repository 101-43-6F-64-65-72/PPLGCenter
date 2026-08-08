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
    { name: "Dashboard", tabId: "overview", icon: LayoutDashboard },
    { name: "Master Siswa", tabId: "students", icon: GraduationCap, category: "Master Data" },
    { name: "Master Guru", tabId: "teachers", icon: BookOpen, category: "Master Data" },
    { name: "Master Jurusan", tabId: "departments", icon: Briefcase, category: "Master Data" },
    { name: "Master Kelas", tabId: "classes", icon: Layers, category: "Master Data" },
    { name: "Mata Pelajaran", tabId: "subjects", icon: BookOpen, category: "Master Data" },
    { name: "Penugasan Guru", tabId: "teacher-subjects", icon: Users, category: "Operasional" },
    { name: "Mapel Kelas", tabId: "class-subjects", icon: Layers, category: "Operasional" },
    { name: "Jadwal Pelajaran", tabId: "schedules", icon: Calendar, category: "Operasional" },
    { name: "Kalender Akademik", tabId: "academic-events", icon: CalendarDays, category: "Operasional" },
    { name: "Absensi Pelajaran", tabId: "attendance", icon: CheckSquare, category: "LMS" },
    { name: "Materi Pelajaran", tabId: "materials", icon: FileText, category: "LMS" },
    { name: "Tugas & Submisi", tabId: "assignments", icon: BookOpen, category: "LMS" },
    { name: "Kategori Penilaian", tabId: "grade-categories", icon: Award, category: "LMS" },
    { name: "Skala & Predikat", tabId: "grade-scales", icon: Award, category: "LMS" },
    { name: "Tahun Akademik", tabId: "academic-years", icon: CalendarDays, category: "Master Data" },
    { name: "Master Semester", tabId: "semesters", icon: Bookmark, category: "Master Data" },
    { name: "Kelola User", tabId: "users", icon: Users, category: "Operasional" },
    { name: "Ekstrakurikuler", tabId: "extracurriculars", icon: Award, category: "Operasional" },
    { name: "Proposal", tabId: "proposals", icon: FileText, category: "Operasional" },
    { name: "Booking Facilities", tabId: "facilities", icon: Building2, category: "Operasional" },
    { name: "Mading Digital", tabId: "announcements", icon: Newspaper, category: "Operasional" },
    { name: "Reset Password", tabId: "password-reset", icon: KeyRound, category: "Operasional" },
  ];

  const getActiveMenu = () => {
    if (userRole === "admin") return adminMenu;
    if (userRole === "teacher") return teacherMenu;
    return studentMenu; // Default to Student
  };

  const menuItems = getActiveMenu();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Title / Logo header inside Sidebar */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8.5 h-10 bg-[#2c1ee8] rounded-xl flex items-center justify-center text-white font-black text-sm">
          SC
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-900 leading-none">Navigation</h2>
          <span className="text-[10px] text-gray-400 font-bold block mt-1 uppercase tracking-wider">
            {role || "Siswa"}
          </span>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComp = item.icon;

          // Admin tab routing
          if (userRole === "admin") {
            const isActive = activeTab === item.tabId;
            return (
              <button
                key={item.name}
                suppressHydrationWarning={true}
                onClick={() => onTabChange && onTabChange(item.tabId)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-[#2c1ee8]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <IconComp className={`w-5 h-5 ${isActive ? "text-[#2c1ee8]" : "text-gray-400"}`} />
                <span>{item.name}</span>
              </button>
            );
          }

          // Student/Teacher route-based sidebar items
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-blue-50 text-[#2c1ee8]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <IconComp className={`w-5 h-5 ${isActive ? "text-[#2c1ee8]" : "text-gray-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
