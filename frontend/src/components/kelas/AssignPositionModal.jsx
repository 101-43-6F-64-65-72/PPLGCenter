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
      setErrorMsg("Gagal memuat daftar kandidat.");
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
        await schoolClassService.assignHomeroomTeacher(schoolClass.id, selectedCandidateId);
      } else if (positionType === "StudentPosition") {
        let normalizedPos = positionName.toLowerCase();
        let code = "SEKRETARIS_1";
        if (normalizedPos.includes("ketua kelas") && !normalizedPos.includes("wakil")) code = "KETUA_KELAS";
        else if (normalizedPos.includes("wakil")) code = "WAKIL_KETUA";
        else if (normalizedPos.includes("sekretaris 1")) code = "SEKRETARIS_1";
        else if (normalizedPos.includes("sekretaris 2")) code = "SEKRETARIS_2";
        else if (normalizedPos.includes("bendahara 1")) code = "BENDAHARA_1";
        else if (normalizedPos.includes("bendahara 2")) code = "BENDAHARA_2";

        await classTreeService.assignStudentPosition({
          schoolClassId: schoolClass.id,
          studentId: selectedCandidateId,
          positionCode: code,
          divisionId: divisionId || null,
        });
      } else if (positionType === "Division" && divisionId) {
        await classTreeService.updateDivision(divisionId, {
          leaderStudentId: selectedCandidateId,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to assign position:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal menetapkan posisi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-[24px] p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2C1EE8]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Tetapkan {positionName}</h3>
              <p className="text-xs text-slate-500 font-medium">Kelas {schoolClass?.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Pilih {positionType === "WaliKelas" ? "Guru Wali Kelas" : "Siswa Pengisi Posisi"}:
            </label>

            {isLoadingCandidates ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2C1EE8]" />
                <span>Memuat daftar kandidat...</span>
              </div>
            ) : candidates.length === 0 ? (
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center font-medium">
                Tidak ada data terdaftar untuk kelas {schoolClass?.name}.
              </p>
            ) : (
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 font-bold transition-all"
              >
                {candidates.map((c, idx) => {
                  const cId = c.id || c.Id;
                  const name = c.fullName || c.FullName || c.name || "Siswa";
                  const nis = c.nis || c.NIS ? ` (NIS: ${c.nis || c.NIS})` : "";
                  const nip = c.nip || c.NIP ? ` (NIP: ${c.nip || c.NIP})` : "";

                  return (
                    <option key={cId} value={cId}>
                      {positionType === "WaliKelas" ? `${name}${nip}` : `${idx + 1}. ${name}${nis}`}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || candidates.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C1EE8] hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Simpan Posisi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
