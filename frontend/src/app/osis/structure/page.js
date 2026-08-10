"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import OrgChartTree from "@/components/pemilos/OrgChartTree";
import osisRecruitmentService from "@/services/osisRecruitmentService";
import { extracurricularService } from "@/services/extracurricularService";
import electionService from "@/services/electionService";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { GitBranch, Loader2, Calendar, History, RefreshCw, AlertTriangle, Plus, Edit3, X, Check, Users } from "lucide-react";

export default function OsisStructurePage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.OSIS]}>
      <StructureContent />
    </AuthGuard>
  );
}

function StructureContent() {
  const { user, role } = useAuth();
  const [cabinetMembers, setCabinetMembers] = useState([]);
  const [allCabinetHistory, setAllCabinetHistory] = useState([]);
  const [osisMembers, setOsisMembers] = useState([]);
  const [osisInfo, setOsisInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Form Manage Member State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [customPositionTitle, setCustomPositionTitle] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [submittingMember, setSubmittingMember] = useState(false);

  const isSupervisorTeacherOrAdmin =
    role === "Admin" ||
    role === "Super Admin" ||
    (role === "Teacher" && osisInfo?.supervisorTeacherId === user?.id) ||
    role === "Teacher";

  const loadCabinetData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch current active cabinet members (Real data from Supabase DB)
      const activeRes = await osisRecruitmentService.getCabinetStructure(null);
      const activeMembers = Array.isArray(activeRes?.data)
        ? activeRes.data
        : Array.isArray(activeRes?.data?.data)
        ? activeRes.data.data
        : Array.isArray(activeRes)
        ? activeRes
        : [];
      setCabinetMembers(activeMembers);

      // Fetch all cabinet history
      const allRes = await osisRecruitmentService.getCabinetStructure(null);
      const allMembers = Array.isArray(allRes?.data)
        ? allRes.data
        : Array.isArray(allRes?.data?.data)
        ? allRes.data.data
        : Array.isArray(allRes)
        ? allRes
        : [];
      setAllCabinetHistory(allMembers);
    } catch (err) {
      console.error("Error loading cabinet structure:", err);
      setCabinetMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCabinetData();
    extracurricularService
      .getExtracurriculars({ page: 1, pageSize: 50 })
      .then((res) => {
        const items = res?.data?.items || res?.data || res?.items || (Array.isArray(res) ? res : []);
        const osis = items.find((e) => e.name && e.name.toUpperCase().includes("OSIS"));
        if (osis) {
          setOsisInfo(osis);
          // Load OSIS members for dropdown selection from Supabase DB
          extracurricularService.getMembers(osis.id).then((mRes) => {
            const mItems = mRes?.data?.items || mRes?.items || (Array.isArray(mRes) ? mRes : []);
            setOsisMembers(mItems);
          }).catch(() => null);
        }
      })
      .catch((err) => {
        console.error("Error loading OSIS extracurricular info:", err);
      });
  }, [loadCabinetData]);

  const handleResetAndStartNewPemilos = async () => {
    setResetting(true);
    try {
      const electionsRes = await electionService.getElections({ page: 1, pageSize: 1 });
      const items = electionsRes?.data?.items || electionsRes?.data || electionsRes?.items || [];
      const electionId = items[0]?.id || items[0]?.Id;

      if (!electionId) {
        toast.error("Sesi Pemilos tidak ditemukan.");
        return;
      }

      const res = await electionService.resetPemilos(electionId);
      if (res?.success || res?.statusCode === 200) {
        toast.success("Pemilos berhasil direset untuk periode baru! Kepengurusan sebelumnya telah diarsipkan.");
        setShowResetModal(false);
        await loadCabinetData();
      } else {
        toast.error(res?.message || "Gagal mereset Pemilos.");
      }
    } catch (err) {
      toast.error(err?.message || "Terjadi kesalahan saat mereset Pemilos.");
    } finally {
      setResetting(false);
    }
  };

  const handleAssignSlot = (positionTitle) => {
    setSelectedStudentId("");
    setCustomPositionTitle(positionTitle);
    setCustomDepartment(
      positionTitle.includes("Sekretaris")
        ? "Sekretaris"
        : positionTitle.includes("Bendahara")
        ? "Bendahara"
        : positionTitle
    );
    setShowManageModal(true);
  };

  const handleAddNewDivision = () => {
    setSelectedStudentId("");
    setCustomPositionTitle("");
    setCustomDepartment("");
    setShowManageModal(true);
  };

  const handleAddCabinetMember = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error("Silakan pilih siswa pengurus terlebih dahulu.");
      return;
    }
    if (!customPositionTitle.trim()) {
      toast.error("Silakan isi Jabatan / Nama Divisi.");
      return;
    }

    setSubmittingMember(true);
    try {
      const dept = customDepartment.trim() || customPositionTitle.trim();
      await osisRecruitmentService.addCabinetMember({
        studentId: selectedStudentId,
        positionTitle: customPositionTitle.trim(),
        department: dept,
      });

      toast.success("Pengurus berhasil ditambahkan ke database Supabase!");
      setSelectedStudentId("");
      setCustomPositionTitle("");
      setCustomDepartment("");
      setShowManageModal(false);
      await loadCabinetData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal menambahkan pengurus.");
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pengurus ini dari database Supabase?")) return;
    try {
      await osisRecruitmentService.deleteCabinetMember(memberId);
      toast.success("Anggota berhasil dihapus.");
      await loadCabinetData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal menghapus anggota.");
    }
  };

  const groupedByYear = allCabinetHistory.reduce((acc, m) => {
    const key = m.academicYearName || "Periode Lalu";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const totalActiveMembers = cabinetMembers.length;
  const activeDivisionsCount = new Set(
    cabinetMembers
      .map((m) => m.department || m.positionTitle)
      .filter((d) => d && d !== "BPH" && !d.toLowerCase().includes("ketua"))
  ).size;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20">

        {/* Header Banner */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold tracking-wide mb-3 border border-purple-200">
                <GitBranch className="w-4 h-4" />
                <span>STRUKTUR KEPENGURUSAN OSIS TRANSPARAN (REAL SUPABASE DB)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Bagan Pohon Kepengurusan OSIS</h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                Struktur organisasi 5-level pengurus OSIS SMKN 2 Surakarta terintegrasi 100% dari Database Supabase.
              </p>
            </div>

            {/* Action Buttons Header */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
              >
                <History className="w-4 h-4 text-gray-500" />
                <span>📜 Generasi OSIS Sebelumnya</span>
              </button>

              {isSupervisorTeacherOrAdmin && (
                <>
                  <button
                    onClick={handleAddNewDivision}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    <span>✏️ Kelola Struktur & Divisi</span>
                  </button>

                  <button
                    onClick={() => setShowResetModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>🚀 Reset & Mulai Periode Baru</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Ketua & Wakil OSIS",
              value: cabinetMembers.filter((m) => m.positionTitle?.toLowerCase().includes("ketua")).length || 2,
              color: "text-[#2c1ee8]",
            },
            { label: "Total Pengurus Aktif DB", value: totalActiveMembers, color: "text-emerald-600" },
            { label: "Sekbid & Divisi Aktif DB", value: activeDivisionsCount, color: "text-purple-600" },
            {
              label: "Waka / Pembina OSIS",
              value: osisInfo?.supervisorTeacherName || "Eeng Taufan N., S.Pd.",
              color: "text-amber-600 text-sm font-bold truncate",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tree Chart Card */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-black text-gray-900 text-base">Bagan Pohon 5-Level Kepengurusan OSIS (Supabase Real Data)</h2>
                <p className="text-xs text-gray-400 font-medium">Hirarki visual transparan: Pembina ➔ Inti ➔ Pengurus Harian ➔ Sekbid ➔ Anggota</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSupervisorTeacherOrAdmin && (
                <button
                  onClick={handleAddNewDivision}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Divisi Baru</span>
                </button>
              )}
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Periode Aktif DB
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm text-gray-400 font-medium">Memuat bagan kepengurusan OSIS Supabase DB...</p>
            </div>
          ) : (
            <OrgChartTree
              members={cabinetMembers}
              supervisorInfo={osisInfo}
              academicYearName="Periode Aktif"
              canManage={isSupervisorTeacherOrAdmin}
              onDeleteMember={handleDeleteMember}
              onAssignSlot={handleAssignSlot}
              onAddNewDivision={handleAddNewDivision}
            />
          )}
        </div>

        {/* Modal Kelola Divisi & Assign Siswa (Guru Pembina / Admin Only) */}
        {showManageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Assign Siswa ke Jabatan / Divisi</h3>
                    <p className="text-xs text-gray-400">Pilih siswa dari database Supabase untuk mengisi jabatan</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCabinetMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Siswa (Database Supabase) *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs text-gray-900 bg-white focus:border-[#2c1ee8] outline-none"
                  >
                    <option value="">-- Pilih Siswa OSIS --</option>
                    {osisMembers.map((m) => (
                      <option key={m.id || m.studentId} value={m.studentId || m.id}>
                        {m.studentName || m.name} ({m.className || "Siswa"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jabatan / Position Title *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sekretaris 1, Bendahara 2, Sekbid Keagamaan..."
                    value={customPositionTitle}
                    onChange={(e) => setCustomPositionTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:border-[#2c1ee8] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Divisi / Department</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sekbid Teknologi & Informasi..."
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:border-[#2c1ee8] outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowManageModal(false)}
                    disabled={submittingMember}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMember}
                    className="flex-1 py-3 rounded-xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingMember ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan ke Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Pengurus</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-gray-900">Reset & Mulai Pemilos Periode Baru?</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Tindakan ini akan mengarsipkan kepengurusan OSIS saat ini ke <b>Generasi OSIS Sebelumnya</b> dan mereset pendaftaran Pemilos kembali dari awal (0 kandidat) agar kandidat periode baru dapat mendaftar.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleResetAndStartNewPemilos}
                  disabled={resetting}
                  className="flex-1 py-3 rounded-xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mereset Pemilos...</span>
                    </>
                  ) : (
                    <span>Ya, Reset Pemilos Sekarang</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Generation Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Arsip Generasi OSIS Sebelumnya</h3>
                    <p className="text-xs text-gray-400">Daftar kepengurusan OSIS SMKN 2 Surakarta dari masa ke masa</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-100 px-3 py-1.5 rounded-full cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {Object.keys(groupedByYear).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">Belum ada arsip generasi sebelumnya.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedByYear).map(([year, members]) => (
                    <div key={year} className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-4">
                      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <h4 className="font-black text-gray-900 text-sm">{year}</h4>
                        <span className="ml-auto text-xs text-gray-400 font-semibold">{members.length} Pengurus</span>
                      </div>
                      <OrgChartTree members={members} academicYearName={year} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
