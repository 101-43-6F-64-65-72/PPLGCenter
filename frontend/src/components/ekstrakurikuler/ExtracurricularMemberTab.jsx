"use client";

import React, { useState, useEffect } from "react";
import { extracurricularService } from "@/services/extracurricularService";
import { resolveImageUrl } from "@/lib/utils";
import { Users, CheckCircle, XCircle, Clock, Search, Loader2, ShieldCheck, UserCheck } from "lucide-react";

export default function ExtracurricularMemberTab({ extracurricularId, canManageMembers }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // "active" | "pending"
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, message: "", type: "success" });

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await extracurricularService.getMembers(extracurricularId, { pageSize: 100 });
      const rawData = res?.data ?? res;
      const items = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : [];
      setMembers(items);
    } catch (err) {
      console.error("Failed to load extracurricular members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (extracurricularId) {
      fetchMembers();
    }
  }, [extracurricularId]);

  const showToast = (message, type = "success") => {
    setFeedback({ show: true, message, type });
    setTimeout(() => {
      setFeedback({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleUpdateStatus = async (memberId, newStatus) => {
    setActionLoadingId(memberId);
    try {
      const res = await extracurricularService.updateMemberStatus(extracurricularId, memberId, newStatus);
      if (res && (res.success || res.status === 200)) {
        showToast(
          newStatus === "Active"
            ? "Pendaftaran anggota berhasil disetujui!"
            : "Status keanggotaan berhasil diperbarui.",
          "success"
        );
        await fetchMembers();
      } else {
        showToast(res?.message || "Gagal memperbarui status anggota.", "error");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Terjadi kesalahan saat memproses status.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeMembers = members.filter((m) => m.status === "Active" || !m.status);
  const pendingMembers = members.filter((m) => m.status === "Pending");

  const displayedList = activeTab === "active" ? activeMembers : pendingMembers;

  const filteredMembers = displayedList.filter((m) => {
    const name = m.studentName || m.StudentName || "";
    const nis = m.nis || m.NIS || "";
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || nis.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback.show && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-300"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-[#2c1ee8] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Anggota Aktif ({activeMembers.length})
          </button>

          {canManageMembers && (
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pengajuan Masuk ({pendingMembers.length})</span>
            </button>
          )}
        </div>

        {/* Quick Filter Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 pl-9 text-xs text-slate-900 focus:border-[#2c1ee8] focus:bg-white focus:outline-hidden"
          />
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Member Roster List Container */}
      {isLoading ? (
        <div className="p-8 text-center animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-[#2c1ee8] mx-auto mb-2" />
          <span className="text-xs text-slate-500 font-bold">Memuat daftar anggota...</span>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">
            {activeTab === "pending" ? "Tidak ada pendaftaran tertunda" : "Belum ada anggota terdaftar"}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === "pending"
              ? "Semua pendaftaran telah diproses."
              : "Anggota yang telah bergabung akan muncul di daftar ini."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Siswa</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Tanggal Bergabung</th>
                <th className="py-3 px-4">Status</th>
                {canManageMembers && <th className="py-3 px-4 text-right">Aksi Pembina</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => {
                const memberId = m.id || m.Id;
                const studentName = m.studentName || m.StudentName || "Siswa";
                const nis = m.nis || m.NIS || "-";
                const className = m.className || m.ClassName || "-";
                const position = m.position || m.Position || "Member";
                const joinedAt = m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("id-ID") : "-";
                const photoUrl = m.photoUrl || m.PhotoUrl;

                return (
                  <tr key={memberId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2c1ee8] flex items-center justify-center font-black overflow-hidden flex-shrink-0 border border-blue-200">
                        {photoUrl ? (
                          <img src={resolveImageUrl(photoUrl)} alt={studentName} className="w-full h-full object-cover" />
                        ) : (
                          studentName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span>{studentName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{nis}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{className}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                        {position}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{joinedAt}</td>
                    <td className="py-3 px-4">
                      {m.status === "Pending" ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>Aktif</span>
                        </span>
                      )}
                    </td>

                    {canManageMembers && (
                      <td className="py-3 px-4 text-right">
                        {m.status === "Pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(memberId, "Active")}
                              disabled={actionLoadingId === memberId}
                              className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              {actionLoadingId === memberId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              <span>Setujui</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(memberId, "Removed")}
                              disabled={actionLoadingId === memberId}
                              className="px-3 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(memberId, "Removed")}
                            disabled={actionLoadingId === memberId}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                          >
                            <span>Keluarkan</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
