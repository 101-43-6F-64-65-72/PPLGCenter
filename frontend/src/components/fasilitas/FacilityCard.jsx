"use client";

import React, { useState } from "react";
import { MapPin, Users, ArrowRight, UserCheck, Box } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import { resolve3DModelUrl } from "@/config/storage3dModels";

const getCategoryMatchingImage = (title, location, currentSrc) => {
  if (currentSrc && currentSrc !== "/images/tempat/lapangansmkn2ska.jpg") {
    return resolveImageUrl(currentSrc);
  }
  const text = `${title || ""} ${location || ""}`.toLowerCase();
  if (
    text.includes("halaman") ||
    text.includes("area") ||
    text.includes("depan") ||
    text.includes("taman")
  ) {
    return "/images/tempat/halamandepansmkn2ska.jpg";
  }
  if (
    text.includes("lapangan") ||
    text.includes("olahraga") ||
    text.includes("stadion") ||
    text.includes("basket") ||
    text.includes("futsal")
  ) {
    return "/images/tempat/lapangansmkn2ska.jpg";
  }
  if (
    text.includes("aula") ||
    text.includes("ruang utama") ||
    text.includes("hall") ||
    text.includes("auditorium")
  ) {
    return "/images/tempat/aulasmkn2ska.jpg";
  }
  if (
    text.includes("lab") ||
    text.includes("komputer") ||
    text.includes("laboratorium") ||
    text.includes("bengkel")
  ) {
    return "/images/tempat/labsmkn2ska.jpeg";
  }
  return currentSrc ? resolveImageUrl(currentSrc) : "/images/tempat/halamandepansmkn2ska.jpg";
};

export default function FacilityCard({
  id = null,
  title = "Laboratorium Komputer",
  location = "SMKN 2 Surakarta",
  capacity = 36,
  category = "Umum",
  description = "",
  status = "tersedia",
  isActive = true,
  time = "07.00 s.d 17.00 WIB",
  imageSrc = "/images/tempat/lapangansmkn2ska.jpg",
  model3dUrl = null,
  managerTeacherName = "",
  onActionClick,
  onOpen3D,
}) {
  const isAvailable = isActive && (status || "").toLowerCase() === "tersedia";
  const displayTitle = (title || "").replace(/^\[SEED\]\s*/i, "").trim();
  const resolvedImageSrc = getCategoryMatchingImage(
    displayTitle,
    location,
    imageSrc,
  );
  const resolved3dUrl = resolve3DModelUrl({
    model3dUrl,
    title: displayTitle,
    category,
    location,
  });
  const [imgSrc, setImgSrc] = useState(resolvedImageSrc);

  const handleCardClick = () => {
    if (!isAvailable) return;
    onActionClick &&
      onActionClick({
        id,
        title: displayTitle,
        name: displayTitle,
        location,
        capacity,
        category,
        description,
        status,
        isActive,
        time,
        imageSrc: imgSrc,
        model3dUrl: resolved3dUrl || null,
        managerTeacherName,
      });
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group flex flex-col justify-between overflow-hidden rounded-none border bg-white p-3.5 transition-all duration-200 ${
        isAvailable
          ? "border-slate-200 hover:border-[#2c1ee8] hover:bg-slate-50/40 shadow-2xs cursor-pointer"
          : "border-slate-200 bg-slate-50 opacity-75 cursor-not-allowed"
      }`}
    >
      <div>
        {/* Card Cover Header */}
        <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-none border border-slate-200/80 bg-slate-100 p-2.5 flex flex-col justify-between">
          <img
            src={imgSrc}
            alt={displayTitle}
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isAvailable ? "" : "grayscale filter"
            }`}
            onError={() => {
              setImgSrc(getCategoryMatchingImage(displayTitle, location, null));
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

          {/* Badges Top Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                isAvailable
                  ? "bg-emerald-500 text-white border-emerald-600"
                  : "bg-rose-500 text-white border-rose-600"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-none bg-white" />
              {isAvailable ? "Tersedia" : "Nonaktif"}
            </span>

            <div className="flex items-center gap-1">
              {capacity > 0 && (
                <span className="inline-flex items-center gap-1 rounded-none border border-slate-200 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                  <Users className="w-3 h-3 text-[#2c1ee8]" />
                  <span>
                    {capacity}{" "}
                    {/barang|peralatan|alat|proyektor|printer|kamera|laptop|pc|cctv|sound|speaker|micro|headset|vr|ps5|gpu/i.test(
                      `${category || ""} ${displayTitle}`
                    )
                      ? "Unit"
                      : "Orang"}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Facility Title & Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2c1ee8]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[200px]">{location}</span>
          </div>

          <h3
            className={`text-sm sm:text-base font-bold transition-colors leading-snug line-clamp-2 ${
              isAvailable
                ? "text-slate-900 group-hover:text-[#2c1ee8]"
                : "text-slate-600"
            }`}
            title={displayTitle}
          >
            {displayTitle}
          </h3>

          {/* Manager Teacher Badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-blue-50 border border-blue-100 text-[#2c1ee8] text-[10.5px] font-bold">
            <UserCheck className="w-3 h-3" />
            <span className="truncate max-w-[220px]">
              Pengurus: {managerTeacherName ? managerTeacherName : "Tim Sarpras"}
            </span>
          </div>

          {description && (
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-normal">
              {description}
            </p>
          )}

          <div className="mt-2 rounded-none border border-slate-100 bg-slate-50 p-2 text-xs flex items-center justify-between text-slate-600">
            <span className="font-medium text-slate-400 text-[11px]">Jam Layanan</span>
            <span className="font-bold text-slate-800 text-[11px]">{time}</span>
          </div>
        </div>
      </div>

      {/* Card Action Button */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          disabled={!isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            if (isAvailable) handleCardClick();
          }}
          className={`w-full py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
            isAvailable
              ? "bg-[#2c1ee8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
          }`}
        >
          <span>
            {isAvailable ? "Ajukan Peminjaman" : "Fasilitas Nonaktif"}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
