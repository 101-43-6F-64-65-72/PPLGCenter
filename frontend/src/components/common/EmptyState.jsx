import React from "react";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * Reusable Production Empty State Component
 * Renders an engaging empty view when query results or list data are empty.
 */
export const EmptyState = ({
  title = "Data Tidak Ditemukan",
  description = "Maaf, belum ada data yang sesuai dengan kriteria pencarian Anda saat ini.",
  onReset = null,
  resetLabel = "Reset Filter & Pencarian",
  icon = null,
  className = "",
}) => {
  return (
    <div
      className={`my-8 p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-blue-50/30 via-white to-gray-50/40 border border-blue-100/70 shadow-xs flex flex-col items-center justify-center text-center max-w-md mx-auto transition-all duration-300 ${className}`}
    >
      {/* Icon Badge */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2c1ee8] flex items-center justify-center border border-blue-100 shadow-xs">
          {icon || <Search className="w-8 h-8 text-[#2c1ee8]" />}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#2c1ee8] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
          !
        </div>
      </div>

      {/* Heading Title */}
      <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-1.5">
        {title}
      </h3>

      {/* Description Text */}
      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-6 max-w-sm font-medium">
        {description}
      </p>

      {/* Reset or Primary Action Button */}
      {onReset && (
        <Button variant="primary" size="sm" onClick={onReset}>
          {resetLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

