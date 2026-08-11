"use client";

import React, { useState, useMemo } from "react";
import { Crown, TrendingUp, Users, Activity, Trophy, BarChart3, CheckCircle2, ShieldCheck, FileText, Eye } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import CandidatePairDetailModal from "@/components/pemilos/CandidatePairDetailModal";

export default function PemilosLiveResults({
  liveData,
  result,
  electionId,
  pairs = [],
  isElectionOpen = false,
  electionTimeState,
  onRefresh,
}) {
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const data = liveData || result || {};

  // Extract rankings & winner pair cleanly
  const rawRankings =
    data?.rankings ||
    data?.Rankings ||
    (Array.isArray(pairs) && pairs.length > 0
      ? [...pairs].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
      : []);

  const totalVotesCast =
    data?.totalVotesCast ??
    data?.TotalVotesCast ??
    pairs.reduce((acc, p) => acc + (p.voteCount || 0), 0);

  const totalEligibleVoters = data?.totalEligibleVoters ?? data?.TotalEligibleVoters ?? 1250;
  const participationRate =
    data?.participationRate ??
    data?.ParticipationRate ??
    (totalEligibleVoters > 0 ? Math.round((totalVotesCast / totalEligibleVoters) * 100) : 0);

  const winnerPair = data?.winnerPair || data?.WinnerPair || (rawRankings.length > 0 ? rawRankings[0] : null);

  const fullWinnerPair = useMemo(() => {
    if (!winnerPair) return null;
    const found = pairs.find(
      (p) =>
        String(p.id) === String(winnerPair.id || winnerPair.candidatePairId) ||
        String(p.candidatePairId) === String(winnerPair.id || winnerPair.candidatePairId)
    );
    return found || winnerPair;
  }, [winnerPair, pairs]);

  const isOngoing = isElectionOpen || data?.status === "Open" || data?.status === 1;

  const StatCard = ({ label, value, sub, icon, className }) => (
    <div className={`bg-white border border-slate-200 p-4 rounded-lg shadow-xs ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-black text-slate-900">{value}</div>
      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Suara Masuk"
          value={totalVotesCast?.toLocaleString("id-ID") || "0"}
          sub={`dari ${totalEligibleVoters?.toLocaleString("id-ID")} pemilih sah`}
          icon={<Users className="w-4 h-4 text-slate-700" />}
        />
        <StatCard
          label="Tingkat Partisipasi"
          value={`${participationRate}%`}
          sub="Siswa & Guru berpartisipasi"
          icon={<Activity className="w-4 h-4 text-slate-700" />}
        />
        <StatCard

      {/* ═════════════════════════════════════════════════════════════════════
          KONDISI A: PEMILOS SEDANG BERLANGSUNG (LIVE SUARA REAL-TIME)
      ═════════════════════════════════════════════════════════════════════ */}
      {isOngoing ? (
        <div className="space-y-6">
          {/* Winner Highlight / Unggul Sementara */}
          {winnerPair && (
            <div className="rounded-lg bg-white border border-slate-200 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-md bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        Unggul Sementara
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base truncate leading-tight">
                      {winnerPair.chairmanName}
                      {winnerPair.viceName && (
                        <span className="text-slate-500 font-normal text-sm"> & {winnerPair.viceName}</span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {winnerPair.voteCount ?? 0} suara ({winnerPair.votePercentage ?? 0}%)
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 border border-slate-200 px-3 py-1 rounded-md bg-slate-50">
                    Paslon #{winnerPair.candidateNumber || 1}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Live Progress Bar Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <span>Perolehan Suara Live Real-Time</span>
            </h3>

            {rawRankings.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-slate-200 p-6 space-y-1">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="font-bold text-xs text-slate-700">Belum Ada Suara Masuk</p>
                <p className="text-[11px] text-slate-400">Suara akan tampil di sini secara otomatis saat siswa memilih.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rawRankings.map((pair, i) => (
                  <div key={pair.id || i} className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          #{pair.candidateNumber || i + 1}
                        </span>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {pair.chairmanName}
                          {pair.viceName && <span className="text-slate-500 font-normal"> & {pair.viceName}</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-xs text-slate-900">{pair.voteCount ?? 0} Suara</p>
                        <p className="text-[11px] text-slate-500 font-medium">{pair.votePercentage ?? 0}%</p>
                      </div>
                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pair.votePercentage || 0, 1)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voter Audit Trail Table */}
          {Array.isArray(data?.recentVoters) && data.recentVoters.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <span>Pemilih Terverifikasi ({data.recentVoters.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {data.recentVoters.map((voter, idx) => (
                      <tr key={voter.voterUserId || idx} className="hover:bg-slate-50/60 transition">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200 shrink-0">
                            {voter.studentName?.charAt(0) || "S"}
                          </div>
                          <span>{voter.studentName}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{voter.className || "Siswa"}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(voter.votedAt || Date.now()).toLocaleString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                            ✓ Suara Masuk
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════════
            KONDISI B: PEMILOS BELUM DIMULAI / SUDAH SELESAI (PEMENANG PEMILOS UI)
        ═════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Winner Hero Card (Tampilan Pemenang Pemilos) */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pemenang Resmi Pemilos OSIS</h3>
                  <p className="text-xs text-slate-500 font-medium">Hasil pengesahan akhir perolehan suara pemilihan</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Disahkan</span>
              </span>
            </div>

            {winnerPair ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Winner Profile Photo */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="w-20 h-20 rounded-md bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-slate-700 font-black text-2xl">
                    {winnerPair.photoUrl ? (
                      <img
                        src={resolveImageUrl(winnerPair.photoUrl)}
                        alt={winnerPair.chairmanName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      winnerPair.chairmanName?.[0] || "U"
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white mb-1">
                      Ketua & Wakil Terpilih
                    </span>
                    <h4 className="font-bold text-slate-900 text-base sm:text-lg truncate leading-tight">
                      {winnerPair.chairmanName}
                    </h4>
                    {winnerPair.viceName && (
                      <p className="text-xs font-bold text-slate-600 truncate mt-0.5">
                        Wakil: {winnerPair.viceName}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 font-medium truncate mt-1">
                      {winnerPair.chairmanClass || "SMKN 2 Surakarta"}
                    </p>
                  </div>
                </div>

                {/* Vote Stats Result Box */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-medium text-slate-600">Perolehan Suara Terpilih</span>
                    <span className="text-sm font-black text-slate-900">
                      {winnerPair.voteCount ?? totalVotesCast} Suara
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-medium text-slate-600">Persentase Kemenangan</span>
                    <span className="text-sm font-black text-slate-900">
                      {winnerPair.votePercentage ?? (totalVotesCast > 0 ? 100 : 0)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Total Pemilih Sah Berpartisipasi</span>
                    <span className="text-xs font-bold text-slate-800">
                      {totalVotesCast} Pemilih ({participationRate}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Visi, Misi & Program Kerja Pemenang Terpilih */}
              {(fullWinnerPair?.vision || fullWinnerPair?.mission || fullWinnerPair?.programs) && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#2c1ee8]" />
                      <span>Visi, Misi & Program Kerja Pasangan Terpilih</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowWinnerModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Lihat Detail Lengkap</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {fullWinnerPair.vision && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <span className="font-extrabold text-[#2c1ee8] uppercase tracking-wider text-[10px] block">
                          Visi Utama
                        </span>
                        {/<[a-z][\s\S]*>/i.test(fullWinnerPair.vision) ? (
                          <div
                            className="prose prose-xs max-w-none text-slate-700 font-normal line-clamp-4"
                            dangerouslySetInnerHTML={{ __html: fullWinnerPair.vision }}
                          />
                        ) : (
                          <p className="text-slate-700 whitespace-pre-line line-clamp-4">{fullWinnerPair.vision}</p>
                        )}
                      </div>
                    )}

                    {fullWinnerPair.mission && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <span className="font-extrabold text-[#2c1ee8] uppercase tracking-wider text-[10px] block">
                          Misi Kerja
                        </span>
                        {/<[a-z][\s\S]*>/i.test(fullWinnerPair.mission) ? (
                          <div
                            className="prose prose-xs max-w-none text-slate-700 font-normal line-clamp-4"
                            dangerouslySetInnerHTML={{ __html: fullWinnerPair.mission }}
                          />
                        ) : (
                          <p className="text-slate-700 whitespace-pre-line line-clamp-4">{fullWinnerPair.mission}</p>
                        )}
                      </div>
                    )}

                    {fullWinnerPair.programs && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <span className="font-extrabold text-[#2c1ee8] uppercase tracking-wider text-[10px] block">
                          Program Kerja Prioritas
                        </span>
                        {/<[a-z][\s\S]*>/i.test(fullWinnerPair.programs) ? (
                          <div
                            className="prose prose-xs max-w-none text-slate-700 font-normal line-clamp-4"
                            dangerouslySetInnerHTML={{ __html: fullWinnerPair.programs }}
                          />
                        ) : (
                          <p className="text-slate-700 whitespace-pre-line line-clamp-4">{fullWinnerPair.programs}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div> : (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="font-bold text-xs text-slate-700">Hasil Pemilos Periode Aktif</p>
                <p className="text-[11px] text-slate-400">Data hasil pemenang akan otomatis terupdate setelah voting berjalan.</p>
              </div>
            )}
          </div>

          {/* Rekapitulasi Perolehan Suara Semua Kandidat */}
          {rawRankings.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                <span>Rekapitulasi Suara Pemilos</span>
              </h3>

              <div className="space-y-2.5">
                {rawRankings.map((pair, idx) => (
                  <div key={pair.id || idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          #{pair.candidateNumber || idx + 1}
                        </span>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {pair.chairmanName}
                          {pair.viceName && <span className="text-slate-500 font-normal"> & {pair.viceName}</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-xs text-slate-900">{pair.voteCount ?? 0} Suara</p>
                        <p className="text-[11px] text-slate-500 font-medium">{pair.votePercentage ?? 0}%</p>
                      </div>
                    </div>

                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pair.votePercentage || 0, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, className = "" }) {
  return (
    <div className={`p-4 rounded-lg bg-white border border-slate-200 shadow-xs ${className}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{sub}</p>}
    </div>
  );
}
