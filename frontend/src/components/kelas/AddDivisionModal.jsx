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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-[24px] p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2C1EE8]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Tambah Divisi / Seksi</h3>
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
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Nama Divisi / Seksi:</label>
            <input
              type="text"
              value={divisionName}
              onChange={(e) => setDivisionName(e.target.value)}
              placeholder="Contoh: Seksi Kebersihan, Seksi Kerohanian"
              required
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 font-semibold transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Deskripsi / Tugas (Opsional):</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan singkat tugas divisi..."
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Penanggung Jawab (Ketua Seksi):</label>

            {isLoadingStudents ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2C1EE8]" />
                <span>Memuat daftar siswa...</span>
              </div>
            ) : students.length === 0 ? (
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center font-medium">
                Belum ada siswa terdaftar untuk kelas {schoolClass?.name}.
              </p>
            ) : (
              <select
                value={selectedLeaderId}
                onChange={(e) => setSelectedLeaderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 font-bold transition-all"
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
              disabled={isSubmitting || !divisionName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C1EE8] hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
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
