"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import CandidatePairCard from "@/components/pemilos/CandidatePairCard";
import CandidatePairDetailModal from "@/components/pemilos/CandidatePairDetailModal";
import VoteModal from "@/components/pemilos/VoteModal";
import PemilosLiveResults from "@/components/pemilos/PemilosLiveResults";
import candidatePairService from "@/services/candidatePairService";
import electionService from "@/services/electionService";
import useAuth from "@/hooks/useAuth";
import LoginRequiredFallback from "@/components/common/LoginRequiredFallback";
import {
  Vote, BarChart3, Sparkles, RefreshCw,
  AlertCircle, Loader2, Users, Clock, Calendar, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

export default function PemilosPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.OSIS]}>
      <PemilosContent />
    </AuthGuard>
  );
}

function PemilosContent() {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [liveResults, setLiveResults] = useState(null);
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingPairs, setLoadingPairs] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [votingPair, setVotingPair] = useState(null);
  const [detailPair, setDetailPair] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [activeTab, setActiveTab] = useState("ballot"); // ballot | results
  const [timeRemaining, setTimeRemaining] = useState("");
  const [now, setNow] = useState(new Date());

  // Ticker for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch elections list
  const fetchElections = useCallback(async () => {
    setLoadingElections(true);
    setIsUnauthorized(false);
    try {
      let res;
      if (typeof electionService.getElections === "function") {
        res = await electionService.getElections();
      } else {
        res = await candidatePairService.getElections();
      }
      const rawData = res?.data ?? res;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

      // Filter out deleted elections (DeletedAt != null)
      const validElections = list.filter((e) => !e.deletedAt && !e.DeletedAt);

      setElections(validElections);
      if (validElections.length > 0 && !selectedElectionId) {
        // Default to first open/ongoing election or latest
        const ongoing = validElections.find(
          (e) => (e.statusText === "Open" || e.status === 1) && new Date(e.startDate) <= new Date() && new Date(e.endDate) >= new Date()
        );
        setSelectedElectionId(ongoing?.id || validElections[0].id);
      }
    } catch (err) {
      const checkUnauth =
        err?.statusCode === 401 ||
        err?.response?.status === 401 ||
        err?.message?.includes("Sesi") ||
        err?.message?.includes("Unauthorized") ||
        err?.message?.includes("login");
      if (checkUnauth) setIsUnauthorized(true);
      console.error("Failed to load elections list:", err);
    } finally {
      setLoadingElections(false);
    }
  }, [selectedElectionId]);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) fetchElections();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchElections]);

  const selectedElection = elections.find((e) => String(e.id) === String(selectedElectionId)) || elections[0] || null;

  // Compute time-based state (BEFORE, ONGOING, ENDED)
  const getElectionTimeState = useCallback((election) => {
    if (!election?.startDate || !election?.endDate) return "UNKNOWN";
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);
    const currentTime = new Date();

    if (currentTime < start) return "BEFORE";
    if (currentTime >= start && currentTime <= end) return "ONGOING";
    return "ENDED";
  }, []);

  const electionTimeState = getElectionTimeState(selectedElection);

  // Authoritative status check: Backend status MUST be Open/1 AND timeState MUST be ONGOING
  const isBackendOpen =
    selectedElection?.statusText === "Open" ||
    selectedElection?.status === 1 ||
    liveResults?.status === "Open" ||
    liveResults?.status === 1;

  const isElectionOpen = isBackendOpen && electionTimeState === "ONGOING";

  // Countdown timer logic
  useEffect(() => {
    if (!selectedElection?.startDate || !selectedElection?.endDate) {
      queueMicrotask(() => setTimeRemaining(""));
      return;
    }

    const start = new Date(selectedElection.startDate);
    const end = new Date(selectedElection.endDate);
    const currentTime = new Date();

    let targetDate;
    if (currentTime < start) {
      targetDate = start;
    } else if (currentTime <= end) {
      targetDate = end;
    } else {
      queueMicrotask(() => setTimeRemaining("Pemilihan telah berakhir"));
      return;
    }

    const diffMs = targetDate - currentTime;
    if (diffMs <= 0) {
      queueMicrotask(() => {
        setTimeRemaining("Memproses perubahan status...");
        fetchElections();
      });
      return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const timeStr = `${hours}j ${minutes}m ${seconds}s`;
    const label = currentTime < start ? `Dimulai dalam ${timeStr}` : `Berakhir dalam ${timeStr}`;
    queueMicrotask(() => setTimeRemaining(label));
  }, [now, selectedElection, fetchElections]);

  // Load pairs & live results for selected election
  const loadPairsAndResults = useCallback(async () => {
    if (!selectedElectionId) return;
    setLoadingPairs(true);
    try {
      const [pairsRes, resultsRes] = await Promise.all([
        candidatePairService.getPairs(selectedElectionId),
        candidatePairService.getLiveResults(selectedElectionId),
      ]);

      const rawPairs = pairsRes?.data ?? pairsRes;
      const pairsList = Array.isArray(rawPairs)
        ? rawPairs
        : Array.isArray(rawPairs?.items)
        ? rawPairs.items
        : Array.isArray(rawPairs?.data)
        ? rawPairs.data
        : [];
      setPairs(pairsList);

      const rawResults = resultsRes?.data ?? resultsRes;
      const resultsObj = rawResults?.data ?? rawResults ?? null;
      setLiveResults(resultsObj);

      // Check HasVoted from backend live results or selected election
      const userHasVoted = !!(
        resultsObj?.userHasVoted ||
        resultsObj?.UserHasVoted ||
        resultsObj?.hasVoted ||
        resultsObj?.HasVoted ||
        selectedElection?.hasVoted ||
        selectedElection?.HasVoted
      );
      setHasVoted(userHasVoted);
    } catch (err) {
      const checkUnauth =
        err?.statusCode === 401 ||
        err?.response?.status === 401 ||
        err?.message?.includes("Sesi") ||
        err?.message?.includes("Unauthorized") ||
        err?.message?.includes("login");
      if (checkUnauth) setIsUnauthorized(true);
      console.error("Failed to load pairs & live results:", err);
    } finally {
      setLoadingPairs(false);
    }
  }, [selectedElectionId, selectedElection]);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) loadPairsAndResults();
    });
    return () => {
      isMounted = false;
    };
  }, [loadPairsAndResults]);

  const handleVote = (pairId) => {
    const pair = pairs.find((p) => String(p.id) === String(pairId));
    if (pair) setVotingPair(pair);
  };

  const handleConfirmVote = async () => {
    if (!votingPair || !selectedElectionId) return;
    setIsVoting(true);
    try {
      await candidatePairService.castVote(selectedElectionId, votingPair.id);
      toast.success("Suara Anda berhasil diberikan!");
      setHasVoted(true);
      setVotingPair(null);
      await loadPairsAndResults();
    } catch (err) {
      const status = err?.statusCode || err?.response?.status;
      const msg = err?.message || err?.response?.data?.message || "Gagal memberikan suara.";
      const lowerMsg = String(msg).toLowerCase();
      
      if (
        status === 400 ||
        status === 409 ||
        lowerMsg.includes("sudah") ||
        lowerMsg.includes("pernah") ||
        lowerMsg.includes("already voted") ||
        lowerMsg.includes("voted")
      ) {
        toast.error("Anda telah menggunakan hak suara Anda pada pemilihan ini.");
        setHasVoted(true);
      } else if (status === 403) {
        toast.error("Anda tidak memiliki hak akses untuk voting pada pemilihan ini.");
      } else if (status === 404) {
        toast.error("Sesi pemilihan atau pasangan calon tidak ditemukan.");
      } else {
        toast.error(msg);
      }
      setVotingPair(null);
    } finally {
      setIsVoting(false);
    }
  };

  // Approved candidate pairs for ballot (status Approved = 5 or legacy WaitingAdmin = 4)
  const approvedPairs = pairs.filter(
    (p) => p.statusText === "Approved" || p.status === 5 || p.statusText === "WaitingAdmin" || p.status === 4
  );

  const isMinCandidatesMet = approvedPairs.length >= 2;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20">
        {/* Page Header */}
        <div className="mb-6 border-b border-slate-200 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                E-VOTING PEMILIHAN KETUA & WAKIL KETUA OSIS
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Pemilihan Ketua OSIS (PEMILOS)
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {!!(selectedElection?.cabinetStructureJson || selectedElection?.CabinetStructureJson || liveResults?.cabinetStructureJson || liveResults?.CabinetStructureJson) ? (
                <button
                  disabled
                  title="Pendaftaran ditutup karena voting Pemilos telah resmi dimulai oleh Guru Pembina"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-200 text-slate-500 text-xs font-bold cursor-not-allowed border border-slate-300"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>+ Daftar Kandidat (Ditutup)</span>
                </button>
              ) : (
                <Link
                  href="/pemilos/register"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#2c1ee8] text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  <span>+ Daftar Kandidat</span>
                </Link>
              )}
              <button
                onClick={loadPairsAndResults}
                disabled={loadingPairs}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPairs ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Multiple Elections Selector Pills (if more than 1 election exists) */}
          {elections.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Sesi:</span>
              {elections.map((el) => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElectionId(el.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                    String(el.id) === String(selectedElectionId)
                      ? "bg-[#2c1ee8] text-white border-[#2c1ee8]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {el.title}
                </button>
              ))}
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex items-center gap-2 mt-4 border-b border-slate-200 pb-0">
            {[
              { id: "ballot", label: "Bilik Suara", icon: Vote },
              { id: "results", label: "Hasil Suara Live", icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-md text-xs font-bold transition-all border-b-2 -mb-px cursor-pointer ${
                  activeTab === id
                    ? "border-[#2c1ee8] text-[#2c1ee8] bg-white font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {isUnauthorized ? (
          <LoginRequiredFallback featureName="Pemilos (E-Voting Ketua OSIS)" />
        ) : loadingElections ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#2c1ee8]" />
            <p className="text-sm text-gray-500 font-medium">Memuat sesi pemilihan OSIS...</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <Vote className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700">Belum Ada Sesi Pemilihan</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              Saat ini belum ada jadwal pemilihan ketua OSIS yang terdaftar.
            </p>
          </div>
        ) : (
          <>
            {/* Voted Banner */}
            {hasVoted && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Suara Anda telah tercatat!</h4>
                  <p className="text-xs text-emerald-700 font-medium">Terima kasih telah berpartisipasi dalam pemilihan kepengurusan OSIS tahun ini.</p>
                </div>
              </div>
            )}

            {/* Ballot Tab */}
            {activeTab === "ballot" && (
              <>
                {/* Election Status Banner */}
                {selectedElection && (
                  <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                              electionTimeState === "ONGOING" && isBackendOpen
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : electionTimeState === "BEFORE"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                electionTimeState === "ONGOING" && isBackendOpen
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-gray-400"
                              }`}
                            />
                            {electionTimeState === "ONGOING" && isBackendOpen
                              ? "Pemilihan Sedang Berlangsung"
                              : electionTimeState === "BEFORE"
                              ? "Pemilihan Belum Dimulai"
                              : "Pemilihan Telah Berakhir"}
                          </span>

                          <span className="text-xs font-medium text-gray-400">
                            (Status: {selectedElection.statusText || liveResults?.status || "Aktif"})
                          </span>
                        </div>

                        <h2 className="text-lg font-black text-gray-900 mt-2">
                          {selectedElection.title}
                        </h2>
                        {selectedElection.description && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {selectedElection.description}
                          </p>
                        )}
                      </div>

                      {/* Live Countdown & Period Info */}
                      <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 flex flex-col items-start sm:items-end flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1">
                          <Clock className="w-4 h-4 text-[#2c1ee8]" />
                          <span>{timeRemaining || "Jadwal Pemilihan"}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {formatDate(selectedElection.startDate)} – {formatDate(selectedElection.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimum Candidates Warning Banner */}
                {!isMinCandidatesMet && electionTimeState === "ONGOING" && (
                  <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 shadow-xs">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-amber-900 uppercase tracking-wider">Pemungutan Suara Belum Dapat Dilaksanakan</h4>
                      <p className="font-medium text-amber-800 mt-0.5">
                        Pemilos membutuhkan minimal 2 pasangan kandidat yang terdaftar dan disetujui untuk dapat melaksanakan pemungutan suara. Saat ini baru terdapat {approvedPairs.length} pasangan calon resmi.
                      </p>
                    </div>
                  </div>
                )}

                {/* Candidate Pairs Grid (Side-by-Side Comparison Layout) */}
                {loadingPairs ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2c1ee8]" />
                    <p className="text-sm text-gray-500 font-medium">Memuat daftar pasangan calon...</p>
                  </div>
                ) : approvedPairs.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
                    <Users className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <h3 className="text-base font-bold text-gray-500">Belum Ada Pasangan Resmi</h3>
                    <p className="text-sm text-gray-400 mt-1">Pasangan calon yang telah disetujui akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {approvedPairs.map((pair, i) => (
                      <CandidatePairCard
                        key={pair.id}
                        pair={pair}
                        rank={i + 1}
                        isWinner={liveResults?.winnerPair?.id === pair.id}
                        showVoteCount={liveResults?.isResultsVisible}
                        hasVoted={hasVoted}
                        isElectionOpen={isElectionOpen}
                        electionTimeState={electionTimeState}
                        isMinCandidatesMet={isMinCandidatesMet}
                        onVote={handleVote}
                        onViewDetail={(p) => setDetailPair(p)}
                      />
                    ))}
                  </div>
                )}

                {/* Section Struktur Kabinet OSIS Pendukung */}
                {(() => {
                  const raw = selectedElection?.cabinetStructureJson || liveResults?.cabinetStructureJson;
                  if (!raw) return null;
                  let cab = null;
                  try {
                    cab = typeof raw === "string" ? JSON.parse(raw) : raw;
                  } catch {}
                  if (!cab) return null;

                  return (
                    <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <span className="text-xs font-mono font-bold text-[#2c1ee8] uppercase tracking-widest block mb-1">
                          KABINET & JABATAN PENGURUS OSIS
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                          Struktur Pengurus OSIS Pendukung
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Daftar siswa yang mengemban amanah posisi pengurus OSIS selain Ketua dan Wakil Ketua.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cab.secretary1 && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Sekretaris 1</span>
                            <p className="font-bold text-slate-900 text-sm">{cab.secretary1}</p>
                          </div>
                        )}

                        {cab.secretary2 && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Sekretaris 2</span>
                            <p className="font-bold text-slate-900 text-sm">{cab.secretary2}</p>
                          </div>
                        )}

                        {cab.treasurer1 && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Bendahara 1</span>
                            <p className="font-bold text-slate-900 text-sm">{cab.treasurer1}</p>
                          </div>
                        )}

                        {cab.treasurer2 && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Bendahara 2</span>
                            <p className="font-bold text-slate-900 text-sm">{cab.treasurer2}</p>
                          </div>
                        )}

                        {Array.isArray(cab.customDivisions) &&
                          cab.customDivisions.map((div, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                              <span className="text-[10px] font-bold text-[#2c1ee8] uppercase block">{div.divisionName || "Divisi"}</span>
                              <p className="font-bold text-slate-900 text-sm">{div.studentName || "-"}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Pending Verification Pairs */}
                {pairs.filter((p) => p.statusText !== "Approved" && p.status !== 5).length > 0 && (
                  <div className="mt-10">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-black text-gray-600 uppercase tracking-wide">
                        Dalam Proses Verifikasi
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pairs
                        .filter((p) => p.statusText !== "Approved" && p.status !== 5)
                        .map((pair) => (
                          <CandidatePairCard
                            key={pair.id}
                            pair={pair}
                            showVoteCount={false}
                            onViewDetail={(p) => setDetailPair(p)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Results Tab */}
            {activeTab === "results" && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                {loadingPairs ? (
                  <div className="flex items-center justify-center py-16 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2c1ee8]" />
                    <p className="text-sm text-gray-500">Memuat hasil suara...</p>
                  </div>
                ) : (
                  <PemilosLiveResults result={liveResults} />
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Candidate Pair Detail Modal */}
      {detailPair && (
        <CandidatePairDetailModal
          pair={detailPair}
          onClose={() => setDetailPair(null)}
          onVote={handleVote}
          hasVoted={hasVoted}
          isElectionOpen={isElectionOpen}
          electionTimeState={electionTimeState}
          isMinCandidatesMet={isMinCandidatesMet}
        />
      )}

      {/* Vote Confirmation Modal */}
      {votingPair && (
        <VoteModal
          pair={votingPair}
          onClose={() => setVotingPair(null)}
          onConfirm={handleConfirmVote}
          isLoading={isVoting}
        />
      )}
    </div>
  );
}
