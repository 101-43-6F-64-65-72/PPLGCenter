"use client";

import React, { useState, useEffect } from "react";
import classTreeService from "@/services/classTreeService";
import schoolClassService from "@/services/schoolClassService";
import userService from "@/services/userService";
import { X, UserCheck, Loader2, AlertCircle, Shield } from "lucide-react";

export default function AssignPositionModal({
  isOpen,
  onClose,
  schoolClass,
  positionName,
  positionType, // "WaliKelas" | "StudentPosition" | "Division"
  divisionId = null,
  currentLeadership,
  onSuccess,
}) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && schoolClass?.id) {
      fetchCandidates();
    }
  }, [isOpen, schoolClass, positionType]);

  const fetchCandidates = async () => {
    setIsLoadingCandidates(true);
    setErrorMsg("");
    try {
      if (positionType === "WaliKelas") {
        const res = await userService.getTeachers();
        const rawData = res?.data ?? res;
        const list = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.items) ? rawData.items : [];
        setCandidates(list);
        if (schoolClass?.homeroomTeacherId) {
          setSelectedCandidateId(schoolClass.homeroomTeacherId);
        } else if (list.length > 0) {
          setSelectedCandidateId(list[0].id || list[0].Id);
        }
      } else {
        const res = await userService.getUsers({ classId: schoolClass.id, role: "Student", pageSize: 100 });
        const rawData = res?.data ?? res;
        let list = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.items) ? rawData.items : [];
        
        // Strict client-side filter by selected class ID and sort by NIS ascending (Absen 1 to 36)
        list = list
          .filter((s) => String(s.classId || s.ClassId || "") === String(schoolClass.id))
          .sort((a, b) => String(a.nis || a.NIS || a.fullName).localeCompare(String(b.nis || b.NIS || b.fullName)));
        
        setCandidates(list);
        if (list.length > 0) {
          setSelectedCandidateId(list[0].id || list[0].Id);
        }
      }
    } catch (err) {
      console.error("Failed to load candidates:", err);
      setErrorMsg("Gagal memuat data kandidat untuk posisi ini.");
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId || !schoolClass?.id) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (positionType === "WaliKelas") {
        // Update HomeroomTeacherId on SchoolClass directly via PUT /api/classes/{id}
        await schoolClassService.update(schoolClass.id, {
          ...schoolClass,
          homeroomTeacherId: selectedCandidateId,
        });
      } else {
        // For all student positions (Ketua, Wakil, Sekretaris, Bendahara, Seksi):
        if (divisionId) {
          await classTreeService.updateDivision(divisionId, {
            name: positionName,
            leaderStudentId: selectedCandidateId,
            schoolClassId: schoolClass.id,
          });
        } else {
          await classTreeService.createDivision({
            schoolClassId: schoolClass.id,
            name: positionName,
            leaderStudentId: selectedCandidateId,
          });
        }

        // If assigning Ketua Kelas, also sync ClassLeadership endpoint if possible
        if (positionName.toLowerCase().includes("ketua kelas") && !positionName.toLowerCase().includes("wakil")) {
          try {
            await classTreeService.appointLeadership({
              schoolClassId: schoolClass.id,
              homeroomTeacherId: schoolClass.homeroomTeacherId || "00000000-0000-0000-0000-000000000000",
              classLeaderStudentId: selectedCandidateId,
              academicYearId: schoolClass.academicYearId || currentLeadership?.academicYearId || "00000000-0000-0000-0000-000000000000",
            });
          } catch (err) {
            // Ignore if ClassLeadership requirement is strict, division is already updated
            console.warn("ClassLeadership sync notice:", err?.message);
          }
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to assign position:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal menyimpan penugasan posisi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tetapkan {positionName}</h3>
              <p className="text-xs text-slate-400">Kelas {schoolClass?.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Pilih {positionType === "WaliKelas" ? "Guru Wali Kelas" : "Siswa Pengisi Posisi"}:
            </label>

            {isLoadingCandidates ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Memuat daftar kandidat...</span>
              </div>
            ) : candidates.length === 0 ? (
              <p className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-400 text-center">
                Tidak ada data terdaftar untuk kelas {schoolClass?.name}.
              </p>
            ) : (
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-indigo-500 font-medium"
              >
                {candidates.map((c, idx) => {
                  const cId = c.id || c.Id;
                  const name = c.fullName || c.FullName || c.name;
                  const identifier = c.nip || c.NIP || c.nis || c.NIS || "";
                  return (
                    <option key={cId} value={cId}>
                      {positionType === "WaliKelas" ? `${name} (${identifier})` : `No. ${idx + 1} - ${name} (${identifier})`}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingCandidates || candidates.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              <span>Simpan Penugasan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
