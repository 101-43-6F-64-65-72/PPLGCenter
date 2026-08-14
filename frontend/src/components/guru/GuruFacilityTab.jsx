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
import facilityService from "@/services/facilityService";
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

export default function GuruFacilityTab({ managedFacilities = [] }) {
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
      // Use getManagedBookings to fetch bookings for facilities assigned to this teacher
      const data = await facilityService.getManagedBookings({ pageSize: 100 });
      if (Array.isArray(data)) {
        setBookings(data);
        setApiState(data.length > 0 ? "success" : "empty");
      } else {
        setBookings([]);
        setApiState("empty");
      }
    } catch (err) {
      setApiState("error");
      setErrorMessage("Gagal memuat data peminjaman fasilitas binaan.");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filtered = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      (b.bookedByUserName || "").toLowerCase().includes(q) ||
      (b.purpose || "").toLowerCase().includes(q) ||
      (b.facilityName || "").toLowerCase().includes(q)
    );
  });

  // Schedule timeline: bookings that are Approved (Status = 1 or Approved)
  const approvedBookings = bookings.filter(
    (b) => b.status === 1 || b.status === "Approved" || b.status === "Disetujui"
  );

  const handleUpdateStatus = async (bookingId, statusNum) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await facilityService.updateBookingStatus(bookingId, statusNum, note);
      toast.success(statusNum === 1 ? "Peminjaman fasilitas berhasil disetujui!" : "Peminjaman fasilitas ditolak.");
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

  const formatDateTime = (dtStr) => {
    if (!dtStr) return "-";
    const d = new Date(dtStr);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Managed Facilities Header Banner */}
      {managedFacilities.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-blue-200 font-semibold uppercase tracking-wider block">
              Fasilitas Pengelolaan Anda
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {managedFacilities.map((f) => (
                <span
                  key={f.id}
                  className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white border border-white/20 flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-300" />
                  {f.name} ({f.location})
                </span>
              ))}
            </div>
          </div>
          <div className="text-xs text-blue-200 font-medium">
            Total {managedFacilities.length} Fasilitas Berwenang
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari peminjam, fasilitas, atau tujuan kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold text-[#2c1ee8] bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
          <ShieldCheck className="w-4 h-4" />
          <span>Monitoring Pengurus Fasilitas</span>
        </div>
      </div>

      {/* Bookings Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2c1ee8]" />
            <span>Permohonan Peminjaman Fasilitas ({filtered.length})</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">Persetujuan Pengurus</span>
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        b.status === 1 || b.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : b.status === 2 || b.status === "Rejected"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{b.status === 1 || b.status === "Approved" ? "Disetujui" : b.status === 2 || b.status === "Rejected" ? "Ditolak" : "Menunggu Approval"}</span>
                      </span>
                      <span className="text-xs font-extrabold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                        Peminjam: {b.bookedByUserName || "Pengguna"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(b.startTime)} - {formatDateTime(b.endTime)}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-gray-900">
                        &quot;{b.purpose || "Peminjaman Fasilitas"}&quot;
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="font-bold text-[#2c1ee8]">{b.facilityName || "Fasilitas SMKN 2"}</span>
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
                Tidak ada peminjaman fasilitas yang masuk untuk fasilitas kelolaan Anda.
              </p>
            </div>
          )}
        </AnimatedContent>
      </div>

      {/* Jadwal Penggunaan Fasilitas yang Disetujui */}
      {approvedBookings.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Jadwal Penggunaan Fasilitas Terkonfirmasi ({approvedBookings.length})</span>
            </h3>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Disetujui Guru Pengurus
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvedBookings.map((b) => (
              <div key={b.id} className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">{b.facilityName}</span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {b.bookedByUserName}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-gray-900 line-clamp-1">&quot;{b.purpose}&quot;</h5>
                <div className="text-[11px] text-gray-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>{formatDateTime(b.startTime)} s/d {formatDateTime(b.endTime)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Detail & Action */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">
                Persetujuan Peminjaman Fasilitas
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
                  <span className="text-xs text-gray-400 block font-bold">Nama Peminjam:</span>
                  <span className="font-extrabold text-gray-900">{selectedBooking.bookedByUserName || "Pengguna"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Tujuan / Kegiatan:</span>
                  <span className="font-extrabold text-[#2c1ee8]">{selectedBooking.purpose || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Fasilitas:</span>
                  <span className="font-bold text-gray-800">{selectedBooking.facilityName}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Waktu Digunakan:</span>
                  <span className="font-bold text-gray-800">
                    {formatDateTime(selectedBooking.startTime)} s/d {formatDateTime(selectedBooking.endTime)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Catatan / Alasan Penolakan (Opsional):</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tambahkan pesan atau catatan persetujuan/penolakan..."
                  className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs focus:bg-white focus:border-[#2c1ee8] outline-none transition"
                  rows={3}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => handleUpdateStatus(selectedBooking.id, 2)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Tolak Peminjaman
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedBooking.id, 1)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Disetujui Pengurus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
