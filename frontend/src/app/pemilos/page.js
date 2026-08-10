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
  Vote, BarChart3, RefreshCw,
  AlertCircle, Loader2, Users, Clock, Calendar, CheckCircle2, Trophy, GitBranch
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

  // Approved candidate pairs for ballot
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20">
        {/* Page Header (Clean Enterprise Aesthetic) */}
        <div className="mb-6 border-b border-slate-200 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                E-VOTING KETUA & WAKIL KETUA OSIS
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Pemilihan Ketua OSIS (PEMILOS)
              </h1>
            </div>

            {/* Header Action Buttons */}
            {(() => {
              const electionStatus = selectedElection?.status ?? liveResults?.status;
              const hasCabStructure = !!(selectedElection?.cabinetStructureJson || selectedElection?.CabinetStructureJson || liveResults?.cabinetStructureJson || liveResults?.CabinetStructureJson);
              const isClosed = electionStatus === 2 || electionStatus === "Closed" || selectedElection?.statusText === "Closed";
              const isOngoing = !isClosed && (electionStatus === 1 || electionStatus === "Open" || selectedElection?.statusText === "Open") && hasCabStructure;
              const pemilosState = isClosed ? "CLOSED" : isOngoing ? "ONGOING" : "SETUP";

              return (
                <div className="flex items-center gap-2">
                  {pemilosState === "SETUP" ? (
                    <Link
                      href="/pemilos/register"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>+ Daftar Kandidat</span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      title={pemilosState === "ONGOING" ? "Pendaftaran ditutup karena voting sedang berlangsung" : "Pemilos telah berakhir"}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed border border-slate-200"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>+ Daftar Kandidat (Ditutup)</span>
                    </button>
                  )}

                  <button
                    onClick={loadPairsAndResults}
                    disabled={loadingPairs}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingPairs ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sesi Election Selector Pills */}
        {elections.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Sesi:</span>
            {elections.map((el) => (
              <button
                key={el.id}
                onClick={() => setSelectedElectionId(el.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                  String(el.id) === String(selectedElectionId)
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {el.title}
              </button>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-0">
          {[
            { id: "ballot", label: "Bilik Suara", icon: Vote },
            { id: "results", label: "Hasil Suara Live", icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-md text-xs font-bold transition-all border-b-2 -mb-px cursor-pointer ${
                activeTab === id
                  ? "border-slate-900 text-slate-900 bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {isUnauthorized ? (
          <LoginRequiredFallback featureName="Pemilos (E-Voting Ketua OSIS)" />
        ) : loadingElections ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
            <p className="text-xs text-slate-500 font-medium">Memuat sesi pemilihan OSIS...</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-slate-200 p-8 shadow-xs space-y-3">
            <Vote className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Sesi Pemilihan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Saat ini belum ada jadwal pemilihan ketua OSIS yang terdaftar.
            </p>
          </div>
        ) : (
          <>
            {/* Voted Banner */}
            {hasVoted && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Suara Anda Telah Tercatat</h4>
                  <p className="text-xs text-emerald-700 font-medium">Terima kasih telah berpartisipasi dalam e-voting pemilihan Ketua OSIS tahun ini.</p>
                </div>
              </div>
            )}

            {/* Ballot Tab */}
            {activeTab === "ballot" && (
              <>
                {/* Election Status Banner */}
                {selectedElection && (
                  <div className="mb-6 p-5 sm:p-6 rounded-lg bg-white border border-slate-200 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const eStat = selectedElection?.status ?? liveResults?.status;
                            const hasCab = !!(selectedElection?.cabinetStructureJson || selectedElection?.CabinetStructureJson || liveResults?.cabinetStructureJson || liveResults?.CabinetStructureJson);
                            const isClosedState = eStat === 2 || eStat === "Closed" || selectedElection?.statusText === "Closed";
                            const isOngoingState = !isClosedState && (eStat === 1 || eStat === "Open" || selectedElection?.statusText === "Open") && hasCab;

                            const badgeText = isClosedState
                              ? "Pemilihan Telah Berakhir"
                              : isOngoingState
                              ? "Pemilihan Sedang Berlangsung"
                              : "Pendaftaran Kandidat";

                            const badgeStyle = isClosedState
                              ? "bg-slate-100 text-slate-700 border-slate-200 font-bold"
                              : isOngoingState
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                              : "bg-amber-50 text-amber-700 border-amber-200 font-bold";

                            return (
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md border ${badgeStyle}`}>
                                {badgeText}
                              </span>
                            );
                          })()}
                        </div>

                        <h2 className="text-lg font-bold text-slate-900 mt-1">
                          {selectedElection.title}
                        </h2>
                        {selectedElection.description && (
                          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">
                            {selectedElection.description}
                          </p>
                        )}
                      </div>

                      {/* Live Countdown & Period Info */}
                      <div className="bg-slate-50 rounded-md p-3 border border-slate-200 flex flex-col items-start sm:items-end flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                          <Clock className="w-4 h-4 text-slate-700" />
                          <span>{timeRemaining || "Jadwal Pemilihan"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
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

                {/* Strict 3-State Ballot Section */}
                {(() => {
                  const electionStatus = selectedElection?.status ?? liveResults?.status;
                  const hasCabStructure = !!(selectedElection?.cabinetStructureJson || selectedElection?.CabinetStructureJson || liveResults?.cabinetStructureJson || liveResults?.CabinetStructureJson);
                  const isClosed = electionStatus === 2 || electionStatus === "Closed" || selectedElection?.statusText === "Closed";
                  const isOngoing = !isClosed && (electionStatus === 1 || electionStatus === "Open" || selectedElection?.statusText === "Open") && hasCabStructure;
                  const pemilosState = isClosed ? "CLOSED" : isOngoing ? "ONGOING" : "SETUP";

                  if (pemilosState === "CLOSED") {
                    return (
                      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-10 shadow-xs text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
                          <Trophy className="w-6 h-6 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Pemilos Berakhir & Pemenang Ditetapkan!
                          </h3>
                          <p className="text-xs text-slate-500">Hasil suara resmi telah disahkan dan kepengurusan OSIS baru dapat diakses.</p>
                        </div>
                        <div className="pt-2">
                          <Link
                            href="/osis/structure"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                          >
                            <GitBranch className="w-4 h-4" />
                            <span>Lihat Struktur OSIS Baru</span>
                          </Link>
                        </div>
                      </div>
                    );
                  }

                  if (pemilosState === "SETUP") {
                    return (
                      <div className="space-y-6">
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 shadow-xs">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <h4 className="font-bold text-amber-900 uppercase tracking-wider">Bilik Suara Belum Dibuka</h4>
                            <p className="font-medium text-amber-800 mt-0.5">
                              Pendaftaran kandidat sedang dibuka / menunggu penetapan jadwal dan pembukaan e-voting oleh Guru Pembina OSIS. Pasangan calon terdaftar yang disetujui akan tampil di bawah ini.
                            </p>
                          </div>
                        </div>

                        {approvedPairs.length === 0 ? (
                          <div className="text-center py-16 bg-white rounded-lg border border-slate-200 p-8 space-y-2">
                            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                            <h3 className="text-base font-bold text-slate-700">Belum Ada Pasangan Resmi</h3>
                            <p className="text-xs text-slate-500">Siswa dapat mendaftar paslon melalui tombol &quot;+ Daftar Kandidat&quot; di kanan atas.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                            {approvedPairs.map((pair, i) => (
                              <CandidatePairCard
                                key={pair.id}
                                pair={pair}
                                rank={i + 1}
                                isWinner={false}
                                showVoteCount={false}
                                hasVoted={hasVoted}
                                isElectionOpen={false}
                                electionTimeState="BEFORE"
                                isMinCandidatesMet={isMinCandidatesMet}
                                onVote={() => toast.error("Bilik suara belum dibuka oleh Guru Pembina OSIS.")}
                                onViewDetail={(p) => setDetailPair(p)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // State 2: ONGOING (Voting aktif)
                  return (
                    <div className="space-y-6">
                      {!isMinCandidatesMet && (
                        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 shadow-xs">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <h4 className="font-bold text-amber-900 uppercase tracking-wider">Pemungutan Suara Belum Dapat Dilaksanakan</h4>
                            <p className="font-medium text-amber-800 mt-0.5">
                              Pemilos membutuhkan minimal 2 pasangan kandidat yang terdaftar dan disetujui. Saat ini baru terdapat {approvedPairs.length} pasangan calon resmi.
                            </p>
                          </div>
                        </div>
                      )}

                      {loadingPairs ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
                          <p className="text-xs text-slate-500 font-medium">Memuat daftar pasangan calon...</p>
                        </div>
                      ) : approvedPairs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-lg border border-slate-200 p-8 shadow-xs">
                          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                          <h3 className="text-base font-bold text-slate-800">Belum Ada Pasangan Calon</h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Belum ada pasangan calon yang terdaftar atau disetujui untuk sesi pemilihan ini.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                          {approvedPairs.map((pair, i) => (
                            <CandidatePairCard
                              key={pair.id}
                              pair={pair}
                              rank={i + 1}
                              isWinner={false}
                              showVoteCount={false}
                              onVote={handleVote}
                              onViewDetail={(p) => setDetailPair(p)}
                              hasVoted={hasVoted}
                              isElectionOpen={isElectionOpen}
                              electionTimeState={electionTimeState}
                              isMinCandidatesMet={isMinCandidatesMet}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Results Tab (Live Results & Winner View) */}
            {activeTab === "results" && (
              <PemilosLiveResults
                electionId={selectedElectionId}
                liveData={liveResults}
                result={liveResults}
                pairs={pairs}
                isElectionOpen={isElectionOpen}
                electionTimeState={electionTimeState}
                onRefresh={loadPairsAndResults}
              />
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Detail Modal */}
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

      {/* Confirm Vote Modal */}
      {votingPair && (
        <VoteModal
          pair={votingPair}
          onClose={() => setVotingPair(null)}
          onConfirm={handleConfirmVote}
          isVoting={isVoting}
        />
      )}
    </div>
  );
}
