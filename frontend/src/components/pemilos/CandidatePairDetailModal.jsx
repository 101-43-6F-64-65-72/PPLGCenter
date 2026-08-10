"use client";

import React from "react";
import { X, Crown, Users, CheckCircle2, Medal, Target, Award, ListCheck } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

export default function CandidatePairDetailModal({
  pair,
  onClose,
  onVote,
  hasVoted,
  isElectionOpen,
  electionTimeState,
  isMinCandidatesMet = true,
}) {
  if (!pair) return null;

  const isApproved = pair.statusText === "Approved" || pair.status === 5;
  const canVote = isElectionOpen && isApproved && !hasVoted && electionTimeState === "ONGOING" && isMinCandidatesMet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col my-auto border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-[#2c1ee8] via-blue-600 to-indigo-700 px-6 sm:px-8 py-6 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            aria-label="Tutup Detail"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-inner border border-white/30">
              #{pair.candidateNumber}
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-100 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              PASANGAN CALON KETUA & WAKIL OSIS
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {pair.chairmanName || "Calon Ketua"}
            {pair.viceName && <span className="text-blue-200 font-normal"> & {pair.viceName}</span>}
          </h2>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-gray-800">
          
          {/* Candidates Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Chairman Profile */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2c1ee8] to-blue-600 flex items-center justify-center text-white font-black text-2xl overflow-hidden shadow-md flex-shrink-0">
                {pair.photoUrl ? (
                  <img src={resolveImageUrl(pair.photoUrl)} alt={pair.chairmanName} className="w-full h-full object-cover" />
                ) : (
                  pair.chairmanName?.[0] ?? "K"
                )}
                <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-lg p-0.5 shadow">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Calon Ketua OSIS</span>
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">{pair.chairmanName}</h3>
                {(pair.chairmanClass || pair.chairmanNis) && (
                  <p className="text-xs text-gray-500 font-medium">
                    {pair.chairmanClass ?? ""} {pair.chairmanNis ? `· NIS ${pair.chairmanNis}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Vice Chairman Profile */}
            {pair.viceUserId || pair.viceName ? (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-700 font-black text-2xl overflow-hidden shadow-sm flex-shrink-0">
                  {pair.vicePhotoUrl ? (
                    <img src={resolveImageUrl(pair.vicePhotoUrl)} alt={pair.viceName} className="w-full h-full object-cover" />
                  ) : (
                    pair.viceName?.[0] ?? "W"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Calon Wakil Ketua</span>
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">{pair.viceName}</h3>
                  {(pair.viceClass || pair.viceNis) && (
                    <p className="text-xs text-gray-500 font-medium">
                      {pair.viceClass ?? ""} {pair.viceNis ? `· NIS ${pair.viceNis}` : ""}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center gap-3 opacity-60">
                <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold block uppercase">Calon Wakil Ketua</span>
                  <p className="text-xs text-gray-400 italic">Belum terdaftar</p>
                </div>
              </div>
            )}

          </div>

          {/* Visi Section */}
          {pair.vision && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#2c1ee8] uppercase tracking-wider">
                <Target className="w-4 h-4" />
                <span>Visi Utama</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-700 leading-relaxed font-normal">
                {pair.vision}
              </div>
            </div>
          )}

          {/* Misi Section */}
          {pair.mission && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#2c1ee8] uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Misi Kerja</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-700 leading-relaxed font-normal whitespace-pre-line">
                {pair.mission}
              </div>
            </div>
          )}

          {/* Program Kerja Section */}
          {pair.programs && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#2c1ee8] uppercase tracking-wider">
                <ListCheck className="w-4 h-4" />
                <span>Program Kerja Unggulan</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-700 leading-relaxed font-normal whitespace-pre-line">
                {pair.programs}
              </div>
            </div>
          )}

          {/* Vice Vision & Mission if provided */}
          {pair.viceVision && (
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visi Tambahan Wakil</span>
              <p className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed">{pair.viceVision}</p>
            </div>
          )}

        </div>

        {/* Modal Footer / Action Button */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-gray-200 font-bold text-xs sm:text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>

          {canVote && (
            <button
              onClick={() => {
                onClose();
                onVote?.(pair.id);
              }}
              className="flex-1 max-w-xs bg-[#2c1ee8] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Medal className="w-4 h-4" />
              <span>Pilih Pasangan Ini</span>
            </button>
          )}

          {hasVoted && (
            <div className="flex-1 max-w-xs flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Anda Sudah Memilih</span>
            </div>
          )}

          {!canVote && !hasVoted && (
            <div className="flex-1 max-w-xs py-3 px-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-bold text-center">
              {!isMinCandidatesMet
                ? "Voting Terkunci (Minimal 2 Paslon Disetujui)"
                : electionTimeState === "BEFORE"
                ? "Pemilihan Belum Dibuka"
                : "Pemilihan Telah Ditutup"}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
