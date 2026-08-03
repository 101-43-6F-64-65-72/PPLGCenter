"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";

export default function FacilityCard({
  title = "LAPANGAN",
  time = "07.00 s.d 14.00",
  status = "tersedia",
  imageSrc = "/images/tempat/lapangansmkn2ska.jpg",
  onActionClick,
  badgeText = "Tersedia",
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Status color styles
  const isAvailable = status.toLowerCase() === "tersedia";
  const statusColorClass = isAvailable
    ? "text-blue-300 font-semibold"
    : "text-amber-400 font-semibold";

  return (
    <motion.div
      className="relative h-[340px] sm:h-[360px] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300 flex-shrink-0 select-none border border-black/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)}
      animate={{
        width: isHovered ? 440 : 230,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      style={{ minWidth: 230 }}
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className={`object-cover transition-transform duration-700 ease-out ${
            isHovered ? "scale-105" : "scale-100"
          }`}
          sizes="(max-width: 768px) 100vw, 440px"
        />
        {/* Dark overlay for text contrast in normal state */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {/* NORMAL STATE: Title at Bottom Center */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 z-10 transition-all duration-300 ${
          isHovered
            ? "opacity-0 pointer-events-none translate-y-4"
            : "opacity-100 translate-y-0"
        }`}
      >
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider uppercase drop-shadow-md text-center">
          {title}
        </h3>
      </div>

      {/* HOVER STATE: Split View (Left Image Overlay + Right Info Panel) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-20 flex w-full h-full"
          >
            {/* Left Portion: Fixed Width Image with subtle dark gradient overlay */}
            <div className="w-[210px] h-full relative flex-shrink-0">
              <Image
                src={imageSrc}
                alt={title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/70" />
            </div>

            {/* Right Portion: Dark Primary Navy Info Card */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 h-full bg-[#0d1638] px-5 py-6 flex flex-col justify-between items-start text-white shadow-inner"
            >
              <div className="space-y-1.5 w-full">
                <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide leading-tight text-white">
                  {title}
                </h3>
                <p className="text-sm font-medium text-blue-100/90 tracking-wide">
                  {time}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span className={`text-sm lowercase ${statusColorClass}`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Action Button: "Lihat jadwal" */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick && onActionClick({ title, time, status, imageSrc });
                }}
                className="w-full mt-auto bg-[#2c1ee8] hover:bg-[#2218a3] active:scale-95 text-white font-semibold text-sm sm:text-base py-3 px-4 rounded-2xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lihat jadwal</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
