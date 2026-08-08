"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import candidatePairService from "@/services/candidatePairService";
import useAuth from "@/hooks/useAuth";
import {
  PenSquare, Users, CheckCircle2, Loader2, Crown,
  ChevronDown, ChevronUp, AlertCircle, Send, Vote
} from "lucide-react";
import toast from "react-hot-toast";

export default function PemilosRegisterPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.OSIS]}>
      <RegisterContent />
    </AuthGuard>
  );
}

function RegisterContent() {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState(null); // 'chairman' | 'vice:{pairId}'
  const [submitting, setSubmitting] = useState(false);

  const [chairmanForm, setChairmanForm] = useState({
    candidateNumber: 1,
    vision: "",
    mission: "",
    programs: "",
    photoUrl: "",
  });

  const [viceForm, setViceForm] = useState({
    viceVision: "",
    viceMission: "",
    vicePhotoUrl: "",
  });

  useEffect(() => {
    const fetchElections = async () => {
      setLoading(true);
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
        if (list.length > 0 && list[0]?.id) {
          setSelectedElectionId(list[0].id);
          loadPairs(list[0].id);
        }
      } catch (err) {
        console.error("Gagal memuat daftar pemilu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const loadPairs = async (electionId) => {
    setLoading(true);
    setCheckingEligibility(true);
    try {
      const [pairsRes, eligRes] = await Promise.allSettled([
        candidatePairService.getPairs(electionId),
        candidatePairService.getEligibility(electionId),
      ]);
      if (pairsRes.status === "fulfilled") {
        setPairs(pairsRes.value?.data?.data ?? []);
      }
      if (eligRes.status === "fulfilled") {
        setEligibility(eligRes.value?.data ?? eligRes.value?.data?.data ?? null);
      }
    } catch {
      toast.error("Gagal memuat data pemilihan");
    } finally {
      setLoading(false);
      setCheckingEligibility(false);
    }
  };

  const handleElectionSelect = (e) => {
    const id = e.target.value;
    setSelectedElectionId(id);
    setEligibility(null);
    if (id) loadPairs(id);
    else setPairs([]);
  };

  const handleRegisterChairman = async (e) => {
    e.preventDefault();
    if (!selectedElectionId) {
      toast.error("Pilih pemilihan terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      await candidatePairService.registerChairman({
        electionId: selectedElectionId,
        candidateNumber: parseInt(chairmanForm.candidateNumber),
        vision: chairmanForm.vision,
        mission: chairmanForm.mission,
        programs: chairmanForm.programs,
        photoUrl: user?.photoUrl || user?.avatar || "",
      });
      toast.success("✓ Pendaftaran Calon Ketua berhasil diajukan!");
      setActiveForm(null);
      loadPairs(selectedElectionId);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Gagal mendaftar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyVice = async (e, pairId) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await candidatePairService.applyVice(pairId, {
        viceVision: viceForm.viceVision,
        viceMission: viceForm.viceMission,
        vicePhotoUrl: user?.photoUrl || user?.avatar || "",
      });
      toast.success("✓ Permohonan Calon Wakil berhasil diajukan!");
      setActiveForm(null);
      setViceForm({ viceVision: "", viceMission: "", vicePhotoUrl: "" });
      loadPairs(selectedElectionId);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Gagal mendaftar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChairmanReview = async (pairId, accept) => {
    try {
      await candidatePairService.chairmanReviewVice(pairId, accept);
      toast.success(accept ? "Calon Wakil disetujui!" : "Calon Wakil ditolak.");
      loadPairs(selectedElectionId);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Gagal memproses");
    }
  };

  const waitingVicePairs = pairs.filter(
    (p) => p.statusText === "WaitingVice" && p.chairmanUserId !== user?.id
  );

  const myPairs = pairs.filter(
    (p) => p.chairmanUserId === user?.id || p.viceUserId === user?.id
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2c1ee8]/10 text-[#2c1ee8] text-xs font-extrabold tracking-wide mb-3 border border-[#2c1ee8]/20">
            <PenSquare className="w-4 h-4" />
            <span>PENDAFTARAN PASANGAN CALON</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Daftar Calon PEMILOS</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Daftarkan diri sebagai Calon Ketua OSIS, atau lamar sebagai Calon Wakil pada pasangan yang sedang mencari mitra.
          </p>
        </div>

        {/* Election Selector Dropdown */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Pilih Sesi Pemilihan (Pemilos)</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedElectionId}
              onChange={handleElectionSelect}
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 focus:border-[#2c1ee8] cursor-pointer"
            >
              {elections.length > 0 ? (
                elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.title || el.name || `Pemilihan OSIS ${el.academicYearName || ""}`}
                  </option>
                ))
              ) : (
                <option value={selectedElectionId || ""}>
                  {selectedElectionId ? `Sesi Pemilos (ID: ${selectedElectionId.substring(0, 8)}...)` : "-- Memuat Sesi Pemilos --"}
                </option>
              )}
            </select>
            <button
              onClick={() => selectedElectionId && loadPairs(selectedElectionId)}
              disabled={!selectedElectionId || loading}
              className="px-6 py-2.5 bg-[#2c1ee8] text-white rounded-2xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Muat Sesi"}
            </button>
          </div>
        </div>

        {/* Eligibility Status Banner */}
        {selectedElectionId && eligibility && (
          <div className={`mb-6 p-5 rounded-3xl border ${
            eligibility.eligible
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}>
            <div className="flex items-start gap-3">
              {eligibility.eligible ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {eligibility.eligible
                      ? "Anda Memenuhi Syarat Pendaftaran Calon Ketua OSIS"
                      : "Belum Memenuhi Syarat Pendaftaran Calon Ketua OSIS"}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    eligibility.isOsisMember
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}>
                    {eligibility.isOsisMember ? "✓ Anggota OSIS Aktif" : "✗ Bukan Anggota OSIS"}
                  </span>
                </div>
                {!eligibility.eligible && eligibility.reasons && eligibility.reasons.length > 0 && (
                  <ul className="mt-2 text-xs font-semibold space-y-1 list-disc list-inside text-amber-800">
                    {eligibility.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Registered Candidate Card (If Already Registered) */}
        {myPairs.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status Pendaftaran Kandidat Anda</span>
            </h2>
            <div className="space-y-4">
              {myPairs.map((pair) => (
                <MyPairDetailedCard
                  key={pair.id}
                  pair={pair}
                  user={user}
                  isChairman={pair.chairmanUserId === user?.id}
                  onChairmanReview={pair.statusText === "WaitingChairman" && pair.chairmanUserId === user?.id ? handleChairmanReview : undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Register as Chairman Form (Only visible if not registered yet) */
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm mb-6 overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-gray-50/80 transition"
              onClick={() => setActiveForm(activeForm === "chairman" ? null : "chairman")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2c1ee8] to-blue-600 flex items-center justify-center shadow-sm">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-extrabold text-gray-900 text-sm sm:text-base">Daftar Sebagai Calon Ketua OSIS</p>
                  <p className="text-xs text-gray-500">Buat pasangan baru dan buka pendaftaran untuk Calon Wakil</p>
                </div>
              </div>
              {activeForm === "chairman" ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {activeForm === "chairman" && (
              <form onSubmit={handleRegisterChairman} className="px-5 pb-6 border-t border-gray-100 pt-5 space-y-4">
                {/* Auto-filled user profile banner */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2c1ee8] flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                    {user?.photoUrl || user?.avatar ? (
                      <img src={user.photoUrl || user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      user?.fullName?.charAt(0)?.toUpperCase() || "S"
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{user?.fullName || "Siswa"}</p>
                    <p className="text-[11px] text-gray-500 font-mono">
                      {user?.nis ? `NIS: ${user.nis}` : user?.email} · {user?.className || "Siswa SMKN 2 Surakarta"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">Nomor Urut Pasangan</label>
                  <input
                    type="number" min="1" max="99" required
                    value={chairmanForm.candidateNumber}
                    onChange={(e) => setChairmanForm({ ...chairmanForm, candidateNumber: e.target.value })}
                    className="w-full sm:w-48 border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">Visi Utama</label>
                  <textarea required rows={2}
                    value={chairmanForm.vision}
                    onChange={(e) => setChairmanForm({ ...chairmanForm, vision: e.target.value })}
                    placeholder="Tuliskan visi utama kepemimpinan Anda..."
                    className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">Misi</label>
                  <textarea required rows={3}
                    value={chairmanForm.mission}
                    onChange={(e) => setChairmanForm({ ...chairmanForm, mission: e.target.value })}
                    placeholder="Tuliskan poin-poin misi Anda..."
                    className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">Program Kerja Unggulan</label>
                  <textarea required rows={3}
                    value={chairmanForm.programs}
                    onChange={(e) => setChairmanForm({ ...chairmanForm, programs: e.target.value })}
                    placeholder="Rincian program kerja unggulan..."
                    className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none"
                  />
                </div>

                <button type="submit" disabled={submitting || !selectedElectionId || (eligibility && !eligibility.eligible)}
                  className="flex items-center gap-2 px-8 py-3 bg-[#2c1ee8] text-white rounded-2xl text-xs sm:text-sm font-extrabold hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-blue-500/20">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {eligibility && !eligibility.eligible ? "Belum Memenuhi Syarat (Lihat Alasan)" : "Ajukan Pendaftaran"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Open pairs looking for Vice */}
        {!myPairs.length && waitingVicePairs.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pasangan yang Mencari Calon Wakil ({waitingVicePairs.length})
            </h2>
            <div className="space-y-4">
              {waitingVicePairs.map((pair) => (
                <div key={pair.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2c1ee8] to-blue-600 flex items-center justify-center text-white font-black text-lg">
                        {pair.chairmanName?.[0] ?? "K"}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{pair.chairmanName}</p>
                        <p className="text-xs text-gray-400">{pair.chairmanClass} · Pasangan #{pair.candidateNumber}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed italic">"{pair.vision}"</p>
                    <button
                      onClick={() => setActiveForm(activeForm === `vice:${pair.id}` ? null : `vice:${pair.id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Lamar Sebagai Wakil
                    </button>
                  </div>

                  {activeForm === `vice:${pair.id}` && (
                    <form onSubmit={(e) => handleApplyVice(e, pair.id)} className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">Visi (sebagai Wakil)</label>
                        <textarea rows={2} value={viceForm.viceVision}
                          onChange={(e) => setViceForm({ ...viceForm, viceVision: e.target.value })}
                          className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">Misi (sebagai Wakil)</label>
                        <textarea rows={2} value={viceForm.viceMission}
                          onChange={(e) => setViceForm({ ...viceForm, viceMission: e.target.value })}
                          className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none"
                        />
                      </div>
                      <button type="submit" disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-2xl text-xs sm:text-sm font-extrabold hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Kirim Permohonan
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MyPairDetailedCard({ pair, user, isChairman, onChairmanReview }) {
  const statusColors = {
    WaitingVice: "bg-amber-50 border-amber-200 text-amber-700",
    WaitingChairman: "bg-blue-50 border-blue-200 text-blue-700",
    WaitingTeacher: "bg-purple-50 border-purple-200 text-purple-700",
    WaitingAdmin: "bg-orange-50 border-orange-200 text-orange-700",
    Approved: "bg-emerald-50 border-emerald-200 text-emerald-700",
    Rejected: "bg-rose-50 border-rose-200 text-rose-700",
  };

  const statusLabels = {
    WaitingVice: "Menunggu Calon Wakil",
    WaitingChairman: "Menunggu ACC Ketua",
    WaitingTeacher: "Menunggu Review Pembina OSIS",
    WaitingAdmin: "Menunggu Persetujuan Admin",
    Approved: "✓ Disetujui & Resmi Berpasangan",
    Rejected: "Ditandai Tidak Disetujui",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2c1ee8] to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            #{pair.candidateNumber}
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-base sm:text-lg">
              Pasangan Calon Nomor Urut #{pair.candidateNumber}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {isChairman ? "Status Pendaftaran Anda sebagai Calon Ketua" : "Status Pendaftaran Anda sebagai Calon Wakil"}
            </p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black border self-start sm:self-auto ${statusColors[pair.statusText] || "bg-gray-100 border-gray-200 text-gray-600"}`}>
          {statusLabels[pair.statusText] || pair.statusText}
        </span>
      </div>

      {/* Grid Pair Display (Ketua & Wakil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box Ketua */}
        <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2c1ee8] text-[10px] font-black uppercase">
              👑 Calon Ketua OSIS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#2c1ee8] flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-indigo-200">
              {pair.photoUrl ? (
                <img src={pair.photoUrl} alt={pair.chairmanName} className="w-full h-full object-cover" />
              ) : (
                pair.chairmanName?.charAt(0)?.toUpperCase() || "K"
              )}
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-sm">{pair.chairmanName}</p>
              <p className="text-xs text-gray-500 font-mono">{pair.chairmanClass || "Siswa"}</p>
            </div>
          </div>

          {pair.vision && (
            <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider mb-0.5">Visi Utama:</span>
              <p className="italic leading-relaxed">"{pair.vision}"</p>
            </div>
          )}
        </div>

        {/* Box Wakil */}
        <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                🤝 Calon Wakil OSIS
              </span>
            </div>

            {pair.viceName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-emerald-200">
                    {pair.vicePhotoUrl ? (
                      <img src={pair.vicePhotoUrl} alt={pair.viceName} className="w-full h-full object-cover" />
                    ) : (
                      pair.viceName?.charAt(0)?.toUpperCase() || "W"
                    )}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">{pair.viceName}</p>
                    <p className="text-xs text-gray-500 font-mono">{pair.viceClass || "Siswa"}</p>
                  </div>
                </div>

                {pair.viceVision && (
                  <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider mb-0.5">Visi Wakil:</span>
                    <p className="italic leading-relaxed">"{pair.viceVision}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs space-y-1">
                <p className="font-extrabold text-amber-700">Slot Calon Wakil Masih Kosong</p>
                <p className="text-gray-500">Menunggu siswa lain melamar sebagai calon wakil Anda.</p>
              </div>
            )}
          </div>

          {/* Action ACC Wakil oleh Ketua */}
          {onChairmanReview && pair.viceName && (
            <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-blue-800">Pelamar Wakil Baru:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onChairmanReview(pair.id, true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Setujui Wakil
                </button>
                <button
                  onClick={() => onChairmanReview(pair.id, false)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 transition cursor-pointer flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Tolak
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
