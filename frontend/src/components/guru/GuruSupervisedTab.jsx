"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Award, Users, ShieldCheck, Search, Check, X, Settings, RefreshCw
} from "lucide-react";
import { extracurricularService } from "@/services/extracurricularService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import ImageCropUploader from "@/components/common/ImageCropUploader";
import toast from "react-hot-toast";
import { resolveImageUrl } from "@/lib/utils";

export default function GuruSupervisedTab({ supervisedExtracurriculars = [], teacherName = "" }) {
  const [selectedEkskul, setSelectedEkskul] = useState(
    supervisedExtracurriculars.length > 0 ? supervisedExtracurriculars[0] : null
  );
  const [subTab, setSubTab] = useState("members"); // 'members' | 'settings'

  // Members state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchMember, setSearchMember] = useState("");

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedEkskul) {
      setDescription(selectedEkskul.description || "");
      setImageUrl(selectedEkskul.imageUrl || selectedEkskul.ImageUrl || null);
      setUploadError("");
      loadMembers();
    }
  }, [selectedEkskul, loadMembers]);
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
            Pengawasan keanggotaan dan pengelolaan kegiatan binaan.
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
