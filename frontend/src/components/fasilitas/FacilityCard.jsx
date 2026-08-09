"use client";

import React, { useState } from "react";
import { MapPin, Users, Calendar, ArrowRight } from "lucide-react";

const getCategoryMatchingImage = (title, location, currentSrc) => {
  if (currentSrc && currentSrc !== "/images/tempat/lapangansmkn2ska.jpg") {
    return currentSrc;
  }
  const text = `${title || ""} ${location || ""}`.toLowerCase();
  if (text.includes("halaman") || text.includes("area") || text.includes("depan") || text.includes("taman")) {
    return "/images/tempat/halamandepansmkn2ska.jpg";
  }
  if (text.includes("lapangan") || text.includes("olahraga") || text.includes("stadion") || text.includes("basket") || text.includes("futsal")) {
    return "/images/tempat/lapangansmkn2ska.jpg";
  }
  if (text.includes("aula") || text.includes("ruang utama") || text.includes("hall") || text.includes("auditorium")) {
    return "/images/tempat/aulasmkn2ska.jpg";
  }
  if (text.includes("lab") || text.includes("komputer") || text.includes("laboratorium") || text.includes("bengkel")) {
    return "/images/tempat/labsmkn2ska.jpeg";
  }
  return currentSrc || "/images/tempat/halamandepansmkn2ska.jpg";
};

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
  const resolvedImageSrc = getCategoryMatchingImage(displayTitle, location, imageSrc);
  const [imgSrc, setImgSrc] = useState(resolvedImageSrc);

  return (
    <div
      onClick={() => onActionClick && onActionClick({ title: displayTitle, location, capacity, status, time, imageSrc: imgSrc })}
      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2c1ee8]/40 hover:shadow-xl hover:shadow-[#2c1ee8]/10 cursor-pointer"
    >
      <div>
        {/* Card Cover Header */}
        <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 p-3.5 flex flex-col justify-between">
          <img
            src={imgSrc}
            alt={displayTitle}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => {
              setImgSrc(getCategoryMatchingImage(displayTitle, location, null));
            }}
          />
          {/* Gradient dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

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
              <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 shadow-2xs backdrop-blur-md">
                <Users className="w-3 h-3 text-[#2c1ee8]" />
                <span>{capacity} Orang</span>
              </span>
            )}
          </div>
        </div>

        {/* Facility Title & Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2c1ee8]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[200px]">{location}</span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#2c1ee8] transition-colors leading-snug line-clamp-2" title={displayTitle}>
            {displayTitle}
          </h3>

          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/90 p-2.5 text-xs flex items-center justify-between text-slate-600">
            <span className="font-medium text-slate-500">Jam Layanan</span>
            <span className="font-bold text-slate-800">{time}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-5 pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onActionClick && onActionClick({ title: displayTitle, location, capacity, status, time, imageSrc: imgSrc });
          }}
          className="w-full rounded-2xl bg-slate-50 py-3 px-4 text-xs sm:text-sm font-extrabold text-[#2c1ee8] border border-blue-200/80 hover:bg-[#2c1ee8] hover:text-white hover:border-[#2c1ee8] transition-all duration-300 flex items-center justify-center gap-2 shadow-2xs cursor-pointer group/btn"
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal & Pinjam Tempat</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

