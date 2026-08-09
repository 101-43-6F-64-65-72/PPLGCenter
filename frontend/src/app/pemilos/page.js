"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import CandidatePairCard from "@/components/pemilos/CandidatePairCard";
import VoteModal from "@/components/pemilos/VoteModal";
import PemilosLiveResults from "@/components/pemilos/PemilosLiveResults";
import candidatePairService from "@/services/candidatePairService";
import useAuth from "@/hooks/useAuth";
import LoginRequiredFallback from "@/components/common/LoginRequiredFallback";
import {
  Vote, BarChart3, Sparkles, RefreshCw,
  AlertCircle, Loader2, Users
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
  const { user, isAuthenticated } = useAuth();
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [liveResults, setLiveResults] = useState(null);
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingPairs, setLoadingPairs] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [votingPair, setVotingPair] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [activeTab, setActiveTab] = useState("ballot"); // ballot | results

  // Load elections list
  useEffect(() => {
    const fetchElections = async () => {
      setLoadingElections(true);
      setIsUnauthorized(false);
      try {
        const res = await candidatePairService.getElections?.();
        const rawData = res?.data ?? res;
        const list = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.items)
          ? rawData.items
          : Array.isArray(rawData?.data)
          ? rawData.data
          : [];
        setElections(list);
        if (list.length > 0 && list[0]?.id) setSelectedElectionId(list[0].id);
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
    };
    fetchElections();
  }, []);

  // Load pairs & results when election selected
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
  }, [selectedElectionId]);

  useEffect(() => {
    loadPairsAndResults();
  }, [loadPairsAndResults]);

  const handleVote = (pairId) => {
    const pair = pairs.find((p) => p.id === pairId);
    setVotingPair(pair);
  };

  const handleConfirmVote = async () => {
    if (!votingPair || !selectedElectionId) return;
    setIsVoting(true);
    try {
      await candidatePairService.castVote(selectedElectionId, votingPair.id);
      toast.success("Suara Anda berhasil diberikan! 🎉");
      setHasVoted(true);
      setVotingPair(null);
      loadPairsAndResults();
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Gagal memberikan suara.";
      toast.error(msg);
      if (msg.includes("sudah")) setHasVoted(true);
    } finally {
      setIsVoting(false);
    }
  };

  const approvedPairs = pairs.filter((p) => p.statusText === "Approved");
  const isElectionOpen = liveResults?.status === "Open";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2c1ee8]/10 text-[#2c1ee8] text-xs font-extrabold tracking-wide mb-3 border border-[#2c1ee8]/20">
            <Vote className="w-4 h-4" />
            <span>PEMILIHAN KETUA OSIS — PEMILOS</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                E-Voting PEMILOS
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1 max-w-xl">
                Gunakan hak suara Anda secara digital, aman, dan transparan. Satu akun, satu suara.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/pemilos/register"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2c1ee8] text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
              >
                <Users className="w-4 h-4" />
                <span>+ Daftar Kandidat Pemilos</span>
              </Link>
              <button
                onClick={loadPairsAndResults}
                disabled={loadingPairs}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPairs ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-2 mt-6 border-b border-gray-200 pb-0">
            {[
              { id: "ballot", label: "Bilik Suara", icon: Vote },
              { id: "results", label: "Hasil Suara Live", icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-sm font-bold transition-all border-b-2 -mb-px ${
                  activeTab === id
                    ? "border-[#2c1ee8] text-[#2c1ee8] bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
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
        ) : (
          <>
            {/* Voted banner */}
        {hasVoted && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-800 text-sm">Suara Anda sudah tercatat!</p>
              <p className="text-xs text-emerald-600">Terima kasih telah berpartisipasi dalam Pemilos. Suara Anda bersifat rahasia dan tidak dapat diubah.</p>
            </div>
          </div>
        )}

        {/* Ballot tab */}
        {activeTab === "ballot" && (
          <>
            {/* Election status chip */}
            {liveResults && (
              <div className="mb-6 flex items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  isElectionOpen
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-gray-100 border-gray-200 text-gray-600"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isElectionOpen ? "bg-emerald-400 animate-pulse" : "bg-gray-400"}`}></span>
                  {isElectionOpen ? "Pemilihan Sedang Berlangsung" : `Status: ${liveResults.status}`}
                </div>
                {liveResults && (
                  <span className="text-xs text-gray-400">
                    {liveResults.electionTitle}
                  </span>
                )}
              </div>
            )}

            {loadingPairs ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#2c1ee8]" />
                <p className="text-sm text-gray-500 font-medium">Memuat daftar pasangan calon...</p>
              </div>
            ) : approvedPairs.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <h3 className="text-base font-bold text-gray-500">Belum Ada Pasangan Resmi</h3>
                <p className="text-sm text-gray-400 mt-1">Pasangan calon yang telah disetujui akan muncul di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {approvedPairs.map((pair, i) => (
                  <CandidatePairCard
                    key={pair.id}
                    pair={pair}
                    rank={i + 1}
                    isWinner={liveResults?.winnerPair?.id === pair.id}
                    showVoteCount={liveResults?.isResultsVisible}
                    hasVoted={hasVoted}
                    onVote={isElectionOpen && !hasVoted ? handleVote : undefined}
                  />
                ))}
              </div>
            )}

            {/* Pending pairs */}
            {pairs.filter((p) => p.statusText !== "Approved").length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-black text-gray-600 uppercase tracking-wide">Dalam Proses Verifikasi</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pairs.filter((p) => p.statusText !== "Approved").map((pair) => (
                    <CandidatePairCard
                      key={pair.id}
                      pair={pair}
                      showVoteCount={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Results tab */}
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

      {/* Vote Modal */}
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
