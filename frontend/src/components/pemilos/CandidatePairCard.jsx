"use client";

import React from "react";
import { CheckCircle2, Clock, XCircle, Users, Crown, Medal } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

const STATUS_CONFIG = {
  WaitingVice: {
    label: "Mencari Wakil",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  WaitingChairman: {
    label: "Menunggu Persetujuan Ketua",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  WaitingTeacher: {
    label: "Menunggu Review Guru",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  WaitingAdmin: {
    label: "Menunggu Persetujuan Admin",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  Approved: {
    label: "Resmi Terdaftar",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Rejected: {
    label: "Ditolak",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
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
  isMinCandidatesMet = true,
  onApplyVice,
  onChairmanReview,
  canApplyVice,
  canChairmanReview,
}) {
  const statusConfig = STATUS_CONFIG[pair.statusText] || STATUS_CONFIG.WaitingVice;
  const isApproved = pair.statusText === "Approved" || pair.status === 5;
  const canVote = isApproved && !hasVoted && onVote && isElectionOpen && electionTimeState === "ONGOING" && isMinCandidatesMet;

  return (
    <div
      className={`relative rounded-lg border overflow-hidden transition-all duration-200 ${
        isWinner
          ? "border-slate-300 bg-white ring-1 ring-slate-400/20 shadow-sm"
          : "border-slate-200 bg-white shadow-xs hover:border-slate-300"
      }`}
    >
      {/* Winner Banner */}
      {isWinner && (
        <div className="bg-slate-900 text-white px-3.5 py-1.5 flex items-center gap-2 border-b border-slate-800">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold tracking-wide uppercase">Pemenang Sementara</span>
        </div>
      )}

      {/* Candidate Number Badge */}
      <div className="absolute top-3.5 right-3.5 z-10">
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md border bg-slate-100 text-slate-800 border-slate-200">
          Paslon #{pair.candidateNumber}
        </span>
      </div>

      <div className="p-5">
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border mb-4 ${statusConfig.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
          {statusConfig.label}
        </div>

        {/* Chairman Card */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xl overflow-hidden">
              {pair.photoUrl ? (
                <img src={resolveImageUrl(pair.photoUrl)} alt={pair.chairmanName} className="w-full h-full object-cover" />
              ) : (
                pair.chairmanName?.[0] ?? "K"
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Calon Ketua</div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">{pair.chairmanName}</h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {pair.chairmanClass ?? "—"} · NIS {pair.chairmanNis ?? "—"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-2 my-2.5">
          <div className="flex-1 h-px bg-slate-100"></div>
          <div className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5 bg-slate-50 rounded-md border border-slate-200">+</div>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        {/* Vice Chairman Card */}
        {pair.viceUserId ? (
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-lg overflow-hidden shrink-0">
              {pair.vicePhotoUrl ? (
                <img src={resolveImageUrl(pair.vicePhotoUrl)} alt={pair.viceName} className="w-full h-full object-cover" />
              ) : (
                pair.viceName?.[0] ?? "W"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Calon Wakil</div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight">{pair.viceName}</h4>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {pair.viceClass ?? "—"} · NIS {pair.viceNis ?? "—"}
              </p>
            </div>
            {canChairmanReview && (
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onChairmanReview?.(pair.id, true)}
                  className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
                  title="Setujui Calon Wakil"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onChairmanReview?.(pair.id, false)}
                  className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors border border-rose-200 cursor-pointer"
                  title="Tolak Calon Wakil"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3.5 opacity-60">
            <div className="w-12 h-12 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Calon Wakil</div>
              <p className="text-xs text-slate-400 italic">Belum ada calon wakil</p>
            </div>
          </div>
        )}

        {/* Vision snippet */}
        {pair.vision && (
          <div className="mt-2.5 p-3 bg-slate-50/80 rounded-md border border-slate-200/80">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Visi</p>
            <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">{pair.vision}</p>
          </div>
        )}

        {/* Vote Count Bar */}
        {showVoteCount && isApproved && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium">Perolehan Suara</span>
              <span className="text-xs font-bold text-slate-900">{pair.voteCount} suara ({pair.votePercentage}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(pair.votePercentage, 2)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(pair)}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
            >
              <span>Detail Visi Misi</span>
            </button>
          )}

          {canVote && (
            <button
              onClick={() => onVote(pair.id)}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-md transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Medal className="w-3.5 h-3.5" />
              <span>Pilih Pasangan Ini</span>
            </button>
          )}

          {isApproved && !hasVoted && !isMinCandidatesMet && electionTimeState === "ONGOING" && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold" title="Voting butuh minimal 2 pasangan calon">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Voting Terkunci (Min. 2 Paslon)</span>
            </div>
          )}

          {isApproved && hasVoted && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Anda Sudah Memilih</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
