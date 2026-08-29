"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReplyzMascot from "@/components/ReplyzMascot";
import { ArrowRight, ArrowLeft, ShieldAlert, BookOpen, Layers } from "lucide-react";

export default function KuisPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto">
        <div className="w-full border border-slate-300 p-8 sm:p-12 text-center space-y-6 bg-white shadow-xs">
          
          {/* Top Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-[#2C1EE8]" />
            <span>Pemeliharaan & Evaluasi Sistem Kuis</span>
          </div>

          {/* Official Mascot */}
          <div className="relative py-2 flex items-center justify-center pointer-events-none select-none">
            <ReplyzMascot state="thinking" size={140} />
          </div>

          {/* Title & Description */}
          <div className="space-y-2.5 max-w-xl mx-auto text-center">
            <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight uppercase leading-tight">
              Akses Kuis Harian Ditutup Sementara
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Fitur Arena Kuis Harian PPLG Center saat ini sedang dalam masa penyelarasan kurikulum kejuruan, evaluasi performa, dan pemeliharaan bank soal AI. Seluruh riwayat skor dan data profil Anda tersimpan aman di server sekolah.
            </p>
          </div>

          {/* Key Info Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left max-w-2xl mx-auto">
            <div className="p-3.5 border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider">Status Fitur</span>
              <p className="text-xs font-bold text-slate-900">Ditutup Sementara</p>
            </div>
            <div className="p-3.5 border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider">Data Pengguna</span>
              <p className="text-xs font-bold text-emerald-700">Tersimpan Aman</p>
            </div>
            <div className="p-3.5 border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider">Rilis Berikutnya</span>
              <p className="text-xs font-bold text-[#2C1EE8]">Segera Diinfokan</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3 bg-[#2C1EE8] hover:bg-[#2317BE] active:bg-[#1D129F] text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            <Link
              href="/kelas"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-colors border border-slate-300 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#2C1EE8]" />
              <span>Lihat Kelas & Jadwal</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
