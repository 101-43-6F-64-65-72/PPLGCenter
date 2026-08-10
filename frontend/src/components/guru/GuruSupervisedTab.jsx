"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Award, Users, ShieldCheck, Search, Check, X, Settings, RefreshCw, Vote, Plus, AlertCircle
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
  const [currentElection, setCurrentElection] = useState(null);
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
        const curElec = electionsList[0];
        setActiveElectionId(activeId);
        setCurrentElection(curElec);

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
        if (curElec.startDate) {
          try {
            setPemilosStartDate(new Date(curElec.startDate).toISOString().slice(0, 16));
          } catch {}
        }
        if (curElec.endDate) {
          try {
            setPemilosEndDate(new Date(curElec.endDate).toISOString().slice(0, 16));
          } catch {}
        }

        // Parse cabinet structure json if exists
        const cabJson = curElec.cabinetStructureJson || resultsObj?.cabinetStructureJson;
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
        setCurrentElection(null);
      }
    } catch (err) {
      console.error("Gagal memuat kandidat Pemilos:", err);
      setCandidatePairs([]);
      setPemilosLiveResults(null);
      setCurrentElection(null);
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

  // Strict 3-State Machine Calculations
  const electionStatus = currentElection?.status ?? pemilosLiveResults?.status;
  const hasCabStructure = !!(currentElection?.cabinetStructureJson || pemilosLiveResults?.cabinetStructureJson);
  const isClosed = electionStatus === 2 || electionStatus === "Closed" || currentElection?.statusText === "Closed";
  const isOngoing = !isClosed && (electionStatus === 1 || electionStatus === "Open" || currentElection?.statusText === "Open") && hasCabStructure;
  const pemilosState = isClosed ? "CLOSED" : isOngoing ? "ONGOING" : "SETUP";

  const approvedPairsCount = candidatePairs.filter((p) => p.statusText === "Approved" || p.status === 5).length;
  const isStartDisabled = isStartingPemilos || approvedPairsCount < 2 || !pemilosStartDate || !pemilosEndDate;

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
                                >
                                  <Check className="w-3.5 h-3.5" /> Setujui
                                </button>
                                <button
                                  onClick={() => handleUpdateMemberStatus(m.id || m.studentId, "Removed")}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Tolak
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
          STRICT 3-STATE MACHINE: SETUP -> ONGOING -> CLOSED
      ════════════════════════════════════════ */}
      {subTab === "pemilos" && isOsis && (
        <div className="space-y-6 font-sans">
          {/* ═════════════════════════════════════════════════════════════════
              STATE 1: SETUP PHASE (PEMILOS BELUM DIMULAI / DRAFT / SETUP)
          ═════════════════════════════════════════════════════════════════ */}
          {pemilosState === "SETUP" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white space-y-2 shadow-lg">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-xs font-extrabold border border-white/10">
                  <Vote className="w-4 h-4 text-amber-300" />
                  <span>Fase 1: Persiapan & Setting Pemilos (SETUP)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Persiapan Pelaksanaan Pemilos & Penunjukan Pengurus</h3>
                <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
                  Setujui pasangan kandidat (minimal 2 paslon), tentukan jadwal pelaksanaan, dan tunjuk Sekretaris serta Bendahara sebelum memulai pemungutan suara.
                </p>
              </div>

              {/* Form Settings Jadwal & Pengurus OSIS */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-black text-gray-900 text-base flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[#2c1ee8]" />
                      <span>Pengaturan Jadwal & Struktur Pendukung OSIS</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">Lengkapi tanggal dan pejabat pendukung sebelum menekan tombol Mulai Pemilos.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Status: Belum Dimulai (SETUP)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal & Waktu Mulai Pemilos *</label>
                    <input
                      type="datetime-local"
                      value={pemilosStartDate}
                      onChange={(e) => setPemilosStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2c1ee8] bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal & Waktu Selesai Pemilos *</label>
                    <input
                      type="datetime-local"
                      value={pemilosEndDate}
                      onChange={(e) => setPemilosEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#2c1ee8] bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h5 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Penunjukan Jabatan Sekretaris & Bendahara</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Sekretaris 1</label>
                      <select
                        value={secretary1}
                        onChange={(e) => setSecretary1(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white"
                      >
                        <option value="">-- Pilih Siswa Sekretaris 1 --</option>
                        {members.map((m) => (
                          <option key={m.id || m.studentId} value={m.studentId || m.id}>
                            {m.studentName || m.name} ({m.className || "Siswa"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Sekretaris 2</label>
                      <select
                        value={secretary2}
                        onChange={(e) => setSecretary2(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white"
                      >
                        <option value="">-- Pilih Siswa Sekretaris 2 --</option>
                        {members.map((m) => (
                          <option key={m.id || m.studentId} value={m.studentId || m.id}>
                            {m.studentName || m.name} ({m.className || "Siswa"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Bendahara 1</label>
                      <select
                        value={treasurer1}
                        onChange={(e) => setTreasurer1(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white"
                      >
                        <option value="">-- Pilih Siswa Bendahara 1 --</option>
                        {members.map((m) => (
                          <option key={m.id || m.studentId} value={m.studentId || m.id}>
                            {m.studentName || m.name} ({m.className || "Siswa"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Bendahara 2</label>
                      <select
                        value={treasurer2}
                        onChange={(e) => setTreasurer2(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white"
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

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 uppercase">Divisi Tambahan (Opsional)</span>
                      <button
                        type="button"
                        onClick={handleAddCustomDivision}
                        className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Divisi</span>
                      </button>
                    </div>
                    {customDivisions.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <input
                          type="text"
                          placeholder="Nama Divisi (misal: Divisi Humas)..."
                          value={item.name}
                          onChange={(e) => handleCustomDivisionChange(item.id, "name", e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                        <select
                          value={item.studentId}
                          onChange={(e) => handleCustomDivisionChange(item.id, "studentId", e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
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
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-medium">
                    {approvedPairsCount < 2 ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Butuh minimal 2 paslon disetujui (Approved) untuk dapat memulai Pemilos.
                      </span>
                    ) : !pemilosStartDate || !pemilosEndDate ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Silakan tentukan Tanggal Mulai dan Tanggal Selesai terlebih dahulu.
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Kuota paslon & tanggal terpenuhi. Pemilos siap dimulai.
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleStartPemilos}
                    disabled={isStartDisabled}
                    className="px-6 py-3 rounded-2xl bg-[#2c1ee8] hover:bg-blue-700 text-white text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isStartingPemilos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Vote className="w-4 h-4" />}
                    <span>🚀 Mulai Pemilos</span>
                  </button>
                </div>
              </div>

              {/* Tabel Approval Candidate Pairs */}
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

                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
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
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase block">Calon Wakil</span>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                                {pair.vicePhotoUrl ? <img src={resolveImageUrl(pair.vicePhotoUrl)} alt="Wakil" className="w-full h-full object-cover" /> : pair.viceName?.[0]}
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900 text-xs leading-tight">{pair.viceName || "Belum ada"}</p>
                                <p className="text-[10px] text-gray-400">{pair.viceClass || "Siswa"}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2 border-t border-gray-100">
                          <button
                            onClick={() => handleTeacherReviewPair(pair.id, true)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Setujui (Approve)
                          </button>
                          <button
                            onClick={() => handleTeacherReviewPair(pair.id, false)}
                            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak (Reject)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              STATE 2: ONGOING PHASE (PEMILOS SEDANG BERLANGSUNG / VOTING)
          ═════════════════════════════════════════════════════════════════ */}
          {pemilosState === "ONGOING" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 rounded-3xl text-white space-y-2 shadow-lg">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-extrabold border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Fase 2: Pemilos Sedang Berlangsung (ONGOING)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Pemungutan Suara E-Voting Sedang Aktif</h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                  Siswa sedang dapat melakukan pemungutan suara secara langsung di bilik voting. Pantau perolehan suara secara real-time di bawah ini.
                </p>
              </div>

              {pemilosLiveResults && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                      <Vote className="w-5 h-5 text-emerald-600" />
                      <span>Live Monitor Perolehan Suara Pemilos</span>
                    </h4>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {pemilosLiveResults.totalVotesCast || 0} Suara Masuk ({pemilosLiveResults.participationRate || 0}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(pemilosLiveResults.rankings || []).map((pair, idx) => (
                      <div key={pair.id || idx} className="p-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg">
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

                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <h5 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Audit Pemilih Siswa (Real-Time)</span>
                    </h5>
                    {!pemilosLiveResults.recentVoters || pemilosLiveResults.recentVoters.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Belum ada siswa yang memberikan suara.</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/50">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-100 text-gray-600 font-bold uppercase sticky top-0">
                            <tr>
                              <th className="p-2.5">Siswa</th>
                              <th className="p-2.5">Kelas</th>
                              <th className="p-2.5">Waktu</th>
                              <th className="p-2.5">Kandidat Pilihan</th>
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
                                <td className="p-2.5 font-extrabold text-emerald-700">
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

              <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                <div className="text-xs text-gray-600 font-medium">
                  <p className="font-bold text-gray-900 text-sm">Hentikan dan Tetapkan Hasil?</p>
                  <p>Voting akan ditutup dan pemenang otomatis diangkat sebagai Kepengurusan OSIS Baru.</p>
                </div>
                <button
                  onClick={handleStopPemilos}
                  disabled={isStoppingPemilos}
                  className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isStoppingPemilos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  <span>🛑 Stop & Simpan Hasil Pemilos</span>
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              STATE 3: CLOSED PHASE (PEMILOS SELESAI & DITETAPKAN / CLOSED)
          ═════════════════════════════════════════════════════════════════ */}
          {pemilosState === "CLOSED" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-6 sm:p-8 rounded-3xl text-white space-y-3 shadow-lg">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-xs font-extrabold border border-white/10">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Fase 3: Selesai & Ditetapkan (CLOSED)</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">🎉 Pemilos Selesai & Pengurus OSIS Baru Ditetapkan!</h3>
                <p className="text-xs sm:text-sm text-purple-100 max-w-2xl leading-relaxed">
                  Sesi pemungutan suara telah ditutup. Pasangan calon suara terbanyak beserta susunan Sekretaris, Bendahara, dan Divisi pendukung telah ditetapkan sebagai **Struktur OSIS Aktif Masa Bakti Saat Ini**.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="font-black text-gray-900 text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2c1ee8]" />
                    <span>Ringkasan Struktur Kepengurusan OSIS Masa Bakti Saat Ini</span>
                  </h4>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                    Status: Aktif Masa Bakti
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pemilosLiveResults?.winnerPair && (
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                      <span className="text-[11px] font-extrabold text-indigo-700 uppercase block">Ketua & Wakil Ketua OSIS Terpilih</span>
                      <p className="font-black text-gray-900 text-sm">
                        {pemilosLiveResults.winnerPair.chairmanName} & {pemilosLiveResults.winnerPair.viceName}
                      </p>
                      <p className="text-xs text-indigo-600 font-bold">Pemenang Pemilos ({pemilosLiveResults.winnerPair.voteCount} Suara)</p>
                    </div>
                  )}
                  {secretary1 && (
                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                      <span className="text-[11px] font-extrabold text-blue-700 uppercase block">Sekretaris 1</span>
                      <p className="font-black text-gray-900 text-sm">{secretary1}</p>
                    </div>
                  )}
                  {secretary2 && (
                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                      <span className="text-[11px] font-extrabold text-blue-700 uppercase block">Sekretaris 2</span>
                      <p className="font-black text-gray-900 text-sm">{secretary2}</p>
                    </div>
                  )}
                  {treasurer1 && (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                      <span className="text-[11px] font-extrabold text-emerald-700 uppercase block">Bendahara 1</span>
                      <p className="font-black text-gray-900 text-sm">{treasurer1}</p>
                    </div>
                  )}
                  {treasurer2 && (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                      <span className="text-[11px] font-extrabold text-emerald-700 uppercase block">Bendahara 2</span>
                      <p className="font-black text-gray-900 text-sm">{treasurer2}</p>
                    </div>
                  )}
                  {customDivisions.map((d, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                      <span className="text-[11px] font-extrabold text-purple-700 uppercase block">{d.name}</span>
                      <p className="font-black text-gray-900 text-sm">{d.studentId || "Anggota Divisi"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-amber-200 bg-amber-50/30 flex items-center justify-between shadow-sm">
                <div className="text-xs text-amber-900 space-y-0.5">
                  <p className="font-black text-sm">Ganti Pengurus OSIS & Start Periode Pemilos Baru?</p>
                  <p className="text-amber-800">Pengurus saat ini akan diarsipkan ke <strong className="font-bold">Generasi OSIS Sebelumnya</strong> dan data Pemilos di-reset ke Fase 1 (SETUP).</p>
                </div>
                <button
                  onClick={handleResetPemilos}
                  disabled={isStoppingPemilos}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isStoppingPemilos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>🔄 Ganti Struktur OSIS & Mulai Periode Baru</span>
                </button>
              </div>
            </div>
          )}
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
