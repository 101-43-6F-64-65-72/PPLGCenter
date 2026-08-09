"use client";

import React, { useState } from "react";
import { X, Shield, Crown, AlertCircle, Loader2 } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

export default function VoteModal({ pair, onClose, onConfirm, isLoading }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-[#2c1ee8] to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-white/80" />
              <span className="text-white font-bold text-sm">Konfirmasi Suara Anda</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/70 text-xs mt-1">
            Suara bersifat rahasia dan tidak dapat diubah setelah dikonfirmasi.
          </p>
        </div>

        <div className="p-6">
          {/* Candidate display */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5">
            {/* Chairman */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2c1ee8] to-blue-600 flex items-center justify-center text-white font-black text-lg overflow-hidden">
                {pair.photoUrl
                  ? <img src={resolveImageUrl(pair.photoUrl)} alt={pair.chairmanName} className="w-full h-full object-cover" />
                  : pair.chairmanName?.[0] ?? "K"
                }
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-gray-400 font-semibold">Calon Ketua</span>
                </div>
                <p className="font-black text-gray-900 text-sm">{pair.chairmanName}</p>
                <p className="text-xs text-gray-500">{pair.chairmanClass}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-bold">pasangan dengan</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Vice */}
            {pair.viceUserId && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                  {pair.vicePhotoUrl
                    ? <img src={resolveImageUrl(pair.vicePhotoUrl)} alt={pair.viceName} className="w-full h-full object-cover" />
                    : pair.viceName?.[0] ?? "W"
                  }
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold block">Calon Wakil Ketua</span>
                  <p className="font-bold text-gray-800 text-sm">{pair.viceName}</p>
                  <p className="text-xs text-gray-400">{pair.viceClass}</p>
                </div>
              </div>
            )}

            {/* Candidate number */}
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">Nomor Pasangan</span>
              <span className="text-xl font-black text-[#2c1ee8]">{pair.candidateNumber}</span>
            </div>
          </div>

          {/* Warning */}
          {confirmed && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-5">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">
                Anda akan memberikan suara kepada pasangan ini. Tindakan ini <strong>tidak dapat dibatalkan</strong>. Klik tombol di bawah untuk mengkonfirmasi.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 ${
                confirmed
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200"
                  : "bg-[#2c1ee8] hover:bg-blue-700 shadow-md shadow-blue-200"
              }`}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              ) : confirmed ? (
                "Ya, Konfirmasi Suara Saya"
              ) : (
                "Pilih Pasangan Ini →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
