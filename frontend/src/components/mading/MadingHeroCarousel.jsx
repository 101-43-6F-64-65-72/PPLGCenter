"use client";

import React from "react";
import Image from "next/image";

/**
 * Legacy Mading Hero Carousel Component
 * Preserved for layout compatibility, delegates to empty state when no items provided.
 */
export default function MadingHeroCarousel() {
  const scrollToCatalog = () => {
    const catalogElement = document.getElementById("mading-catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative w-full h-full flex-1 bg-[#071329] text-white flex flex-col justify-between select-none overflow-hidden shadow-xl">
      <div className="absolute inset-0 z-0 w-full h-full">
        <Image
          src="/images/hero-building.png"
          alt="SMK Negeri 2 Surakarta"
          fill
          sizes="100vw"
          className="object-cover object-center brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071329] via-[#071329]/90 to-[#071329]/40 pointer-events-none" />
      </div>

      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-6 sm:px-12 lg:px-20 h-full pt-20 lg:pt-24">
        <div className="lg:col-span-8 flex flex-col items-start text-left my-auto py-6">
          <div className="inline-flex items-center gap-2 bg-blue-600/90 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow-lg border border-blue-400/30 tracking-wider uppercase">
            <span>★ MADING DIGITAL SMK NEGERI 2 SURAKARTA</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-[800] text-white tracking-tight uppercase leading-tight mb-4 drop-shadow-xl">
            PORTAL INFORMASI SISWA
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-blue-100/90 leading-relaxed max-w-xl mb-8 font-normal drop-shadow">
            Informasi publikasi mading digital SMK Negeri 2 Surakarta bersumber langsung dari REST API.
          </p>

          <button
            onClick={scrollToCatalog}
            className="inline-flex items-center justify-center gap-2.5 bg-white text-[#071329] hover:bg-blue-50 font-bold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Jelajahi Berita</span>
          </button>
        </div>
      </div>
    </div>
  );
}
