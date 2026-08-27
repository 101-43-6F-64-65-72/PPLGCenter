"use client";

import React, { useState, useEffect, useMemo } from "react";
import useAuth from "@/hooks/useAuth";
import {
  Clock,
  User,
  MapPin,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const SAMPLE_SCHEDULES = {
  "XII PPLG 1": {
    Kamis: [
      {
        id: "1",
        timeStart: "07:00",
        timeEnd: "08:20",
        subject: "Pemrograman Web & Perangkat Bergerak",
        teacher: "Bpk. Agus Santoso, S.Kom",
        room: "Lab RPL 2",
        topic: "REST API & State Management",
        type: "lesson",
      },
      {
        id: "2",
        timeStart: "08:20",
        timeEnd: "09:40",
        subject: "Pemrograman Web & Perangkat Bergerak",
        teacher: "Bpk. Agus Santoso, S.Kom",
        room: "Lab RPL 2",
        topic: "Praktikum Fullstack Integration",
        type: "lesson",
      },
      {
        id: "3",
        timeStart: "09:40",
        timeEnd: "10:00",
        subject: "Istirahat Pagi",
        teacher: "-",
        room: "Kantin & Area Terbuka",
        topic: "Waktu Istirahat",
        type: "break",
      },
      {
        id: "4",
        timeStart: "10:00",
        timeEnd: "11:20",
        subject: "Basis Data & Cloud Architecture",
        teacher: "Ibu Dian Pratiwi, M.Kom",
        room: "Lab RPL 1",
        topic: "Database Indexing & PostgreSQL",
        type: "lesson",
      },
      {
        id: "5",
        timeStart: "11:20",
        timeEnd: "12:30",
        subject: "Istirahat & Sholat Dzuhur",
        teacher: "-",
        room: "Masjid SMKN 2",
        topic: "Ibadah & Makan Siang",
        type: "break",
      },
      {
        id: "6",
        timeStart: "12:30",
        timeEnd: "14:00",
        subject: "Produk Kreatif & Kewirausahaan",
        teacher: "Bpk. Eko Supriyanto, S.Pd",
        room: "Studio PPLG",
        topic: "Proyek Startup & Desain UI/UX",
        type: "lesson",
      },
      {
        id: "7",
        timeStart: "14:00",
        timeEnd: "15:30",
        subject: "Pengembangan Gim & Animasi 3D",
        teacher: "Bpk. Rizal Hidayat, S.Kom",
        room: "Lab Game Design",
        topic: "Character Controller & Game Physics",
        type: "lesson",
      },
    ],
    Senin: [
      { id: "s1", timeStart: "07:00", timeEnd: "07:45", subject: "Upacara Bendera", teacher: "Seluruh Guru", room: "Lapangan", type: "event" },
      { id: "s2", timeStart: "07:45", timeEnd: "09:40", subject: "Bahasa Indonesia", teacher: "Ibu Sri Wahyuni, M.Pd", room: "Ruang Teori 12", type: "lesson" },
      { id: "s3", timeStart: "09:40", timeEnd: "10:00", subject: "Istirahat", teacher: "-", room: "Kantin", type: "break" },
      { id: "s4", timeStart: "10:00", timeEnd: "12:00", subject: "Matematika Kejuruan", teacher: "Bpk. Bambang, S.Pd", room: "Ruang Teori 12", type: "lesson" },
      { id: "s5", timeStart: "12:00", timeEnd: "13:00", subject: "Ishoma", teacher: "-", room: "Masjid", type: "break" },
      { id: "s6", timeStart: "13:00", timeEnd: "15:30", subject: "Pemodelan Perangkat Lunak (OOAD)", teacher: "Bpk. Agus Santoso, S.Kom", room: "Lab RPL 2", type: "lesson" },
    ],
    Selasa: [
      { id: "sl1", timeStart: "07:00", timeEnd: "09:40", subject: "Pemrograman Berorientasi Objek", teacher: "Ibu Dian Pratiwi, M.Kom", room: "Lab RPL 1", type: "lesson" },
      { id: "sl2", timeStart: "09:40", timeEnd: "10:00", subject: "Istirahat", teacher: "-", room: "Kantin", type: "break" },
      { id: "sl3", timeStart: "10:00", timeEnd: "12:00", subject: "Bahasa Inggris Komunikasi Teknis", teacher: "Ibu Ratna, M.Hum", room: "Lab Bahasa", type: "lesson" },
      { id: "sl4", timeStart: "12:00", timeEnd: "13:00", subject: "Ishoma", teacher: "-", room: "Masjid", type: "break" },
      { id: "sl5", timeStart: "13:00", timeEnd: "15:30", subject: "Quality Assurance & Testing", teacher: "Bpk. Agus Santoso, S.Kom", room: "Lab RPL 2", type: "lesson" },
    ],
    Rabu: [
      { id: "r1", timeStart: "07:00", timeEnd: "09:40", subject: "Kecerdasan Buatan (AI) Dasar", teacher: "Bpk. Rizal Hidayat, S.Kom", room: "Lab AI Sinarmas", type: "lesson" },
      { id: "r2", timeStart: "09:40", timeEnd: "10:00", subject: "Istirahat", teacher: "-", room: "Kantin", type: "break" },
      { id: "r3", timeStart: "10:00", timeEnd: "12:00", subject: "Pendidikan Agama & Budi Pekerti", teacher: "Bpk. H. Ahmad, M.Ag", room: "Ruang Teori 12", type: "lesson" },
      { id: "r4", timeStart: "12:00", timeEnd: "13:00", subject: "Ishoma", teacher: "-", room: "Masjid", type: "break" },
      { id: "r5", timeStart: "13:00", timeEnd: "15:30", subject: "Proyek Kolaboratif Industri", teacher: "Tim Guru PPLG", room: "Studio PPLG", type: "lesson" },
    ],
    Jumat: [
      { id: "j1", timeStart: "07:00", timeEnd: "08:00", subject: "Senam Pagi & Literasi", teacher: "Seluruh Guru & Siswa", room: "Lapangan", type: "event" },
      { id: "j2", timeStart: "08:00", timeEnd: "10:00", subject: "Keamanan Siber & Jaringan", teacher: "Bpk. Eko Supriyanto, S.Pd", room: "Lab Cyber Security", type: "lesson" },
      { id: "j3", timeStart: "10:00", timeEnd: "11:30", subject: "Pendidikan Jasmani & Olahraga", teacher: "Bpk. Mulyono, S.Pd", room: "Lapangan Indoor", type: "lesson" },
      { id: "j4", timeStart: "11:30", timeEnd: "13:00", subject: "Sholat Jumat Bersama", teacher: "-", room: "Masjid SMKN 2", type: "break" },
    ],
  },
};

export default function HomeTodaySchedule() {
  const { user, isAuthenticated } = useAuth();

  // User's own class
  const userClassName = user?.className || user?.class || user?.studentClass || (isAuthenticated ? "XII PPLG 1" : "XII PPLG 1");

  // Strictly Today's Day Name
  const todayName = useMemo(() => {
    const dayIndex = new Date().getDay();
    const dayMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const name = dayMap[dayIndex];
    return name === "Minggu" || name === "Sabtu" ? "Kamis" : name;
  }, []);

  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentMinutesFromMidnight, setCurrentMinutesFromMidnight] = useState(0);

  // Update clock & active time slot
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeFormatted = `${String(hours).padStart(2, "0")}.${String(minutes).padStart(2, "0")}`;
      setCurrentTimeStr(timeFormatted);
      setCurrentMinutesFromMidnight(hours * 60 + minutes);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Today's schedule only
  const classSchedules = SAMPLE_SCHEDULES[userClassName] || SAMPLE_SCHEDULES["XII PPLG 1"];
  const dayScheduleList = classSchedules[todayName] || classSchedules["Kamis"] || [];

  // Determine currently active ongoing lesson based on real-time clock
  const currentOngoingSlot = useMemo(() => {
    const active = dayScheduleList.find((slot) => {
      const [startH, startM] = slot.timeStart.split(":").map(Number);
      const [endH, endM] = slot.timeEnd.split(":").map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      return currentMinutesFromMidnight >= startMin && currentMinutesFromMidnight <= endMin;
    });

    return active || dayScheduleList.find((s) => s.type === "lesson") || dayScheduleList[0];
  }, [dayScheduleList, currentMinutesFromMidnight]);

  return (
    <section id="jadwal-hari-ini" className="w-full bg-white py-12 sm:py-16 px-6 sm:px-10 lg:px-16 font-sans text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ─── SECTION HEADER: Clean & Direct ─── */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Jadwal {userClassName} hari ini
          </h2>
        </div>

        {/* ─── MAIN DUAL-COLUMN GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ─── LEFT COLUMN: Today's Schedule List Only (7 Cols) ─── */}
          <div className="lg:col-span-7">
            <div className="border border-slate-200 divide-y divide-slate-100 bg-white">
              {dayScheduleList.map((item, index) => {
                const isBreak = item.type === "break";
                const isEvent = item.type === "event";
                const isCurrent = currentOngoingSlot?.id === item.id;

                return (
                  <div
                    key={item.id || index}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? "bg-blue-50/60"
                        : isBreak
                        ? "bg-slate-50/70 text-slate-500"
                        : isEvent
                        ? "bg-slate-50/50"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Time & Indicator */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-900 w-24">
                        {item.timeStart} - {item.timeEnd}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2c1ee8] text-white text-[10px] font-bold uppercase tracking-wider">
                          Aktif
                        </span>
                      )}
                    </div>

                    {/* Subject & Teacher */}
                    <div className="flex-1 sm:text-right">
                      <p className={`text-sm font-bold leading-tight ${isCurrent ? "text-[#2c1ee8]" : "text-black"}`}>
                        {item.subject}
                      </p>
                      <div className="flex flex-wrap items-center sm:justify-end gap-x-3 text-xs text-slate-500 mt-0.5">
                        {item.teacher !== "-" && (
                          <span>{item.teacher}</span>
                        )}
                        {item.room && (
                          <span className="text-slate-600 font-medium">({item.room})</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Clean Informative Panel (5 Cols) ─── */}
          <div className="lg:col-span-5 pt-1 space-y-6">
            <div className="border border-slate-200 p-6 sm:p-8 space-y-5 bg-white">
              {/* Row 1: Hari */}
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Hari</span>
                <span className="text-base font-extrabold text-black">{todayName}</span>
              </div>

              {/* Row 2: Jam */}
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Jam</span>
                <span className="text-base font-mono font-bold text-[#2c1ee8]">{currentTimeStr || "07.00"} WIB</span>
              </div>

              {/* Row 3: Pelajaran Berlangsung */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Pelajaran Berlangsung
                </span>

                <div className="space-y-1.5 pl-3 border-l-2 border-[#2c1ee8]">
                  <h3 className="text-base font-black text-black leading-snug">
                    {currentOngoingSlot?.subject || "Tidak Ada Sesi Aktif"}
                  </h3>
                  {currentOngoingSlot?.teacher !== "-" && (
                    <p className="text-xs text-slate-600 font-medium">
                      Pengampu: {currentOngoingSlot?.teacher}
                    </p>
                  )}
                  {currentOngoingSlot?.room && (
                    <p className="text-xs text-slate-600 font-medium">
                      Ruang: {currentOngoingSlot?.room}
                    </p>
                  )}
                </div>
              </div>

              {/* Button */}
              <div className="pt-2">
                <Link
                  href="/kelas"
                  className="w-full py-3 px-4 bg-[#2c1ee8] hover:bg-[#2317be] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Buka Kelas & Jadwal Lengkap</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
