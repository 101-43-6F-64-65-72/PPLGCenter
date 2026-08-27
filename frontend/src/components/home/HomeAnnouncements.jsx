"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AnnouncementShowcaseSlider from "@/features/announcement/components/AnnouncementShowcaseSlider";
import useAuth from "@/hooks/useAuth";

export default function HomeAnnouncements() {
  const { role, user } = useAuth();
  const userRole = (role || user?.role || "").toLowerCase();
  const canManage = userRole === "admin" || userRole === "teacher";

  return (
    <section className="w-full bg-white py-12 sm:py-16 lg:py-20 px-6 sm:px-10 lg:px-16 font-sans text-slate-900 border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── SECTION HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight">
              Pengumuman & Berita
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Informasi akademik resmi, agenda kegiatan, dan berita terkini PPLG SMKN 2 Surakarta.
            </p>
          </div>

          <Link
            href="/pengumuman"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2c1ee8] hover:bg-[#2317be] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto uppercase tracking-wider"
          >
            <span>Buka Halaman Pengumuman</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ─── ANNOUNCEMENT SHOWCASE SLIDER ─── */}
        <div className="w-full pt-2">
          <AnnouncementShowcaseSlider canManage={canManage} />
        </div>
      </div>
    </section>
  );
}
