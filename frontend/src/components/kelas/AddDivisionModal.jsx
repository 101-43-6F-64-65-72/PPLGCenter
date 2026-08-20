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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tambah Divisi / Seksi</h3>
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
            <label className="block text-xs font-bold text-slate-300 mb-1">Nama Divisi / Seksi:</label>
            <input
              type="text"
              required
              placeholder="Contoh: Seksi Kebersihan, Seksi Keamanan..."
              value={divisionName}
              onChange={(e) => setDivisionName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi Tugas (Opsional):</label>
            <textarea
              rows="2"
              placeholder="Jelaskan peran divisi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Penanggung Jawab / Ketua Seksi (Siswa):</label>
            {isLoadingStudents ? (
              <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Memuat daftar siswa kelas...</span>
              </div>
            ) : (
              <select
                value={selectedLeaderId}
                onChange={(e) => setSelectedLeaderId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
              >
                <option value="">-- Pilih Siswa Penanggung Jawab --</option>
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
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !divisionName.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 cursor-pointer shadow-md shadow-cyan-600/20"
            >
              {isSubmitting ? "Menyimpan..." : "Buat Divisi Seksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
