"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { extracurricularService } from "@/services/extracurricularService";
import { resolveImageUrl } from "@/lib/utils";
import { Users, Clock, CheckCircle2, AlertCircle, XCircle, LogOut, Loader2 } from "lucide-react";

export default function MyExtracurricularsSection({ onStateChange }) {
  const [memberships, setMemberships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchMyMemberships = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await extracurricularService.getMyExtracurriculars();
      const rawData = res?.data ?? res;
      const items = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : [];
      setMemberships(items);
    } catch (err) {
      console.error("Failed to load student memberships:", err);
      setErrorMsg("Gagal memuat daftar keanggotaan Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyMemberships();
  }, []);

  const handleCancelJoin = async (ekskulId) => {
    setCancellingId(ekskulId);
    try {
      const res = await extracurricularService.leaveExtracurricular(ekskulId);
      if (res && (res.success || res.status === 200)) {
        await fetchMyMemberships();
        if (onStateChange) onStateChange();
      } else {
        alert(res?.message || "Gagal membatalkan pengajuan pendaftaran.");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal membatalkan pengajuan.");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-8 text-center animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded-md mx-auto mb-3" />
        <div className="h-4 w-64 bg-slate-100 rounded-md mx-auto" />
      </div>
    );
  }

  if (memberships.length === 0) {
    return null; // Hide section cleanly if student is not registered in any extracurriculars
  }

  return (
    <section className="mb-8 rounded-xl border border-blue-200/80 bg-blue-50/40 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2c1ee8]" />
            <span>Keanggotaan Saya</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar ekstrakurikuler yang Anda ikuti dan status pengajuan Anda.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-blue-100 text-[#2c1ee8] text-xs font-bold">
          {memberships.length} Keanggotaan
        </span>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberships.map((item) => {
          const isPending = item.myStatus === "Pending";
          const isActive = item.myStatus === "Active" || !item.myStatus;

          return (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs hover:border-[#2c1ee8] transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {item.category || "Umum"}
                  </span>
                  {isPending ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold">
                      <Clock className="w-3 h-3" />
                      <span>Menunggu Persetujuan</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Anggota Aktif</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 truncate">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/ekstrakurikuler/${item.id}`}
                  className="text-xs font-bold text-[#2c1ee8] hover:underline"
                >
                  Lihat Detail →
                </Link>

                {isPending && (
                  <button
                    type="button"
                    onClick={() => handleCancelJoin(item.id)}
                    disabled={cancellingId === item.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    {cancellingId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <LogOut className="w-3 h-3" />
                    )}
                    <span>Batalkan</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
