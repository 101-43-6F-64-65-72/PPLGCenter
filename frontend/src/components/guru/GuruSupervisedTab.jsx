"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Award, Users, FileCheck, CheckSquare, ShieldCheck,
  Search, Check, X, Settings, UserCheck, RefreshCw, Vote,
  ExternalLink, Mail, Phone, GraduationCap, MapPin, Hash,
  ChevronRight, AlertCircle, ToggleLeft, ToggleRight, Plus
} from "lucide-react";
import { extracurricularService } from "@/services/extracurricularService";
import candidatePairService from "@/services/candidatePairService";
import electionService from "@/services/electionService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import ImageCropUploader from "@/components/common/ImageCropUploader";
import toast from "react-hot-toast";
import { resolveImageUrl } from "@/lib/utils";

export default function GuruSupervisedTab({ supervisedExtracurriculars = [], teacherName = "" }) {
  const [selectedEkskul, setSelectedEkskul] = useState(
    supervisedExtracurriculars.length > 0 ? supervisedExtracurriculars[0] : null
  );
  const [subTab, setSubTab] = useState("members"); // 'members' | 'pemilos' | 'settings'

  // Members state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchMember, setSearchMember] = useState("");

  // Pemilos candidates & execution state (for OSIS)
  const [candidatePairs, setCandidatePairs] = useState([]);
  const [pemilosLiveResults, setPemilosLiveResults] = useState(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});
  const [activeElectionId, setActiveElectionId] = useState(null);
  const [pemilosStartDate, setPemilosStartDate] = useState("");
  const [pemilosEndDate, setPemilosEndDate] = useState("");
  const [secretary1, setSecretary1] = useState("");
  const [secretary2, setSecretary2] = useState("");
  const [treasurer1, setTreasurer1] = useState("");
  const [treasurer2, setTreasurer2] = useState("");
  const [customDivisions, setCustomDivisions] = useState([]);
  const [isStartingPemilos, setIsStartingPemilos] = useState(false);
  const [isStoppingPemilos, setIsStoppingPemilos] = useState(false);

  // Settings state
  const [description, setDescription] = useState(selectedEkskul?.description || "");
  const [imageUrl, setImageUrl] = useState(selectedEkskul?.imageUrl || selectedEkskul?.ImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync selectedEkskul if props change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (supervisedExtracurriculars.length > 0 && !selectedEkskul) {
      setSelectedEkskul(supervisedExtracurriculars[0]);
    }
  }, [supervisedExtracurriculars, selectedEkskul]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
        setActiveElectionId(activeId);
        const [pairsRes, resultsRes] = await Promise.all([
          candidatePairService.getPairs(activeId),
          candidatePairService.getLiveResults(activeId).catch(() => null),
        ]);
        const items = pairsRes?.data?.items || pairsRes?.data || (Array.isArray(pairsRes) ? pairsRes : []);
        setCandidatePairs(items);

        const rawResults = resultsRes?.data ?? resultsRes;
        const resultsObj = rawResults?.data ?? rawResults ?? null;
        setPemilosLiveResults(resultsObj);

        // Pre-fill dates if available
        const currentElection = electionsList[0];
        if (currentElection.startDate) {
          try {
            setPemilosStartDate(new Date(currentElection.startDate).toISOString().slice(0, 16));
          } catch {}
        }
        if (currentElection.endDate) {
          try {
            setPemilosEndDate(new Date(currentElection.endDate).toISOString().slice(0, 16));
          } catch {}
        }

        // Parse cabinet structure json if exists
        const cabJson = currentElection.cabinetStructureJson || resultsObj?.cabinetStructureJson;
        if (cabJson) {
          try {
            const cabObj = typeof cabJson === "string" ? JSON.parse(cabJson) : cabJson;
            if (cabObj.secretary1) setSecretary1(cabObj.secretary1);
            if (cabObj.secretary2) setSecretary2(cabObj.secretary2);
            if (cabObj.treasurer1) setTreasurer1(cabObj.treasurer1);
            if (cabObj.treasurer2) setTreasurer2(cabObj.treasurer2);
            if (Array.isArray(cabObj.customDivisions)) {
              setCustomDivisions(cabObj.customDivisions.map((d, i) => ({ id: i + 1, name: d.divisionName, studentId: d.studentName })));
            }
          } catch {}
        }
      } else {
        setCandidatePairs([]);
        setPemilosLiveResults(null);
      }
    } catch (err) {
      console.error("Gagal memuat kandidat Pemilos:", err);
      setCandidatePairs([]);
      setPemilosLiveResults(null);
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedEkskul) {
      setDescription(selectedEkskul.description || "");
      setImageUrl(selectedEkskul.imageUrl || selectedEkskul.ImageUrl || null);
      setUploadError("");
      loadMembers();
      if (selectedEkskul.name?.toUpperCase().includes("OSIS")) {
        loadPemilosCandidates();
      }
    }
  }, [selectedEkskul, loadMembers, loadPemilosCandidates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUpdateMemberStatus = async (memberId, status) => {
    if (!selectedEkskul?.id) return;
    try {
      await extracurricularService.updateMemberStatus(selectedEkskul.id, memberId, status);
      toast.success(status === "Active" ? "Pendaftaran siswa berhasil disetujui!" : "Pendaftaran siswa ditolak.");
      loadMembers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui status keanggotaan.");
    }
  };

  const handleTeacherReviewPair = async (pairId, isApproved) => {
    try {
      const notes = reviewNotes[pairId] || (isApproved ? "Disetujui oleh Guru Pembina" : "Ditolak oleh Guru Pembina");
      await candidatePairService.teacherReviewPair(pairId, {
        isApproved,
        rejectionReason: notes,
        notes,
      });
      toast.success(isApproved ? "Candidate pair berhasil disetujui Pembina!" : "Candidate pair ditolak.");
      loadPemilosCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memproses verifikasi kandidat.");
    }
  };

  const handleStartPemilos = async () => {
    if (!activeElectionId) return;
    if (!pemilosStartDate || !pemilosEndDate) {
      toast.error("Silakan isi Tanggal Mulai dan Tanggal Selesai Pemilos terlebih dahulu.");
      return;
    }
    const approvedCount = candidatePairs.filter((p) => p.statusText === "Approved" || p.status === 5).length;
    if (approvedCount < 2) {
      toast.error("Pemilos membutuhkan minimal 2 pasangan kandidat yang disetujui untuk dapat dimulai.");
      return;
    }

    setIsStartingPemilos(true);
    try {
      const getStudentLabel = (val) => {
        if (!val) return "";
        const m = members.find((mem) => String(mem.studentId || mem.id) === String(val));
        return m ? `${m.studentName || m.name || val} (${m.className || ""})` : val;
      };

      const cabinetStructure = {
        secretary1: getStudentLabel(secretary1),
        secretary2: getStudentLabel(secretary2),
        treasurer1: getStudentLabel(treasurer1),
        treasurer2: getStudentLabel(treasurer2),
        customDivisions: customDivisions
          .filter((d) => d.name.trim())
          .map((d) => ({
            divisionName: d.name.trim(),
            studentName: getStudentLabel(d.studentId),
          })),
      };

      await candidatePairService.startPemilos(activeElectionId, {
        startDate: new Date(pemilosStartDate).toISOString(),
        endDate: new Date(pemilosEndDate).toISOString(),
        cabinetStructureJson: JSON.stringify(cabinetStructure),
      });

      toast.success("Pemilos resmi dimulai! Pemungutan suara telah dibuka.");
      loadPemilosCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal memulai Pemilos.");
    } finally {
      setIsStartingPemilos(false);
    }
  };

  const handleStopPemilos = async () => {
    if (!activeElectionId) return;
    if (!window.confirm("Apakah Anda yakin ingin menghentikan sesi Pemilos dan menyimpan hasil pemenang ke Struktur OSIS Baru?")) return;

    setIsStoppingPemilos(true);
    try {
      await candidatePairService.stopPemilos(activeElectionId);
      toast.success("Sesi Pemilos dihentikan & pemenang resmi ditetapkan ke Struktur OSIS Baru!");
      loadPemilosCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal menghentikan Pemilos.");
    } finally {
      setIsStoppingPemilos(false);
    }
  };

  const handleResetPemilos = async () => {
    if (!activeElectionId) return;
    if (!window.confirm("Apakah Anda yakin ingin mereset Pemilos dan mengarsipkan kepengurusan OSIS saat ini ke Generasi Sebelumnya?")) return;

    setIsStoppingPemilos(true);
    try {
      await electionService.resetPemilos(activeElectionId);
      toast.success("Pemilos direset untuk periode baru! Kepengurusan OSIS sebelumnya telah diarsipkan.");
      loadPemilosCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal mereset Pemilos.");
    } finally {
      setIsStoppingPemilos(false);
    }
  };

  const handleAddCustomDivision = () => {
    setCustomDivisions((prev) => [...prev, { id: Date.now(), name: "", studentId: "" }]);
  };

  const handleRemoveCustomDivision = (id) => {
    setCustomDivisions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCustomDivisionChange = (id, field, value) => {
    setCustomDivisions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCroppedImage = async (dataUrl, metadata) => {
    setIsUploading(true);
    setUploadError("");
    try {
      const fileToUpload = metadata?.croppedFile || (await fetch(dataUrl).then((r) => r.blob()).then((blob) => new File([blob], `cover-${Date.now()}.jpg`, { type: "image/jpeg" })));
      const uploadedUrl = await uploadImageToCloudinary(fileToUpload);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        toast.success("Gambar berhasil diunggah.");
      } else {
        setUploadError("Gagal mengunggah gambar. Silakan coba lagi.");
      }
    } catch (err) {
      setUploadError("Gagal mengunggah gambar. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCover = () => {
    setImageUrl(null);
    setUploadError("");
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
        imageUrl: imageUrl,
        maxMembers: selectedEkskul.maxMembers || 50,
        scheduleDay: selectedEkskul.scheduleDay || "Senin",
        scheduleTime: selectedEkskul.scheduleTime || "15:00 - 17:00",
        location: selectedEkskul.location || "Lapangan Sekolah",
        supervisorTeacherId: selectedEkskul.supervisorTeacherId || selectedEkskul.supervisor?.id || null,
        advisorName: selectedEkskul.advisorName || selectedEkskul.supervisor?.name || null,
        advisorWhatsapp: selectedEkskul.advisorWhatsapp || selectedEkskul.supervisor?.phoneNumber || null,
        isActive: selectedEkskul.isActive ?? true,
      });
      toast.success("Informasi ekskul berhasil diperbarui!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui ekskul.");
    } finally {
      setSavingSettings(false);
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
                                <img src={resolveImageUrl(m.photoUrl)} alt={m.studentName} className="w-full h-full object-cover" />
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
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${
                              m.status === "Pending" || m.status === "Menunggu"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : m.status === "Active" || m.status === "Aktif"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                              {m.status === "Pending" ? "Menunggu Persetujuan" : m.status || "Aktif"}
                            </span>

                            {(m.status === "Pending" || m.status === "Menunggu") && (
                              <div className="flex gap-1.5 ml-2">
                                <button
                                  onClick={() => handleUpdateMemberStatus(m.id || m.studentId, "Active")}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer"
                                  title="Setujui Pendaftaran"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleUpdateMemberStatus(m.id || m.studentId, "Removed")}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer"
                                  title="Tolak Pendaftaran"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
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

          {/* Summary Perolehan Suara Pemilos (Khusus Pembina OSIS) */}
          {pemilosLiveResults && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  <Vote className="w-5 h-5 text-indigo-600" />
                  <span>Summary Real-Time Perolehan Suara Pemilos</span>
                </h4>
                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {pemilosLiveResults.totalVotesCast || 0} Suara Masuk ({pemilosLiveResults.participationRate || 0}%)
                </span>
              </div>

              {/* Grid Summary Per Kandidat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(pemilosLiveResults.rankings || []).map((pair, idx) => (
                  <div key={pair.id || idx} className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-blue-50/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-lg">
                        Pasangan #{pair.candidateNumber}
                      </span>
                      <span className="text-sm font-black text-gray-900">
                        {pair.voteCount} Suara ({pair.votePercentage}%)
                      </span>
                    </div>
                    <p className="font-extrabold text-gray-900 text-sm truncate">
                      {pair.chairmanName} {pair.viceName ? `& ${pair.viceName}` : ""}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tabel Detail Audit Siswa Pemilih (Nama, Kelas, dan Pilihan Kandidat) */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <h5 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Audit Pemilih (Detail Pilihan Kandidat Siswa)</span>
                </h5>
                {!pemilosLiveResults.recentVoters || pemilosLiveResults.recentVoters.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada siswa yang memilih.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-600 font-bold uppercase sticky top-0">
                        <tr>
                          <th className="p-2.5">Siswa</th>
                          <th className="p-2.5">Kelas</th>
                          <th className="p-2.5">Waktu</th>
                          <th className="p-2.5">Kandidat Pilihan (Akses Pembina)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pemilosLiveResults.recentVoters.map((v, i) => (
                          <tr key={v.voterUserId || i} className="hover:bg-white transition">
                            <td className="p-2.5 font-bold text-gray-900">{v.studentName}</td>
                            <td className="p-2.5 text-gray-600 font-medium">{v.className || "-"}</td>
                            <td className="p-2.5 text-gray-500">
                              {new Date(v.votedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="p-2.5 font-extrabold text-indigo-700">
                              {v.votedCandidateTitle || `Pasangan No. ${v.votedCandidateNumber}`}
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

          {/* Kontrol Pelaksanaan & Pengurus OSIS */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#2c1ee8]" />
                  <span>Pengaturan Pelaksanaan Pemilos & Struktur Pengurus OSIS</span>
                </h4>
                <p className="text-xs text-slate-500">Tentukan jadwal voting, pengurus OSIS pendukung, dan jalankan pemungutan suara.</p>
              </div>

              {pemilosLiveResults?.status === 1 || pemilosLiveResults?.status === "Open" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Pemilos Sedang Berlangsung (OPEN)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
                  Sesi Belum Dijalankan
                </span>
              )}
            </div>

            {/* Form Tanggal & Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal & Waktu Mulai Pemilos *</label>
                <input
                  type="datetime-local"
                  value={pemilosStartDate}
                  onChange={(e) => setPemilosStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#2c1ee8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal & Waktu Selesai Pemilos *</label>
                <input
                  type="datetime-local"
                  value={pemilosEndDate}
                  onChange={(e) => setPemilosEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#2c1ee8]"
                />
              </div>
            </div>

            {/* Form Jabatan Pengurus OSIS Pendukung */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Penentuan Jabatan Pengurus OSIS Pendukung</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sekretaris 1 */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Sekretaris 1</label>
                  <select
                    value={secretary1}
                    onChange={(e) => setSecretary1(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="">-- Pilih Siswa Sekretaris 1 --</option>
                    {members.map((m) => (
                      <option key={m.id || m.studentId} value={m.studentId || m.id}>
                        {m.studentName || m.name} ({m.className || "Siswa"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sekretaris 2 */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Sekretaris 2</label>
                  <select
                    value={secretary2}
                    onChange={(e) => setSecretary2(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="">-- Pilih Siswa Sekretaris 2 --</option>
                    {members.map((m) => (
                      <option key={m.id || m.studentId} value={m.studentId || m.id}>
                        {m.studentName || m.name} ({m.className || "Siswa"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bendahara 1 */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Bendahara 1</label>
                  <select
                    value={treasurer1}
                    onChange={(e) => setTreasurer1(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="">-- Pilih Siswa Bendahara 1 --</option>
                    {members.map((m) => (
                      <option key={m.id || m.studentId} value={m.studentId || m.id}>
                        {m.studentName || m.name} ({m.className || "Siswa"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bendahara 2 */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Bendahara 2</label>
                  <select
                    value={treasurer2}
                    onChange={(e) => setTreasurer2(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="">-- Pilih Siswa Bendahara 2 --</option>
                    {members.map((m) => (
                      <option key={m.id || m.studentId} value={m.studentId || m.id}>
                        {m.studentName || m.name} ({m.className || "Siswa"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Divisi Tambahan */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Divisi Tambahan (Opsional)</span>
                  <button
                    type="button"
                    onClick={handleAddCustomDivision}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Divisi</span>
                  </button>
                </div>

                {customDivisions.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
                    <input
                      type="text"
                      placeholder="Nama Divisi (misal: Divisi Humas)..."
                      value={item.name}
                      onChange={(e) => handleCustomDivisionChange(item.id, "name", e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white"
                    />
                    <select
                      value={item.studentId}
                      onChange={(e) => handleCustomDivisionChange(item.id, "studentId", e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white"
                    >
                      <option value="">-- Pilih Anggota Divisi --</option>
                      {members.map((m) => (
                        <option key={m.id || m.studentId} value={m.studentId || m.id}>
                          {m.studentName || m.name} ({m.className || "Siswa"})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDivision(item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Buttons: 3-Phase Pemilos Loop Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                {pemilosLiveResults?.status === 2 || pemilosLiveResults?.status === "Closed" ? (
                  <span className="text-purple-700 font-bold">🎉 Pemilos Selesai! Pengurus OSIS baru telah tersimpan & aktif di Struktur OSIS.</span>
                ) : candidatePairs.filter((p) => p.statusText === "Approved" || p.status === 5).length < 2 ? (
                  <span className="text-amber-600 font-bold">⚠️ Butuh minimal 2 paslon disetujui (Approved) untuk dapat memulai Pemilos.</span>
                ) : (
                  <span className="text-emerald-600 font-bold">✓ Kuota minimal paslon terpenuhi. Pemilos siap dimulai.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {pemilosLiveResults?.status === 2 || pemilosLiveResults?.status === "Closed" ? (
                  <button
                    onClick={handleResetPemilos}
                    disabled={isStoppingPemilos}
                    className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isStoppingPemilos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>🔄 Ganti Struktur OSIS & Mulai Pemilos Periode Baru</span>
                  </button>
                ) : pemilosLiveResults?.status === 1 || pemilosLiveResults?.status === "Open" ? (
                  <button
                    onClick={handleStopPemilos}
                    disabled={isStoppingPemilos}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isStoppingPemilos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    <span>🛑 Stop dan Simpan Hasil Pemilos</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartPemilos}
                    disabled={isStartingPemilos || candidatePairs.filter((p) => p.statusText === "Approved" || p.status === 5).length < 2 || !pemilosStartDate || !pemilosEndDate}
                    className="px-6 py-2.5 rounded-2xl bg-[#2c1ee8] hover:bg-blue-700 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isStartingPemilos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Vote className="w-4 h-4" />}
                    <span>🚀 Mulai Pemilos</span>
                  </button>
                )}
              </div>
            </div>
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
                            {pair.photoUrl ? <img src={resolveImageUrl(pair.photoUrl)} alt="Ketua" className="w-full h-full object-cover" /> : pair.chairmanName?.[0]}
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
                              {pair.vicePhotoUrl ? <img src={resolveImageUrl(pair.vicePhotoUrl)} alt="Wakil" className="w-full h-full object-cover" /> : pair.viceName?.[0]}
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
                        &quot;{pair.vision || "Belum mengisi visi"}&quot;
                      </p>
                    </div>

                    {/* Status / Review Actions */}
                    {pair.statusText === "Approved" || pair.status === 5 ? (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Disetujui Pembina (Resmi Terdaftar)</span>
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">Paslon #{pair.candidateNumber}</span>
                      </div>
                    ) : pair.statusText === "Rejected" || pair.status === 3 ? (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                        <X className="w-4 h-4 text-rose-600" />
                        <span>Ditolak Pembina {pair.rejectionReason ? `(${pair.rejectionReason})` : ""}</span>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
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

            {/* Cover Image Upload & Crop (16:9) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200/80">
              <ImageCropUploader
                label="Foto Cover Unit Binaan (Rasio 16:9)"
                defaultAspectRatio="16:9"
                initialImageUrl={imageUrl}
                onCropped={handleCroppedImage}
                onRemove={handleRemoveCover}
                isUploading={isUploading}
                uploadError={uploadError}
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
              disabled={savingSettings || isUploading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2c1ee8] text-white text-xs sm:text-sm font-extrabold hover:bg-blue-700 transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{savingSettings ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
