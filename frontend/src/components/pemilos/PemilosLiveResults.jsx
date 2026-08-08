"use client";

import React from "react";
import { Crown, TrendingUp, Users, Activity, Trophy, BarChart3 } from "lucide-react";

const PALETTE = [
  "from-[#2c1ee8] to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-violet-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
];

const BAR_COLORS = [
  "bg-gradient-to-r from-[#2c1ee8] to-blue-500",
  "bg-gradient-to-r from-emerald-500 to-teal-500",
  "bg-gradient-to-r from-purple-500 to-violet-500",
  "bg-gradient-to-r from-orange-500 to-amber-500",
  "bg-gradient-to-r from-pink-500 to-rose-500",
];

export default function PemilosLiveResults({ result }) {
  if (!result) return null;

  const { rankings = [], totalVotesCast, totalEligibleVoters, participationRate, winnerPair, isResultsVisible, electionTitle, status } = result;

  const statusLabel = {
    Draft: "Belum Dibuka",
    Open: "Sedang Berlangsung",
    Closed: "Telah Ditutup",
    PublishedResult: "Hasil Resmi",
  }[status] ?? status;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Suara Masuk"
          value={totalVotesCast?.toLocaleString("id-ID")}
          sub={`dari ${totalEligibleVoters?.toLocaleString("id-ID")} pemilih sah`}
          icon={<Users className="w-5 h-5" />}
          color="bg-blue-50 text-[#2c1ee8] border-blue-100"
        />
        <StatCard
          label="Tingkat Partisipasi"
          value={`${participationRate}%`}
          sub="dari total pemilih sah"
          icon={<Activity className="w-5 h-5" />}
          color="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <StatCard
          label="Status Pemilihan"
          value={statusLabel}
          sub={electionTitle}
          icon={<BarChart3 className="w-5 h-5" />}
          color="bg-purple-50 text-purple-600 border-purple-100"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Winner Highlight */}
      {winnerPair && (
        <div className="relative rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center shadow-lg flex-shrink-0">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Unggul Sementara</span>
              </div>
              <h3 className="font-black text-gray-900 text-lg leading-tight">
                {winnerPair.chairmanName}
                {winnerPair.viceName && (
                  <span className="text-gray-400 font-normal text-base"> & {winnerPair.viceName}</span>
                )}
              </h3>
              <p className="text-sm text-amber-700 font-bold mt-1">
                {winnerPair.voteCount} suara · {winnerPair.votePercentage}%
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-4xl font-black text-[#2c1ee8]">#{winnerPair.candidateNumber}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results visible / hidden */}
      {!isResultsVisible ? (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-sm">Hasil akan ditampilkan setelah pemilihan selesai</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-sm">Belum ada pasangan yang disetujui</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Perolehan Suara Real-Time
          </h3>
          {rankings.map((pair, i) => (
            <div
              key={pair.id}
              className={`p-4 rounded-2xl border transition-all ${
                i === 0 ? "border-amber-200 bg-amber-50/50" : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${PALETTE[i % PALETTE.length]} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    Pasangan {pair.candidateNumber}: {pair.chairmanName}
                    {pair.viceName && <span className="text-gray-400 font-normal"> & {pair.viceName}</span>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-sm text-gray-900">{pair.voteCount}</p>
                  <p className="text-xs text-gray-400">{pair.votePercentage}%</p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${Math.max(pair.votePercentage, 1)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, className = "" }) {
  return (
    <div className={`p-4 rounded-2xl border ${color} ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-xl font-black">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}
