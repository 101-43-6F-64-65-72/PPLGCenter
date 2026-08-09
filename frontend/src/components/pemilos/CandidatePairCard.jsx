"use client";

import React from "react";
import { CheckCircle2, Clock, XCircle, Users, Star, Crown, Medal } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

const STATUS_CONFIG = {
  WaitingVice: {
    label: "Mencari Wakil",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  WaitingChairman: {
    label: "Menunggu Persetujuan Ketua",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
  },
  WaitingTeacher: {
    label: "Menunggu Review Guru",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-400",
  },
  WaitingAdmin: {
    label: "Menunggu Persetujuan Admin",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-400",
  },
  Approved: {
    label: "Resmi Terdaftar",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-400",
  },
  Rejected: {
    label: "Ditolak",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-400",
  },
};

export default function CandidatePairCard({
  pair,
  rank,
  isWinner,
  showVoteCount,
  onVote,
  onViewDetail,
  hasVoted,
  isElectionOpen,
  electionTimeState,
  onApplyVice,
  onChairmanReview,
  canApplyVice,
  canChairmanReview,
}) {
  const statusConfig = STATUS_CONFIG[pair.statusText] || STATUS_CONFIG.WaitingVice;
  const isApproved = pair.statusText === "Approved" || pair.status === 5;
  const canVote = isApproved && !hasVoted && onVote && isElectionOpen && electionTimeState === "ONGOING";

  return (
    <div
      className={`relative rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isWinner
          ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-yellow-50 shadow-lg shadow-amber-100"
          : "border-gray-200 bg-white shadow-sm hover:border-gray-300"
      }`}
    >
      {/* Winner Banner */}
      {isWinner && (
        <div className="bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2 flex items-center gap-2">
          <Crown className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-black tracking-wider uppercase">Pemenang Sementara</span>
        </div>
      )}

      {/* Candidate Number Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ${
          isApproved ? "bg-[#2c1ee8] text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {pair.candidateNumber}
        </div>
      </div>

      <div className="p-6">
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-5 ${statusConfig.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
          {statusConfig.label}
        </div>

        {/* Chairman Card — Dominant */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2c1ee8] to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-200 overflow-hidden">
              {pair.photoUrl ? (
                <img src={resolveImageUrl(pair.photoUrl)} alt={pair.chairmanName} className="w-full h-full object-cover" />
              ) : (
                pair.chairmanName?.[0] ?? "K"
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#2c1ee8] rounded-xl px-1.5 py-0.5">
              <Crown className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Calon Ketua</div>
            <h3 className="text-base font-black text-gray-900 truncate">{pair.chairmanName}</h3>
            <p className="text-xs text-gray-500 font-medium">
              {pair.chairmanClass ?? "—"} · NIS {pair.chairmanNis ?? "—"}
            </p>
          </div>
        </div>

        {/* Divider with connector */}
        <div className="relative flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-gray-100"></div>
          <div className="text-xs text-gray-400 font-bold px-2 py-1 bg-gray-50 rounded-full border border-gray-200">+</div>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        {/* Vice Chairman Card — Attached, slightly smaller */}
        {pair.viceUserId ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg overflow-hidden shadow-sm">
              {pair.vicePhotoUrl ? (
                <img src={resolveImageUrl(pair.vicePhotoUrl)} alt={pair.viceName} className="w-full h-full object-cover" />
              ) : (
                pair.viceName?.[0] ?? "W"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Calon Wakil</div>
              <h4 className="text-sm font-bold text-gray-800 truncate">{pair.viceName}</h4>
              <p className="text-xs text-gray-400 font-medium">
                {pair.viceClass ?? "—"} · NIS {pair.viceNis ?? "—"}
              </p>
            </div>
            {canChairmanReview && (
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onChairmanReview?.(pair.id, true)}
                  className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors border border-emerald-200"
                  title="Setujui Calon Wakil"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onChairmanReview?.(pair.id, false)}
                  className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-200"
                  title="Tolak Calon Wakil"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4 opacity-60">
            <div className="w-12 h-12 rounded-xl bg-dashed border-2 border-dashed border-gray-300 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Calon Wakil</div>
              <p className="text-sm text-gray-400 italic">Belum ada calon wakil</p>
            </div>
          </div>
        )}

        {/* Vision snippet */}
        {pair.vision && (
          <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Visi</p>
            <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{pair.vision}</p>
          </div>
        )}

        {/* Vote Count Bar */}
        {showVoteCount && isApproved && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 font-semibold">Perolehan Suara</span>
              <span className="text-xs font-black text-[#2c1ee8]">{pair.voteCount} suara · {pair.votePercentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isWinner
                    ? "bg-gradient-to-r from-amber-400 to-yellow-400"
                    : "bg-gradient-to-r from-[#2c1ee8] to-blue-500"
                }`}
                style={{ width: `${Math.max(pair.votePercentage, 2)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(pair)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm py-2.5 px-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-gray-200"
            >
              <span>Detail Visi Misi</span>
            </button>
          )}

          {canVote && (
            <button
              onClick={() => onVote(pair.id)}
              className="flex-1 bg-[#2c1ee8] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-2.5 px-3 rounded-2xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Medal className="w-4 h-4" />
              <span>Pilih Pasangan Ini</span>
            </button>
          )}

          {isApproved && hasVoted && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Anda Sudah Memilih</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
