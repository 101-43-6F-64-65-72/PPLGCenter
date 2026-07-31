import React from "react";
import { Search } from "@/components/common/Icons";

/**
 * Reusable Production Empty State Component
 * Renders an engaging "Ups..." view when query results or list data are empty.
 */
export const EmptyState = ({
  title = "Ups... Data Tidak Ditemukan",
  description = "Maaf, belum ada data atau pengumuman yang sesuai dengan kriteria pencarian Anda saat ini.",
  onReset = null,
  resetLabel = "Reset Filter & Pencarian",
  icon = null,
  className = "",
}) => {
  return (
    <div
      className={`my-12 p-8 sm:p-14 rounded-[32px] bg-gradient-to-b from-blue-50/40 via-white to-gray-50/60 border border-blue-100/80 shadow-sm flex flex-col items-center justify-center text-center max-w-lg mx-auto transition-all duration-300 ${className}`}
    >
      {/* Icon Badge */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-3xl bg-blue-100/80 text-[#1d4ed8] flex items-center justify-center shadow-inner border border-blue-200/50 transform hover:scale-105 transition-transform duration-300">
          {icon || <Search className="w-10 h-10" />}
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1d4ed8] text-white text-xs font-black flex items-center justify-center shadow-md">
          !
        </div>
      </div>

      {/* Heading Title */}
      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
        {title}
      </h3>

      {/* Description Text */}
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-8 max-w-md font-normal">
        {description}
      </p>

      {/* Reset or Primary Action Button */}
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#1d4ed8] hover:bg-[#153e90] active:bg-[#102a5c] text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>{resetLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
