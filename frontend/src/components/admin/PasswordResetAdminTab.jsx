"use client";

import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";
import Button from "@/components/ui/Button";
import ErrorAlert from "@/components/common/ErrorAlert";
import { KeyRound, Check, X, RefreshCw, User, ShieldAlert } from "lucide-react";

export default function PasswordResetAdminTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [notesInput, setNotesInput] = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/api/auth/reset-password/admin/requests");
      setRequests(res?.data || []);
    } catch (err) {
      setError(err?.message || "Gagal mengambil daftar permohonan reset password.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (requestId, isApproved) => {
    setProcessingId(requestId);
    setError("");
    setSuccessMessage("");
    try {
      const adminNotes = notesInput[requestId] || null;
      const res = await apiClient.post(`/api/auth/reset-password/admin/${requestId}/review`, {
        isApproved,
        adminNotes,
      });

      setSuccessMessage(res?.message || (isApproved ? "Permohonan disetujui" : "Permohonan ditolak"));
      await fetchRequests();
    } catch (err) {
      setError(err?.message || "Gagal memproses permohonan.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 border border-slate-200 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-black">Persetujuan Reset Password</h2>
            <p className="text-xs text-black/60">Daftar permohonan lupa password yang menunggu verifikasi Admin</p>
          </div>
        </div>

        <Button
          onClick={fetchRequests}
          variant="outline"
          size="sm"
          isLoading={loading}
          className="!border-black/20 text-black rounded-xl flex items-center gap-2"
        >
          <span>Muat Ulang</span>
        </Button>
      </div>

      {error && <ErrorAlert title="Terjadi Kesalahan" message={error} onClose={() => setError("")} />}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-black/10 text-emerald text-sm font-semibold flex items-center gap-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-white/50 animate-pulse text-sm">
          Memuat daftar permohonan reset password...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white border border-white/10 rounded-3xl text-black">
          <p className="font-bold text-black text-sm">Tidak ada permohonan pending</p>
          <p className="text-xs text-black/40 mt-1">Semua permohonan reset password telah diproses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-3xl bg-white border border-white/10 hover:border-white/20 transition space-y-4 shadow-md hover:shadow-xl"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#200379] text-sm">{req.userFullName}</h3>
                    <p className="text-xs text-[#05319f] font-mono">
                      {req.userIdentifier} · <span className="text-[#05319f]/60">{req.userRole}</span>
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 text-amber-800 text-[10px] font-bold uppercase">
                  {req.statusText}
                </span>
              </div>

              {req.reason && (
                <div className=" p-3 text-xs text-black">
                  <span className="font-bold text-black block text-[10px] uppercase">Alasan:</span>
                  {req.reason}
                </div>
              )}

              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Catatan (Opsional)"
                  value={notesInput[req.id] || ""}
                  onChange={(e) => setNotesInput({ ...notesInput, [req.id]: e.target.value })}
                  className="w-full bg-[#e4efff] border border-white/20 rounded-xl px-3 py-2 text-xs text-black outline-none focus:border-blue-400 transition"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => handleReview(req.id, true)}
                  isLoading={processingId === req.id}
                  disabled={processingId === req.id}
                  className="flex-1 !bg-emerald-600 hover:!bg-emerald-500 text-white font-bold py-2.5 text-xs rounded-xl flex flex-row items-center justify-center gap-1.5"
                >
                  <span>Setujui (Approve)</span>
                </Button>

                <Button
                  onClick={() => handleReview(req.id, false)}
                  isLoading={processingId === req.id}
                  disabled={processingId === req.id}
                  className="flex-1 !bg-rose-600/80 hover:!bg-rose-600 text-white font-bold py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Tolak (Reject)</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
