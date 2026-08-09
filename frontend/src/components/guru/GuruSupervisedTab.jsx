"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Award, Users, FileCheck, CheckSquare, ShieldCheck,
  Search, Check, X, Settings, UserCheck, RefreshCw, Vote,
  ExternalLink, Mail, Phone, GraduationCap, MapPin, Hash,
  ChevronRight, AlertCircle, ToggleLeft, ToggleRight
} from "lucide-react";
import { extracurricularService } from "@/services/extracurricularService";
import candidatePairService from "@/services/candidatePairService";
import toast from "react-hot-toast";

export default function GuruSupervisedTab({ supervisedExtracurriculars = [], teacherName = "" }) {
  const [selectedEkskul, setSelectedEkskul] = useState(
    supervisedExtracurriculars.length > 0 ? supervisedExtracurriculars[0] : null
  );
  const [subTab, setSubTab] = useState("members"); // 'members' | 'pemilos' | 'settings'

  // Members state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchMember, setSearchMember] = useState("");

  // Pemilos candidates state (for OSIS)
  const [candidatePairs, setCandidatePairs] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});

  // Settings state
  const [description, setDescription] = useState(selectedEkskul?.description || "");
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync selectedEkskul if props change
  useEffect(() => {
    if (supervisedExtracurriculars.length > 0 && !selectedEkskul) {
      setSelectedEkskul(supervisedExtracurriculars[0]);
    }
  }, [supervisedExtracurriculars, selectedEkskul]);

  // Load members of selected ekskul
  const loadMembers = useCallback(async () => {
    if (!selectedEkskul?.id) return;
    setLoadingMembers(true);
    try {
      const res = await extracurricularService.getMembers(selectedEkskul.id);
      const items = res?.data?.items || res?.items || (Array.isArray(res) ? res : []);
      setMembers(items);
    } catch (err) {
      console.error("Gagal memuat anggota ekskul:", err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedEkskul]);

  // Load candidates for Pemilos if OSIS
  const loadPemilosCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      // Load active election list first to get a valid election ID
      const electionsRes = await candidatePairService.getElections?.().catch(() => null);
      const rawElections = electionsRes?.data ?? electionsRes;
      const electionsList = Array.isArray(rawElections)
        ? rawElections
        : Array.isArray(rawElections?.items)
        ? rawElections.items
        : Array.isArray(rawElections?.data)
        ? rawElections.data
        : [];

      if (electionsList.length > 0 && electionsList[0]?.id) {
        const activeId = electionsList[0].id;
        const res = await candidatePairService.getPairs(activeId);
        const items = res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
        setCandidatePairs(items);
      } else {
        setCandidatePairs([]);
      }
    } catch (err) {
      console.error("Gagal memuat kandidat Pemilos:", err);
      setCandidatePairs([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEkskul) {
      setDescription(selectedEkskul.description || "");
      loadMembers();
      if (selectedEkskul.name?.toUpperCase().includes("OSIS")) {
        loadPemilosCandidates();
      }
    }
  }, [selectedEkskul, loadMembers, loadPemilosCandidates]);

  // Teacher Review Candidate Pair
  const handleTeacherReviewPair = async (pairId, isApproved) => {
    try {
      const notes = reviewNotes[pairId] || (isApproved ? "Disetujui oleh Guru Pembina" : "Ditolak oleh Guru Pembina");
      await candidatePairService.teacherReviewPair(pairId, {
        isApproved,
        notes,
      });
      toast.success(isApproved ? "✓ Candidate pair berhasil disetujui Pembina!" : "Candidate pair ditolak.");
      loadPemilosCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memproses verifikasi kandidat.");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedEkskul?.id) return;
    setSavingSettings(true);
    try {
      await extracurricularService.updateExtracurricular(selectedEkskul.id, {
        name: selectedEkskul.name,
        category: selectedEkskul.category,
        description: description,
        isActive: selectedEkskul.isActive ?? true,
      });
      toast.success("✓ Informasi ekskul berhasil diperbarui!");
    } catch (err) {
      toast.error("Gagal memperbarui ekskul.");
    } finally {
      savingSettings && setSavingSettings(false);
    }
  };

  if (!supervisedExtracurriculars || supervisedExtracurriculars.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-gray-900">Belum Ada Unit Binaan</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Anda saat ini belum ditetapkan sebagai Guru Pembina untuk ekstrakurikuler atau organisasi siswa manapun.
        </p>
      </div>
    );
  }

  const isOsis = selectedEkskul?.name?.toUpperCase().includes("OSIS");

  const filteredMembers = members.filter(
    (m) =>
      m.studentName?.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.nis?.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.className?.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* ── Header Banner & Unit Selector ── */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Panel Monitoring Guru Pembina</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Monitoring Ekskul: {selectedEkskul?.name}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pengawasan keanggotaan, verifikasi Pemilos, dan pengelolaan kegiatan binaan.
          </p>
        </div>

        {/* Dropdown pilih unit ekskul binaan */}
        {supervisedExtracurriculars.length > 1 && (
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
            <span className="text-xs font-bold text-gray-500 pl-2">Pilih Unit:</span>
            <select
              value={selectedEkskul?.id}
              onChange={(e) => {
                const found = supervisedExtracurriculars.find((ex) => ex.id === e.target.value);
                if (found) setSelectedEkskul(found);
              }}
              className="bg-white border border-gray-200 text-xs font-extrabold text-gray-800 rounded-xl px-3 py-2 outline-none"
            >
              {supervisedExtracurriculars.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Sub-tabs Navigasi ── */}
      <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60 overflow-x-auto">
        <button
          onClick={() => setSubTab("members")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === "members"
              ? "bg-white text-[#2c1ee8] shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Anggota ({members.length})</span>
        </button>

        {isOsis && (
          <button
            onClick={() => setSubTab("pemilos")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === "pemilos"
                ? "bg-white text-[#2c1ee8] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Vote className="w-4 h-4 text-purple-600" />
            <span>Persetujuan Pemilos</span>
          </button>
        )}

        <button
          onClick={() => setSubTab("settings")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === "settings"
              ? "bg-white text-[#2c1ee8] shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Ekskul</span>
        </button>
      </div>

      {/* ════════════════════════════════════════
          SUB-TAB 1: DAFTAR ANGGOTA
      ════════════════════════════════════════ */}
      {subTab === "members" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama anggota, NIS, atau kelas..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm outline-none transition"
              />
            </div>
            <button
              onClick={loadMembers}
              className="p-2.5 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer self-start sm:self-auto"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMembers ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Siswa Anggota {selectedEkskul?.name} ({filteredMembers.length})</span>
              </h3>
            </div>

            {loadingMembers ? (
              <div className="p-12 text-center text-gray-400 animate-pulse text-sm">
                Memuat daftar anggota...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
                <p className="font-bold text-gray-700 text-sm">Belum ada anggota terdaftar</p>
                <p className="text-xs text-gray-400 mt-1">Siswa yang mendaftar ke unit ini akan muncul di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-extrabold text-[11px] border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Siswa</th>
                      <th className="px-6 py-4">Identitas (NIS / NISN)</th>
                      <th className="px-6 py-4">Kelas</th>
                      <th className="px-6 py-4">Jabatan</th>
                      <th className="px-6 py-4">Status Anggota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {filteredMembers.map((m) => (
                      <tr key={m.id || m.studentId} className="hover:bg-emerald-50/20 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
                              {m.photoUrl ? (
                                <img src={m.photoUrl} alt={m.studentName} className="w-full h-full object-cover" />
                              ) : (
                                m.studentName?.charAt(0)?.toUpperCase() || "S"
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-gray-900 block">{m.studentName}</span>
                              <span className="text-[11px] font-mono text-gray-400">{m.email || "-"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs font-bold text-gray-800">
                          {m.nis || m.nisn || "-"}
                        </td>

                        <td className="px-6 py-4 font-bold text-gray-800">
                          {m.className || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#2c1ee8] text-xs font-bold border border-blue-100">
                            {m.position || "Anggota"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                            ● {m.status || "Aktif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          SUB-TAB 2: PERSETUJUAN PEMILOS (OSIS)
      ════════════════════════════════════════ */}
      {subTab === "pemilos" && isOsis && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-3xl text-white space-y-2 shadow-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
              <Vote className="w-4 h-4 text-amber-300" />
              <span>Verifikasi Kandidat Pemilos Pembina OSIS</span>
            </div>
            <h3 className="text-xl font-black">Persetujuan Pasangan Kandidat Ketua & Wakil OSIS</h3>
            <p className="text-xs text-purple-200 max-w-2xl leading-relaxed">
              Tinjau permohonan pasangan kandidat yang diajukan oleh siswa. Anda memiliki wewenang penuh untuk menyetujui (Approve) agar tampil di bilik suara e-voting.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-gray-900 text-base">
                Daftar Pengajuan Pasangan Kandidat ({candidatePairs.length})
              </h4>
              <button
                onClick={loadPemilosCandidates}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCandidates ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingCandidates ? (
              <div className="py-12 text-center text-gray-400 animate-pulse text-sm">
                Memuat pengajuan kandidat...
              </div>
            ) : candidatePairs.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Vote className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-600" />
                <p className="font-bold text-gray-700 text-sm">Belum ada pengajuan kandidat</p>
                <p className="text-xs text-gray-400 mt-1">Siswa yang mendaftar Pemilos akan muncul di sini untuk verifikasi Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidatePairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="p-5 rounded-3xl border border-gray-200 bg-white hover:border-purple-300 transition space-y-4 shadow-sm"
                  >
                    {/* Header Candidate Number & Status */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                        Kandidat #{pair.candidateNumber}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        pair.statusText === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : pair.statusText === "Rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {pair.statusText || "Pending"}
                      </span>
                    </div>

                    {/* Pair Grid: Ketua & Wakil */}
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      {/* Ketua */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase block">Calon Ketua</span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2c1ee8] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {pair.photoUrl ? <img src={pair.photoUrl} alt="Ketua" className="w-full h-full object-cover" /> : pair.chairmanName?.[0]}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 text-xs leading-tight">{pair.chairmanName}</p>
                            <p className="text-[10px] text-gray-400">{pair.chairmanClass || "Siswa"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Wakil */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase block">Calon Wakil</span>
                        {pair.viceName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                              {pair.vicePhotoUrl ? <img src={pair.vicePhotoUrl} alt="Wakil" className="w-full h-full object-cover" /> : pair.viceName?.[0]}
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 text-xs leading-tight">{pair.viceName}</p>
                              <p className="text-[10px] text-gray-400">{pair.viceClass || "Siswa"}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-amber-600 italic py-1">Belum ada wakil</p>
                        )}
                      </div>
                    </div>

                    {/* Visi & Misi */}
                    <div className="text-xs text-gray-600 space-y-1">
                      <span className="font-bold text-gray-800 block">Visi:</span>
                      <p className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 italic leading-relaxed">
                        "{pair.vision || "Belum mengisi visi"}"
                      </p>
                    </div>

                    {/* Catatan Review Pembina */}
                    <div>
                      <input
                        type="text"
                        placeholder="Catatan Review Pembina (Opsional)..."
                        value={reviewNotes[pair.id] || ""}
                        onChange={(e) => setReviewNotes({ ...reviewNotes, [pair.id]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#2c1ee8]"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleTeacherReviewPair(pair.id, true)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Setujui (Approve)
                      </button>
                      <button
                        onClick={() => handleTeacherReviewPair(pair.id, false)}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        Tolak (Reject)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          SUB-TAB 3: PENGATURAN EKSKUL
      ════════════════════════════════════════ */}
      {subTab === "settings" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#2c1ee8] flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Pengaturan Unit {selectedEkskul?.name}</h3>
              <p className="text-xs text-gray-400">Kelola deskripsi dan informasi publik unit binaan Anda.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Nama Ekstrakurikuler / Organisasi
              </label>
              <input
                type="text"
                disabled
                value={selectedEkskul?.name || ""}
                className="w-full rounded-2xl border border-gray-200 bg-gray-100 py-3 px-4 text-xs sm:text-sm text-gray-500 font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Deskripsi Unit Binaan
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan deskripsi visi, misi, dan kegiatan unit ekskul ini..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 px-4 text-xs sm:text-sm text-gray-900 focus:border-[#2c1ee8] outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2c1ee8] text-white text-xs sm:text-sm font-extrabold hover:bg-blue-700 transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
