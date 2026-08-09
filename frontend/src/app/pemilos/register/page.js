"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import candidatePairService from "@/services/candidatePairService";
import useAuth from "@/hooks/useAuth";
import {
  PenSquare, Users, CheckCircle2, Loader2, Crown,
  AlertCircle, Send, Search, Eye, X, UserCheck, ShieldCheck, FileText
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
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState(null);

  // Vice candidate search states
  const [viceSearchTerm, setViceSearchTerm] = useState("");
  const [viceSearchResults, setViceSearchResults] = useState([]);
  const [searchingVice, setSearchingVice] = useState(false);
  const [selectedVice, setSelectedVice] = useState(null);

  // Unified Candidate Pair Form State
  const [pairForm, setPairForm] = useState({
    vision: "",
    mission: "",
    programs: "",
    photoUrl: "",
    vicePhotoUrl: "",
  });

  // Preview Modal state
  const [showPreview, setShowPreview] = useState(false);

  // Fetch elections on mount
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
        
        // Exclude deleted elections
        const validList = list.filter((e) => !e.deletedAt && !e.DeletedAt);
        setElections(validList);

        if (validList.length > 0 && validList[0]?.id) {
          setSelectedElectionId(validList[0].id);
          loadPairs(validList[0].id);
        }
      } catch (err) {
        console.error("Gagal memuat sesi pemilos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  const loadPairs = async (electionId) => {
    setLoading(true);
    try {
      const [pairsRes, eligRes] = await Promise.allSettled([
        candidatePairService.getPairs(electionId),
        candidatePairService.getEligibility(electionId),
      ]);
      if (pairsRes.status === "fulfilled") {
        const rawPairs = pairsRes.value?.data ?? pairsRes.value;
        const list = Array.isArray(rawPairs)
          ? rawPairs
          : Array.isArray(rawPairs?.items)
          ? rawPairs.items
          : Array.isArray(rawPairs?.data)
          ? rawPairs.data
          : [];
        setPairs(list);
      }
      if (eligRes.status === "fulfilled") {
        setEligibility(eligRes.value?.data ?? eligRes.value?.data?.data ?? null);
      }
    } catch {
      toast.error("Gagal memuat data pendaftaran pemilos.");
    } finally {
      setLoading(false);
    }
  };

  const handleElectionSelect = (e) => {
    const id = e.target.value;
    setSelectedElectionId(id);
    setEligibility(null);
    setSelectedVice(null);
    setViceSearchTerm("");
    setViceSearchResults([]);
    if (id) loadPairs(id);
    else setPairs([]);
  };

  // Debounced search for eligible Vice candidates
  useEffect(() => {
    if (!viceSearchTerm.trim() || viceSearchTerm.length < 2) {
      setViceSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingVice(true);
      try {
        const res = await candidatePairService.searchEligibleViceCandidates(viceSearchTerm, selectedElectionId);
        const rawData = res?.data ?? res;
        const list = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.items)
          ? rawData.items
          : Array.isArray(rawData?.data)
          ? rawData.data
          : [];

        // Filter out Chairman (current logged in user) & invalid roles
        const filteredList = list.filter((s) => String(s.id) !== String(user?.id));
        setViceSearchResults(filteredList);
      } catch (err) {
        console.error("Gagal mencari calon wakil:", err);
      } finally {
        setSearchingVice(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [viceSearchTerm, selectedElectionId, user?.id]);

  const handleSelectVice = (student) => {
    setSelectedVice(student);
    setViceSearchTerm("");
    setViceSearchResults([]);
    if (student?.photoUrl || student?.avatar) {
      setPairForm((prev) => ({ ...prev, vicePhotoUrl: student.photoUrl || student.avatar }));
    }
  };

  // Check if current user is already registered in a pair
  const myPair = pairs.find(
    (p) => String(p.chairmanUserId) === String(user?.id) || String(p.viceUserId) === String(user?.id)
  );

  const handleSubmitPair = async () => {
    if (!selectedElectionId) {
      toast.error("Pilih sesi pemilihan terlebih dahulu.");
      return;
    }
    if (!selectedVice) {
      toast.error("Pilih Calon Wakil terlebih dahulu.");
      return;
    }
    if (String(selectedVice.id) === String(user?.id)) {
      toast.error("Anda tidak dapat memilih diri sendiri sebagai Calon Wakil.");
      return;
    }
    if (!pairForm.vision.trim() || !pairForm.mission.trim() || !pairForm.programs.trim()) {
      toast.error("Lengkapi Visi, Misi, dan Program Kerja terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        electionId: selectedElectionId,
        viceUserId: selectedVice.id,
        vision: pairForm.vision,
        mission: pairForm.mission,
        programs: pairForm.programs,
        photoUrl: pairForm.photoUrl || user?.photoUrl || user?.avatar || "",
        vicePhotoUrl: pairForm.vicePhotoUrl || selectedVice?.photoUrl || selectedVice?.avatar || "",
      };

      await candidatePairService.createCandidatePair(payload);
      toast.success("✓ Pendaftaran Pasangan Calon berhasil diajukan!");
      setShowPreview(false);
      loadPairs(selectedElectionId);
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || "Gagal mengajukan pendaftaran pasangan.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20">
        
        {/* Header Banner */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2c1ee8]/10 text-[#2c1ee8] text-xs font-extrabold tracking-wide mb-3 border border-[#2c1ee8]/20">
            <PenSquare className="w-4 h-4" />
            <span>PENDAFTARAN KANDIDAT OSIS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Daftar Pasangan Pemilos
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Daftarkan diri Anda sebagai Calon Ketua, pilih Calon Wakil Anda, dan ajukan seluruh data sebagai SATU Pasangan Kandidat.
          </p>
        </div>

        {/* Election Session Selector Dropdown */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
            Sesi Pemilihan Pemilos
          </label>
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh Sesi"}
            </button>
          </div>
        </div>

        {/* Eligibility Status Banner (if checked by API) */}
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

        {/* CONDITION 1: User Already Registered a CandidatePair */}
        {myPair ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#2c1ee8] flex-shrink-0" />
              <div>
                <h3 className="font-extrabold text-blue-900 text-sm sm:text-base">
                  Anda Sudah Mendaftarkan Pasangan Kandidat
                </h3>
                <p className="text-xs text-blue-700">
                  Data pendaftaran pasangan Anda telah tercatat pada sesi ini. Status pendaftaran dikendalikan oleh panitia/admin.
                </p>
              </div>
            </div>

            <MyPairStatusCard pair={myPair} currentUserId={user?.id} />
          </div>
        ) : (
          /* CONDITION 2: Single Unified Candidate Pair Form */
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            {/* Section 1: Chairman & Vice Chairman Selection */}
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Users className="w-4 h-4 text-[#2c1ee8]" />
                <span>1. Pasangan Calon (Ketua & Wakil)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Chairman Card (Auto logged-in user) */}
                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                      👑 Calon Ketua (Otomatis)
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">Akun Anda</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2c1ee8] to-blue-600 flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-md shrink-0">
                      {pairForm.photoUrl || user?.photoUrl || user?.avatar ? (
                        <img src={pairForm.photoUrl || user?.photoUrl || user?.avatar} alt={user?.fullName} className="w-full h-full object-cover" />
                      ) : (
                        user?.fullName?.[0] ?? "K"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-900 text-sm truncate">
                        {user?.fullName || user?.name || "Siswa"}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {user?.className || user?.class || "Siswa SMKN 2"} {user?.nis ? `· NIS ${user.nis}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vice Chairman Search & Selection Card */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-600 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                      🤝 Calon Wakil
                    </span>
                    {selectedVice && (
                      <button
                        type="button"
                        onClick={() => setSelectedVice(null)}
                        className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Ubah Wakil
                      </button>
                    )}
                  </div>

                  {selectedVice ? (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-md shrink-0">
                        {pairForm.vicePhotoUrl || selectedVice?.photoUrl || selectedVice?.avatar ? (
                          <img src={pairForm.vicePhotoUrl || selectedVice?.photoUrl || selectedVice?.avatar} alt={selectedVice?.fullName || selectedVice?.name} className="w-full h-full object-cover" />
                        ) : (
                          (selectedVice?.fullName || selectedVice?.name)?.[0] ?? "W"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-gray-900 text-sm truncate">
                          {selectedVice?.fullName || selectedVice?.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {selectedVice?.className || selectedVice?.class || "Siswa SMKN 2"} {selectedVice?.nis ? `· NIS ${selectedVice.nis}` : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={viceSearchTerm}
                          onChange={(e) => setViceSearchTerm(e.target.value)}
                          placeholder="Cari Wakil berdasarkan Nama atau NIS..."
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30"
                        />
                        {searchingVice && (
                          <Loader2 className="w-4 h-4 text-[#2c1ee8] animate-spin absolute right-3.5 top-3" />
                        )}
                      </div>

                      {/* Vice Search Results List */}
                      {viceSearchResults.length > 0 && (
                        <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-lg divide-y divide-gray-100 text-xs">
                          {viceSearchResults.map((student) => (
                            <div
                              key={student.id}
                              className="p-3 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
                            >
                              <div>
                                <p className="font-bold text-gray-900">{student.fullName || student.name}</p>
                                <p className="text-gray-400 text-[11px]">
                                  {student.className || student.class || "Siswa"} {student.nis ? `· NIS ${student.nis}` : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectVice(student)}
                                className="px-3 py-1.5 rounded-xl bg-[#2c1ee8] text-white font-bold hover:bg-blue-700 transition cursor-pointer text-xs flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Pilih
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {viceSearchTerm.length >= 2 && !searchingVice && viceSearchResults.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Tidak ada siswa ditemukan.</p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Section 2: Visi, Misi, Program Kerja */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileText className="w-4 h-4 text-[#2c1ee8]" />
                <span>2. Visi, Misi & Program Kerja Pasangan</span>
              </h2>

              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                  Visi Pasangan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={pairForm.vision}
                  onChange={(e) => setPairForm({ ...pairForm, vision: e.target.value })}
                  placeholder="Tuliskan visi utama kepemimpinan Pasangan Anda..."
                  className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none font-normal"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                  Misi Pasangan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={pairForm.mission}
                  onChange={(e) => setPairForm({ ...pairForm, mission: e.target.value })}
                  placeholder="Tuliskan poin-poin misi kerja Pasangan Anda..."
                  className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none font-normal"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                  Program Kerja Unggulan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={pairForm.programs}
                  onChange={(e) => setPairForm({ ...pairForm, programs: e.target.value })}
                  placeholder="Rincian program kerja prioritas OSIS..."
                  className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none font-normal"
                />
              </div>
            </div>

            {/* Form Actions (Preview & Submit) */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={!selectedVice || !pairForm.vision || !pairForm.mission || !pairForm.programs}
                onClick={() => setShowPreview(true)}
                className="px-6 py-3 border border-gray-300 rounded-2xl text-xs sm:text-sm font-extrabold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Preview Pasangan
              </button>

              <button
                type="button"
                disabled={submitting || !selectedVice || !pairForm.vision || !pairForm.mission || !pairForm.programs || (eligibility && !eligibility.eligible)}
                onClick={handleSubmitPair}
                className="px-8 py-3 bg-[#2c1ee8] text-white rounded-2xl text-xs sm:text-sm font-extrabold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Ajukan Pasangan
              </button>
            </div>

          </div>
        )}
      </main>

      {/* Unified Candidate Pair Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-black text-[#2c1ee8] uppercase tracking-wider block">PREVIEW PASANGAN KANDIDAT</span>
                <h3 className="text-lg font-black text-gray-900">
                  {user?.fullName || "Calon Ketua"} & {selectedVice?.fullName || selectedVice?.name || "Calon Wakil"}
                </h3>
              </div>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-center">
                <Crown className="w-5 h-5 text-[#2c1ee8] mx-auto mb-1" />
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Calon Ketua</span>
                <p className="font-extrabold text-sm text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 font-mono">{user?.className || "Siswa"}</p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
                <UserCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Calon Wakil</span>
                <p className="font-extrabold text-sm text-gray-900 truncate">{selectedVice?.fullName || selectedVice?.name}</p>
                <p className="text-xs text-gray-500 font-mono">{selectedVice?.className || "Siswa"}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-900 uppercase block mb-0.5">Visi</span>
                <p>{pairForm.vision}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-900 uppercase block mb-0.5">Misi</span>
                <p className="whitespace-pre-line">{pairForm.mission}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-900 uppercase block mb-0.5">Program Kerja</span>
                <p className="whitespace-pre-line">{pairForm.programs}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Kembali Edit
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmitPair}
                className="flex-1 py-3 bg-[#2c1ee8] text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Ajukan Pasangan Ini"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MyPairStatusCard({ pair, currentUserId }) {
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
    WaitingChairman: "Menunggu Verifikasi Ketua",
    WaitingTeacher: "Menunggu Review Pembina OSIS",
    WaitingAdmin: "Menunggu Verifikasi Final Admin",
    Approved: "✓ Disetujui & Resmi Berpasangan",
    Rejected: "Ditolak / Perlu Perbaikan",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
          Pasangan #{pair.candidateNumber || "-"}
        </span>
        <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold border ${statusColors[pair.statusText] || "bg-gray-100 text-gray-700"}`}>
          {statusLabels[pair.statusText] || pair.statusText}
        </span>
      </div>

      {pair.rejectionReason && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
          <span className="font-extrabold uppercase tracking-wide block">Alasan Penolakan:</span>
          <p>{pair.rejectionReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
          <Crown className="w-5 h-5 text-[#2c1ee8] flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Calon Ketua</span>
            <p className="font-extrabold text-sm text-gray-900 truncate">{pair.chairmanName}</p>
            <p className="text-xs text-gray-500 font-mono">{pair.chairmanClass || "Siswa"}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Calon Wakil</span>
            <p className="font-extrabold text-sm text-gray-900 truncate">{pair.viceName || "Belum ada"}</p>
            <p className="text-xs text-gray-500 font-mono">{pair.viceClass || "Siswa"}</p>
          </div>
        </div>
      </div>

      {pair.vision && (
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 space-y-1">
          <span className="font-bold text-gray-900 uppercase block">Visi Pasangan:</span>
          <p>{pair.vision}</p>
        </div>
      )}
    </div>
  );
}
