"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, User, X, Loader2, AlertCircle } from "lucide-react";
import userService from "@/services/userService";
import { resolveImageUrl } from "@/lib/utils";

export default function TeacherSelect({
  value,
  onChange,
  teachersList = null,
  label = "Guru Pembimbing / Pembina",
  placeholder = "Cari via NIP atau Nama Guru...",
  required = false,
  error = "",
  className = "",
}) {
  const [teachers, setTeachers] = useState(teachersList || []);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (teachersList && teachersList.length > 0) {
      setTeachers(teachersList);
    } else {
      fetchTeachers();
    }
  }, [teachersList]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await userService.getTeachers();
      let list = [];
      if (res?.data) {
        list = Array.isArray(res.data) ? res.data : (res.data.items || []);
      } else if (Array.isArray(res)) {
        list = res;
      }
      setTeachers(list);
    } catch (err) {
      console.error("Gagal mengambil data guru:", err);
      setFetchError("Gagal memuat daftar guru.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === value);

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (t.fullName || t.name || "").toLowerCase().includes(q);
    const nipMatch = (t.nip || "").toLowerCase().includes(q);
    const emailMatch = (t.email || "").toLowerCase().includes(q);
    return nameMatch || nipMatch || emailMatch;
  });

  const handleSelect = (teacher) => {
    if (onChange) {
      onChange(teacher ? teacher.id : "", teacher);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange("", null);
    }
    setSearchQuery("");
  };

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Select Box Input Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-2xl border bg-gray-50/50 hover:bg-white text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-2 border-gray-200 ${
          isOpen ? "ring-2 ring-[#2c1ee8]/20 border-[#2c1ee8] bg-white" : ""
        } ${error ? "border-rose-400" : ""}`}
      >
        {selectedTeacher ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[#2c1ee8] font-bold text-xs flex-shrink-0 overflow-hidden">
              {selectedTeacher.photoUrl ? (
                <img src={resolveImageUrl(selectedTeacher.photoUrl)} alt={selectedTeacher.fullName || selectedTeacher.name} className="w-full h-full object-cover" />
              ) : (
                (selectedTeacher.fullName || selectedTeacher.name)?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
              )}
            </div>
            <div className="truncate text-left">
              <div className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                <span>{selectedTeacher.fullName || selectedTeacher.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2c1ee8] text-[10px] font-bold border border-blue-100">
                  Guru
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium truncate">
                {selectedTeacher.nip ? `NIP: ${selectedTeacher.nip}` : "NIP: -"}
                {selectedTeacher.phoneNumber ? ` • WA: ${selectedTeacher.phoneNumber}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 font-medium truncate">
            {loading ? "Memuat data guru..." : "-- Pilih / Cari Guru Pembimbing --"}
          </span>
        )}

        <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
          {selectedTeacher && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 hover:text-rose-600 rounded-full transition-colors"
              title="Hapus Pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#2c1ee8]" />
          ) : (
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Search Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:border-[#2c1ee8] focus:ring-1 focus:ring-[#2c1ee8]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Teacher Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 p-1">
            {fetchError ? (
              <div className="p-4 text-center text-xs text-rose-500 space-y-2">
                <p>{fetchError}</p>
                <button
                  type="button"
                  onClick={fetchTeachers}
                  className="px-3 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 text-[11px]"
                >
                  Coba Lagi
                </button>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 font-medium">
                {searchQuery ? `Tidak ada guru dengan NIP/Nama "${searchQuery}"` : "Belum ada data guru terdaftar."}
              </div>
            ) : (
              filteredTeachers.map((t) => {
                const isSelected = t.id === value;
                const teacherName = t.fullName || t.name;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? "bg-blue-50/70 border border-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0 overflow-hidden">
                        {t.photoUrl ? (
                          <img src={resolveImageUrl(t.photoUrl)} alt={teacherName} className="w-full h-full object-cover" />
                        ) : (
                          teacherName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{teacherName}</p>
                        <p className="text-[11px] text-gray-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
                          {t.nip ? (
                            <span className="bg-blue-50 text-[#2c1ee8] px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold border border-blue-100">
                              NIP: {t.nip}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">NIP: -</span>
                          )}
                          {t.phoneNumber && <span className="text-gray-400">• WA: {t.phoneNumber}</span>}
                        </p>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-[#2c1ee8] flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
