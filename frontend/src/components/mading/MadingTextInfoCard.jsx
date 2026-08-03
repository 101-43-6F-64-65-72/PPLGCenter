"use client";

import React from "react";
import Image from "next/image";

export default function MadingTextInfoCard({ themeColor = "blue" }) {
  const isGreen = themeColor === "green";

  const cardGradient = isGreen
    ? "bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#10b981]"
    : "bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6]";

  const fadeOverlay = isGreen
    ? "bg-gradient-to-r from-transparent via-[#16a34a]/70 to-[#16a34a]"
    : "bg-gradient-to-r from-transparent via-[#1d4ed8]/70 to-[#1d4ed8]";

  return (
    <div
      className={`relative w-full rounded-[24px] sm:rounded-[32px] overflow-hidden ${cardGradient} text-white shadow-xl p-5 sm:p-7 lg:p-8 my-6 sm:my-8 transition-colors duration-500`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Action Image */}
        <div className="lg:col-span-5 relative h-[180px] sm:h-[230px] w-full rounded-[18px] sm:rounded-[24px] overflow-hidden shadow-md">
          <Image
            src="/images/tempat/lapangansmkn2ska.jpg"
            alt="Text Info Action"
            fill
            sizes="(max-width: 1024px) 100vw, 450px"
            className="object-cover"
          />
          {/* Subtle gradient overlay to match reference layout */}
          <div className={`absolute inset-0 ${fadeOverlay} hidden lg:block`}></div>
        </div>

        {/* Right Side: Text Info Title & Description */}
        <div className="lg:col-span-7 flex flex-col justify-center items-start pr-0 lg:pr-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 uppercase tracking-tight leading-none drop-shadow-sm">
            INFORMASI MADING DIGITAL
          </h2>

          <p className="text-xs sm:text-sm lg:text-base text-white/95 leading-relaxed font-normal max-w-xl">
            SMK Negeri 2 Surakarta menyediakan beragam kegiatan ekstrakurikuler dan pengumuman resmi yang dirancang untuk mengembangkan potensi serta kreativitas siswa di luar kegiatan akademik.
          </p>
        </div>
      </div>
    </div>
  );
}
