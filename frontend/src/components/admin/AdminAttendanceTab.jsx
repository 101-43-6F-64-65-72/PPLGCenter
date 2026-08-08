"use client";

import { useState, useEffect, useCallback } from "react";
import { attendanceService } from "@/services/attendanceService";
import { CheckCircle2, XCircle, Clock, AlertCircle, Search, RefreshCw, Calendar, Lock } from "lucide-react";

export default function AdminAttendanceTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const params = {};
        if (statusFilter) params.status = statusFilter;
        const res = await attendanceService.getSessions(params);
        setSessions(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Gagal memuat sesi absensi");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  async function fetchSessions() {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await attendanceService.getSessions(params);
      setSessions(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat sesi absensi");
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseSession(id) {
    if (!confirm("Tutup sesi absensi? Seluruh siswa yang belum di-absensi otomatis dianggap Alpha.")) return;
    try {
      await attendanceService.closeSession(id);
      fetchSessions();
      if (selectedSession?.id === id) {
        const updated = await attendanceService.getSessionById(id);
        setSelectedSession(updated.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menutup sesi");
    }
  }

  const filteredSessions = sessions.filter(
    (s) =>
      s.className?.toLowerCase().includes(search.toLowerCase()) ||
      s.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      s.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Monitoring Absensi Pelajaran</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tinjau sesi absensi harian dan status absensi siswa</p>
        </div>
        <button
          onClick={fetchSessions}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Segarkan
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelas, mapel, atau nama guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]"
        >
          <option value="">Semua Status Sesi</option>
          <option value="Open">Buka (Open)</option>
          <option value="Closed">Tutup (Closed)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat sesi absensi...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Tidak ada sesi absensi ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="p-4">Tanggal & Waktu</th>
                  <th className="p-4">Kelas & Mapel</th>
                  <th className="p-4">Guru Pengajar</th>
                  <th className="p-4">Status Sesi</th>
                  <th className="p-4">Kehadiran (H/S/I/A)</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(s.date).toLocaleDateString("id-ID")}
                      </div>
                      <div className="text-xs text-slate-400">Sesi #{s.sessionNumber}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-white">{s.className}</div>
                      <div className="text-xs text-[#2c1ee8] font-mono">{s.subjectCode} - {s.subjectName}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{s.teacherName}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.status === "Open"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {s.status === "Open" ? <Clock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded" title="Hadir">{s.presentCount} H</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded" title="Izin/Sakit">{s.permissionCount + s.sickCount} I/S</span>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded" title="Alpha">{s.alphaCount} A</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded" title="Belum Diabsen">{s.notMarkedCount} ?</span>
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200"
                      >
                        Detail
                      </button>
                      {s.status === "Open" && (
                        <button
                          onClick={() => handleCloseSession(s.id)}
                          className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded hover:bg-rose-700"
                        >
                          Tutup Sesi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Attendance */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Detail Absensi Siswa</h3>
                <p className="text-xs text-slate-500">{selectedSession.className} — {selectedSession.subjectName} ({new Date(selectedSession.date).toLocaleDateString("id-ID")})</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3">NIS</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Waktu Check-In</th>
                    <th className="p-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {selectedSession.attendances?.map((a) => (
                    <tr key={a.id}>
                      <td className="p-3 text-slate-500 font-mono text-xs">{a.studentNis || "-"}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-white">{a.studentName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          a.status === "Present" ? "bg-emerald-50 text-emerald-700" :
                          a.status === "Late" ? "bg-amber-50 text-amber-700" :
                          a.status === "Alpha" ? "bg-rose-50 text-rose-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString("id-ID") : "-"}
                      </td>
                      <td className="p-3 text-xs text-slate-500">{a.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
