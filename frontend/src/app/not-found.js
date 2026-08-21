"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#2c1ee8] flex items-center justify-center font-black text-3xl mb-6 border border-blue-100 shadow-sm">
          404
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mt-3 leading-relaxed">
          Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-[#2c1ee8] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-blue-700 transition-all shadow-md cursor-pointer"
          >
            ← Kembali ke Beranda
          </Link>
          <Link
            href="/pengumuman"
            className="inline-flex items-center justify-center bg-gray-100 text-gray-700 font-bold text-sm px-6 py-3 rounded-full hover:bg-gray-200 transition-all cursor-pointer"
          >
            Lihat Pengumuman Resmi
          </Link>
        </div>
      </main>
    </div>
  );
}
