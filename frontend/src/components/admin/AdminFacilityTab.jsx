"use client";

import React, { useState } from "react";
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Eye,
  Plus,
  Package,
  Check,
  AlertCircle
} from "lucide-react";
import facilityService from "@/services/facilityService";

export default function AdminFacilityTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [note, setNote] = useState("");
  const [bookings, setBookings] = useState([]);

  React.useEffect(() => {
    facilityService.getBookings().then((res) => {
      if (Array.isArray(res)) setBookings(res);
    });
  }, []);

  const filtered = bookings.filter((b) => {
    return (
      b.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.facilityTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleUpdateStatus = (bookingId, newStatus) => {
    facilityService.updateBookingStatus(bookingId, newStatus, note).catch((err) => {
      console.warn("Async booking update warning:", err);
    });

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus, verificator: "Admin Sarpras" } : b
      )
    );
    setSelectedBooking(null);
    setNote("");
  };

  return (
    <div className="space-y-6">
      {/* Search & Quick Controls Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari booking, tempat, atau alat sarpras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold text-[#2c1ee8] bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
          <ShieldCheck className="w-4 h-4" />
          <span>Pengelolaan Sarpras & Approval Kunci</span>
        </div>
      </div>

      {/* Bookings Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2c1ee8]" />
            <span>Persetujuan Peminjaman Sarpras ({filtered.length})</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">Final Approval Admin</span>
        </div>

        <div className="divide-y divide-gray-100">
          {filtered.map((b) => (
            <div key={b.id} className="p-5 hover:bg-gray-50/80 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2c1ee8] border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{b.status}</span>
                  </span>
                  <span className="text-xs font-extrabold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                    {b.organization}
                  </span>
                </div>
                <span className="text-xs text-gray-400">Tanggal Kegiatan: {b.date}</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-gray-900">
                    &quot;{b.activityName}&quot;
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="font-bold text-[#2c1ee8]">{b.facilityTitle}</span>
                    <span>•</span>
                    <span className="bg-blue-50 text-[#2c1ee8] px-2 py-0.5 rounded font-semibold">
                      Jam: {b.slotFormatted}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBooking(b)}
                  className="self-start md:self-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Detail & Verifikasi Admin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Detail & Action */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">
                Persetujuan Final Sarpras Admin
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Organisasi Terdaftar:</span>
                  <span className="font-extrabold text-gray-900">{selectedBooking.organization}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Nama Kegiatan:</span>
                  <span className="font-extrabold text-[#2c1ee8]">{selectedBooking.activityName}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Fasilitas & Jam:</span>
                  <span className="font-bold text-gray-800">{selectedBooking.facilityTitle} ({selectedBooking.slotFormatted})</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 block mb-1">Deskripsi Kegiatan:</span>
                <p className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs leading-relaxed">
                  {selectedBooking.description}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => handleUpdateStatus(selectedBooking.id, "Ditolak Admin")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Tolak Peminjaman
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedBooking.id, "Disetujui Admin")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ACC Final (Disetujui Admin Sarpras)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
