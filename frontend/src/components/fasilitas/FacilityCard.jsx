"use client";

import React from "react";

export default function FacilityCard({
  title = "Laboratorium Komputer",
  location = "SMKN 2 Surakarta",
  capacity = 36,
  status = "tersedia",
  time = "07.00 s.d 17.00 WIB",
  imageSrc = "/images/tempat/lapangansmkn2ska.jpg",
  onActionClick,
}) {
  const isAvailable = (status || "").toLowerCase() === "tersedia";
  // Clean up title text if it starts with [SEED]
  const displayTitle = (title || "").replace(/^\[SEED\]\s*/i, "").trim();

  return (
    <div
      onClick={() => onActionClick && onActionClick({ title: displayTitle, location, capacity, status, time, imageSrc })}
      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2c1ee8]/50 hover:shadow-xl hover:shadow-[#2c1ee8]/10 cursor-pointer"
    >
      <div>
        {/* Card Cover Header */}
        <div className="relative mb-4 aspect-16/10 w-full overflow-hidden rounded-2xl border border-blue-100/70 bg-gradient-to-br from-slate-100 via-blue-50/60 to-indigo-100/50 p-3.5 flex flex-col justify-between">
          <img
            src={imageSrc}
            alt={displayTitle}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />

          {/* Badges Top Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide border shadow-2xs backdrop-blur-md ${
                isAvailable
                  ? "bg-emerald-500/90 text-white border-emerald-400/50"
                  : "bg-amber-500/90 text-white border-amber-400/50"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {isAvailable ? "Tersedia" : "Terpakai"}
            </span>

            {capacity > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-gray-700 shadow-2xs backdrop-blur-md">
                👥 {capacity} Siswa
              </span>
            )}
          </div>
        </div>

        {/* Facility Title & Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2c1ee8]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate max-w-[200px]">{location}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#2c1ee8] transition-colors leading-snug line-clamp-2" title={displayTitle}>
            {displayTitle}
          </h3>

          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/90 p-2.5 text-xs flex items-center justify-between text-gray-600">
            <span className="font-medium text-gray-500">Jam Layanan</span>
            <span className="font-semibold text-gray-800">{time}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-5 pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onActionClick && onActionClick({ title: displayTitle, location, capacity, status, time, imageSrc });
          }}
          className="w-full rounded-xl bg-slate-100 py-2.5 px-4 text-xs font-bold text-[#2c1ee8] border border-blue-200 hover:bg-[#2c1ee8] hover:text-white hover:border-[#2c1ee8] transition-all duration-300 flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Lihat & Pinjam Tempat</span>
        </button>
      </div>
    </div>
  );
}
