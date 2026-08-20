"use client";

import React, { useState, useEffect } from "react";
import classTreeService from "@/services/classTreeService";
import userService from "@/services/userService";
import { X, Crown, Loader2, CheckCircle, AlertCircle, UserCheck } from "lucide-react";

export default function AppointLeadershipModal({ isOpen, onClose, schoolClass, currentLeadership, onSuccess }) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && schoolClass?.id) {
      fetchClassStudents();
    }
  }, [isOpen, schoolClass]);

  const fetchClassStudents = async () => {
    setIsLoadingStudents(true);
    setErrorMsg("");
    try {
      // Fetch students belonging to this class
      const res = await userService.getUsers({ classId: schoolClass.id, role: "Student", pageSize: 100 });
      const rawData = res?.data ?? res;
      const items = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : [];
      setStudents(items);

      if (currentLeadership?.classLeaderStudentId) {
        setSelectedStudentId(currentLeadership.classLeaderStudentId);
      } else if (items.length > 0) {
        setSelectedStudentId(items[0].id || items[0].Id);
      }
    } catch (err) {
      console.error("Failed to load class students:", err);
      setErrorMsg("Gagal memuat daftar siswa kelas.");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !schoolClass?.id) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        schoolClassId: schoolClass.id,
        homeroomTeacherId: schoolClass.homeroomTeacherId || currentLeadership?.homeroomTeacherId,
        classLeaderStudentId: selectedStudentId,
        academicYearId: schoolClass.academicYearId || currentLeadership?.academicYearId,
      };

      const res = await classTreeService.appointLeadership(payload);
      if (res) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to appoint class leader:", err);
      const msg = err?.response?.data?.message || err?.message || "Gagal menetapkan Ketua Kelas.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tetapkan Ketua Kelas</h3>
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
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Pilih Siswa Ketua Kelas:
            </label>

            {isLoadingStudents ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Memuat daftar siswa...</span>
              </div>
            ) : students.length === 0 ? (
              <p className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-400 text-center">
                Tidak ada data siswa terdaftar di kelas ini.
              </p>
            ) : (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-indigo-500 font-medium"
              >
                {students.map((s) => {
                  const sId = s.id || s.Id;
                  const name = s.fullName || s.FullName || s.name;
                  const nis = s.nis || s.NIS || "";
                  return (
                    <option key={sId} value={sId}>
                      {name} {nis ? `(${nis})` : ""}
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
              disabled={isSubmitting || isLoadingStudents || students.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              <span>Simpan Penetapan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
