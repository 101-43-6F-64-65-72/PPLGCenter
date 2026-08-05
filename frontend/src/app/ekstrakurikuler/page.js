"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { extracurricularService } from "@/services/extracurricularService";

// TODO: Integrasi API daftar ekstrakurikuler
// TODO: Integrasi halaman detail ekstrakurikuler
// TODO: Integrasi jumlah anggota dari backend

export default function EkstrakurikulerPage() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFromApi() {
      setIsLoading(true);
      try {
        const response = await extracurricularService.getExtracurriculars();

        let apiItems = [];
        if (response && Array.isArray(response.data?.items)) {
          apiItems = response.data.items;
        } else if (response && Array.isArray(response.items)) {
          apiItems = response.items;
        } else if (Array.isArray(response)) {
          apiItems = response;
        }

        if (apiItems && apiItems.length > 0) {
          const categoryGroups = {};
          apiItems.forEach((item) => {
            const catName = item.category || "Umum";
            const catId = catName.toLowerCase().replace(/[^a-z0-9]/g, "-");

            if (!categoryGroups[catId]) {
              categoryGroups[catId] = {
                id: catId,
                title: catName,
                badgeBg: catName.toLowerCase().includes("olahraga")
                  ? "bg-blue-50 text-[#2c1ee8] border-blue-200/80"
                  : catName.toLowerCase().includes("seni")
                  ? "bg-[#eef2ff] text-[#2c1ee8] border-[#c7d2fe]/80"
                  : "bg-sky-50 text-[#2c1ee8] border-sky-200/80",
                items: [],
              };
            }

            categoryGroups[catId].items.push({
              id: item.id || item.name?.toLowerCase().replace(/[^a-z0-9]/g, "-"),
              name: item.name,
              category: item.category || catName,
              maxMember: item.maxMembers || 30,
              currentMembers: item.currentMembers || 0,
              description: item.description || "Kegiatan ekstrakurikuler SMKN 2 Surakarta.",
              imageUrl: item.imageUrl || null,
            });
          });

          setCategories(Object.values(categoryGroups));
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error("Error fetching extracurriculars:", err);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFromApi();
  }, []);

  const totalExtracurriculars = categories.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  );

  const filteredCategories = categories
    .map((cat) => {
      const isCategoryMatch =
        activeCategory === "semua" || cat.id === activeCategory;

      const matchingItems = cat.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...cat,
        items: isCategoryMatch ? matchingItems : [],
      };
    })
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto flex w-full max-w-7xl flex-col px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        {/* Header Hero Section */}
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-[#f7f8ff] via-white to-[#eef2ff] p-6 sm:p-8 lg:p-10 shadow-sm relative">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[#2c1ee8]/5 blur-3xl pointer-events-none" />

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c7d2fe] bg-white/90 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2c1ee8] shadow-2xs backdrop-blur-xs">
                <span className="h-2 w-2 rounded-full bg-[#2c1ee8] animate-pulse" />
                Student Center
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                EKSTRAKURIKULER
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base max-w-2xl">
                Wadah pengembangan minat, bakat, dan potensi diri siswa SMKN 2 Surakarta. 
                Pilih kegiatan yang sesuai dengan passion Anda dan bergabunglah bersama komunitas sekolah!
              </p>

              {/* Filter Tabs Dynamic */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory("semua")}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    activeCategory === "semua"
                      ? "bg-[#2c1ee8] text-white shadow-md shadow-[#2c1ee8]/20"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-[#2c1ee8]/40 hover:text-[#2c1ee8]"
                  }`}
                >
                  Semua ({totalExtracurriculars})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      activeCategory === cat.id
                        ? "bg-[#2c1ee8] text-white shadow-md shadow-[#2c1ee8]/20"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-[#2c1ee8]/40 hover:text-[#2c1ee8]"
                    }`}
                  >
                    {cat.title} ({cat.items.length})
                  </button>
                ))}
              </div>
            </div>

            {/* Banner Quick Stats Card */}
            <div className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef2ff] text-[#2c1ee8] border border-[#c7d2fe]">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">Program Ekskul Terintegrasi</p>
                  <p className="text-xs text-gray-500">Pilih ekstrakurikuler dan lihat detail lengkap</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <input
                  type="text"
                  placeholder="Cari ekstrakurikuler..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-slate-50/80 px-3.5 py-2 pl-9 text-xs text-gray-900 placeholder-gray-400 focus:border-[#2c1ee8] focus:bg-white focus:outline-hidden transition-all"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-blue-100 bg-[#f8faff] p-2.5">
                  <div className="text-lg font-black text-[#2c1ee8]">{totalExtracurriculars}</div>
                  <div className="text-[11px] font-medium text-gray-500">Total Ekskul</div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-[#f8faff] p-2.5">
                  <div className="text-lg font-black text-[#2c1ee8]">{categories.length}</div>
                  <div className="text-[11px] font-medium text-gray-500">Kategori</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories & Cards Section */}
        <div className="mt-10 space-y-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2c1ee8] border-t-transparent" />
              <p className="text-sm font-semibold text-gray-600">Memuat data ekstrakurikuler...</p>
            </div>
          ) : filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <section key={category.id} className="space-y-4">
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200/80 pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-bold border ${category.badgeBg}`}>
                        {category.title}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        {category.items.length} Pilihan
                      </span>
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                      {category.title}
                    </h2>
                  </div>
                </div>

                {/* Grid Ekstrakurikuler Cards (Proportional Width & Balanced Aspect Ratio) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:border-[#2c1ee8]/50 hover:shadow-2xl hover:shadow-[#2c1ee8]/15"
                    >
                      <div>
                        {/* Placeholder Foto (Aspect 16:10) */}
                        <div className="relative mb-4.5 aspect-16/10 w-full overflow-hidden rounded-xl border border-blue-100/70 bg-linear-to-br from-slate-100 via-blue-50/60 to-indigo-100/50 p-4 flex flex-col justify-between group-hover:scale-[1.02] transition-transform duration-300">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/80 bg-white/95 px-3 py-1 text-xs font-bold text-[#2c1ee8] shadow-2xs backdrop-blur-xs">
                                  {item.category}
                                </span>
                              </div>

                              <div className="flex items-center justify-center py-2.5">
                                <div className="rounded-xl bg-white/85 px-4 py-2 text-center text-xs sm:text-sm font-semibold text-gray-600 backdrop-blur-xs border border-white/80 shadow-2xs">
                                  📷 Foto belum tersedia
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Nama Ekstrakurikuler */}
                        <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-[#2c1ee8] transition-colors truncate">
                          {item.name}
                        </h3>

                        {/* Informasi Kategori & Max Member */}
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/90 p-4 text-sm space-y-2.5">
                          <div className="flex items-center justify-between text-gray-500">
                            <span className="font-medium text-gray-500 font-medium">Kategori</span>
                            <span className="font-semibold text-gray-800 truncate max-w-[140px] text-right">
                              {item.category}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-gray-500 pt-2 border-t border-slate-200/60">
                            <span className="font-medium text-gray-500">Max Member</span>
                            <span className="font-extrabold text-[#2c1ee8] text-base">
                              {item.maxMember} Siswa
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Lihat Detail (Navigasi Dynamic Route /ekstrakurikuler/[slug]) */}
                      <div className="mt-5 pt-1">
                        <Link
                          href={`/ekstrakurikuler/${item.id}`}
                          className="w-full rounded-xl bg-slate-100 py-3 px-4 text-sm font-bold text-[#2c1ee8] border border-blue-200 hover:bg-[#2c1ee8] hover:text-white hover:border-[#2c1ee8] transition-all duration-300 flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                        >
                          <span>Lihat Detail</span>
                          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-base font-semibold text-gray-700">
                Tidak ada ekstrakurikuler ditemukan
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Coba gunakan kata kunci pencarian yang berbeda atau hapus filter.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
