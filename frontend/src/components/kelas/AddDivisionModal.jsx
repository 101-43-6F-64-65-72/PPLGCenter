"use client";

import React, { useState, useEffect } from "react";
import classTreeService from "@/services/classTreeService";
import userService from "@/services/userService";
import { X, PlusCircle, Loader2, AlertCircle } from "lucide-react";

export default function AddDivisionModal({ isOpen, onClose, schoolClass, onSuccess }) {
  const [divisionName, setDivisionName] = useState("");
  const [description, setDescription] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
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
      const res = await userService.getUsers({ classId: schoolClass.id, role: "Student", pageSize: 100 });
      const rawData = res?.data ?? res;
      let list = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.items) ? rawData.items : [];
      list = list.filter((s) => String(s.classId || s.ClassId || "") === String(schoolClass.id));
      setStudents(list);
      if (list.length > 0) {
        setSelectedLeaderId(list[0].id || list[0].Id);
      }
    } catch (err) {
      console.error("Failed to load class students:", err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!divisionName.trim() || !schoolClass?.id) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await classTreeService.createDivision({
        schoolClassId: schoolClass.id,
        name: divisionName.trim(),
        description: description.trim() || null,
        leaderStudentId: selectedLeaderId || null,
      });

      setDivisionName("");
      setDescription("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create custom division:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal membuat divisi/seksi baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-none p-5 sm:p-6 shadow-xl text-slate-900 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-none bg-blue-50 border border-blue-200 text-[#2C1EE8]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">Tambah Divisi / Seksi</h3>
              <p className="text-xs text-slate-500 font-normal">Kelas {schoolClass?.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-none bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Nama Divisi / Seksi <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={divisionName}
              onChange={(e) => setDivisionName(e.target.value)}
              placeholder="Contoh: Seksi Kebersihan, Seksi Kerohanian"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2C1EE8] focus:bg-white font-semibold transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Deskripsi / Tugas (Opsional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan singkat tugas divisi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2C1EE8] focus:bg-white font-normal transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Penanggung Jawab (Ketua Seksi)</label>

            {isLoadingStudents ? (
              <div className="p-3 text-center text-xs text-slate-400 font-mono">
                Memuat daftar siswa...
              </div>
            ) : students.length === 0 ? (
              <p className="p-2.5 bg-slate-50 rounded-none border border-slate-200 text-xs text-slate-500 text-center font-medium">
                Belum ada siswa terdaftar untuk kelas {schoolClass?.name}.
              </p>
            ) : (
              <select
                value={selectedLeaderId}
                onChange={(e) => setSelectedLeaderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:bg-white font-semibold transition-colors cursor-pointer"
              >
                <option value="">-- Pilih Ketua Seksi (Opsional) --</option>
                {students.map((s, idx) => {
                  const sId = s.id || s.Id;
                  const name = s.fullName || s.FullName || s.name;
                  const nis = s.nis || s.NIS ? ` (NIS: ${s.nis || s.NIS})` : "";
                  return (
                    <option key={sId} value={sId}>
                      {idx + 1}. {name}{nis}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !divisionName.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tambah Divisi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
