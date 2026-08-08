"use client";

import React from "react";
import { Loader2, AlertCircle, RotateCcw, Users } from "lucide-react";
import useUserOrganizations from "@/hooks/useUserOrganizations";

export const OTHER_OPTION_VALUE = "Lainnya (Ketik Manual)";

export default function OrganizationSelect({
  value = "",
  customValue = "",
  onChange,
  onCustomChange,
  error = "",
  customError = "",
  label = "Nama Organisasi / Ekstrakurikuler Terdaftar",
  required = true,
  className = "",
}) {
  const { organizations, userOrganizations, isLoading, error: fetchError, refetch } = useUserOrganizations();

  const isOtherSelected = value === OTHER_OPTION_VALUE;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Select Dropdown Container */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          disabled={isLoading}
          required={required}
          className={`w-full px-4 py-3 rounded-2xl border bg-gray-50/50 text-xs sm:text-sm text-gray-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 ${
            error ? "border-rose-400 focus:border-rose-500" : "border-gray-200 focus:border-[#2c1ee8]"
          }`}
        >
          <option value="" disabled hidden>
            {isLoading
              ? "-- Memuat keanggotaan organisasi Anda... --"
              : "-- Pilih Organisasi / Ekstrakurikuler Anda --"}
          </option>

          {/* Render user joined extracurriculars if available */}
          {userOrganizations && userOrganizations.length > 0 && (
            <optgroup label="Ekstrakurikuler Anda">
              {userOrganizations.map((item) => {
                const name = typeof item === "string" ? item : (item.name || item.Name || item.title || item.Title);
                const key = typeof item === "object" ? (item.id || item.Id || name) : item;
                return (
                  <option key={`my-${key}`} value={name}>
                    {name}
                  </option>
                );
              })}
            </optgroup>
          )}

          {/* Render all registered school extracurriculars & organizations */}
          {organizations && organizations.length > 0 && (
            <optgroup label="Daftar Ekstrakurikuler & Organisasi Sekolah">
              {organizations.map((item) => {
                const name = typeof item === "string" ? item : (item.name || item.Name || item.title || item.Title);
                const key = typeof item === "object" ? (item.id || item.Id || name) : item;
                return (
                  <option key={`all-${key}`} value={name}>
                    {name}
                  </option>
                );
              })}
            </optgroup>
          )}

          {/* Always append "Lainnya (Ketik Manual)" as the LAST option */}
          <option value={OTHER_OPTION_VALUE}>{OTHER_OPTION_VALUE}</option>
        </select>

        {/* Loading Spinner or Arrow/Users Icon */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-gray-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#2c1ee8]" />
          ) : (
            <Users className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Fetch Error Notice with Retry */}
      {fetchError && (
        <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-medium">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Select Field Error Message */}
      {error && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Manual Input Field when "Lainnya" is selected */}
      {isOtherSelected && (
        <div className="pt-1.5 space-y-1">
          <input
            type="text"
            placeholder="Ketik nama organisasi / kelas secara manual..."
            value={customValue}
            onChange={(e) => onCustomChange && onCustomChange(e.target.value)}
            required={required}
            className={`w-full px-4 py-2.5 rounded-2xl border bg-white text-xs sm:text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all ${
              customError ? "border-rose-400 focus:border-rose-500" : "border-gray-200 focus:border-[#2c1ee8]"
            }`}
          />
          {customError && (
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{customError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
