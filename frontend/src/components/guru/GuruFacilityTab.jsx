"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Eye,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import bookingService from "@/services/bookingService";
import AnimatedContent from "@/components/common/AnimatedContent";
import toast from "react-hot-toast";

const FacilitySkeleton = () => (
  <div className="divide-y divide-gray-100 animate-pulse">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="p-5 space-y-3">
        <div className="h-5 w-24 bg-slate-200 rounded-full" />
        <div className="h-6 w-1/2 bg-slate-200 rounded-md" />
        <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
      </div>
    ))}
  </div>
);

export default function GuruFacilityTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [note, setNote] = useState("");
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiState, setApiState] = useState("loading"); // "loading" | "success" | "empty" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setApiState("loading");
    setErrorMessage("");

    try {
      const data = await bookingService.getBookings({ pageSize: 100 });
      if (Array.isArray(data)) {
        setBookings(data);
        setApiState(data.length > 0 ? "success" : "empty");
      } else {
        setBookings([]);
        setApiState("empty");
      }
    } catch (err) {
      setApiState("error");
      setErrorMessage("Gagal memuat data peminjaman fasilitas.");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filtered = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      (b.organization || "").toLowerCase().includes(q) ||
      (b.activityName || b.purpose || "").toLowerCase().includes(q) ||
      (b.facilityTitle || "").toLowerCase().includes(q)
    );
  });

  const handleUpdateStatus = async (bookingId, statusNum) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await bookingService.updateBookingStatus(bookingId, statusNum, note);
      toast.success(statusNum === 1 ? "✓ Peminjaman fasilitas berhasil disetujui!" : "Peminjaman fasilitas ditolak.");
      await fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui status peminjaman.");
    } finally {
      setIsSubmitting(false);
      setSelectedBooking(null);
      setNote("");
    }
  };

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) fetchBookings();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchBookings]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kegiatan, fasilitas, atau organisasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold text-[#2c1ee8] bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
          <ShieldCheck className="w-4 h-4" />
          <span>Monitoring Peminjaman Guru Pembina</span>
        </div>
      </div>

      {/* Bookings Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2c1ee8]" />
            <span>Permohonan Peminjaman Fasilitas ({filtered.length})</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">Persetujuan Guru</span>
        </div>

        <AnimatedContent isLoading={isLoading} skeleton={<FacilitySkeleton />}>
          {apiState === "error" ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Gagal Memuat Peminjaman</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={fetchBookings}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-[#2218a3] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filtered.map((b) => (
                <div key={b.id} className="p-5 hover:bg-gray-50/80 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2c1ee8] border border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{b.status || "Terverifikasi"}</span>
                      </span>
                      <span className="text-xs font-extrabold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                        {b.organization || "Ekstrakurikuler"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">Tanggal Kegiatan: {b.date || "Terjadwal"}</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-gray-900">
                        &quot;{b.activityName || b.purpose || "Peminjaman Fasilitas"}&quot;
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="font-bold text-[#2c1ee8]">{b.facilityTitle || "Fasilitas SMKN 2"}</span>
                        <span>•</span>
                        <span className="bg-blue-50 text-[#2c1ee8] px-2 py-0.5 rounded font-semibold">
                          Jam: {b.slotFormatted || "Sesuai Jadwal"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="self-start md:self-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Detail & Verifikasi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-[#2c1ee8] rounded-2xl flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Belum Ada Permohonan Peminjaman</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Tidak ada peminjaman fasilitas yang sesuai dengan pencarian.
              </p>
            </div>
          )}
        </AnimatedContent>
      </div>

      {/* Modal Detail & Action */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">
                Persetujuan Peminjaman Guru Pembina
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
                  <span className="font-extrabold text-gray-900">{selectedBooking.organization || "Ekstrakurikuler"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Nama / Tujuan Kegiatan:</span>
                  <span className="font-extrabold text-[#2c1ee8]">{selectedBooking.activityName || selectedBooking.purpose || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Fasilitas & Jam:</span>
                  <span className="font-bold text-gray-800">{selectedBooking.facilityTitle} ({selectedBooking.slotFormatted || "Sesuai Jadwal"})</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 block mb-1">Deskripsi & Tujuan:</span>
                <p className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs leading-relaxed">
                  {selectedBooking.description || selectedBooking.purpose || "Tidak ada deskripsi tambahan."}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => handleUpdateStatus(selectedBooking.id, 2)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Tolak Peminjaman
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedBooking.id, 1)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Disetujui Guru Pembina</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
