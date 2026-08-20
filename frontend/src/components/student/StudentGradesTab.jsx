"use client";

import React, { useState, useEffect } from "react";
import { gradebookService } from "@/services/gradebookService";
import { semesterService } from "@/services/semesterService";
import { Printer, Calendar, Award, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function StudentGradesTab() {
  const [transcript, setTranscript] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("transcript"); // 'transcript' | 'reportCard'

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await semesterService.getAll();
      const raw = res?.data ?? res;
      const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
      setSemesters(items);

      const active = items.find((s) => s.isActive || s.IsActive);
      if (active) {
        setSelectedSemesterId(active.id || active.Id);
      }
    } catch (err) {
      console.error("Failed to load semesters:", err);
    }
  };

  const loadGradesData = async () => {
    setLoading(true);
    try {
      const [transRes, reportRes] = await Promise.allSettled([
        gradebookService.getTranscript(),
        gradebookService.getReportCardSummary(selectedSemesterId || null),
      ]);

      if (transRes.status === "fulfilled" && transRes.value?.data) {
        setTranscript(transRes.value.data);
      }
      if (reportRes.status === "fulfilled" && reportRes.value?.data) {
        setReportCard(reportRes.value.data);
      }
    } catch (err) {
      console.error("Failed to fetch student grades/transcript:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGradesData();
  }, [selectedSemesterId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Specific CSS Styles */}
      <style jsx global>{`
        @media print {
          nav, footer, header, .no-print, button {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12pt !important;
          }
          .printable-report-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            padding: 20px !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Banner Summary Header (Hidden during Print) */}
      {transcript && (
        <div className="no-print bg-gradient-to-r from-[#2c1ee8] to-indigo-700 p-6 sm:p-8 rounded-3xl shadow-lg shadow-blue-500/20 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
              🎓
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{transcript.studentName}</h2>
              <p className="text-xs text-blue-100 font-mono mt-0.5">
                NIS: {transcript.studentNis} • Kelas: {transcript.className}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
            <div className="text-center">
              <span className="text-[10px] text-blue-200 uppercase font-mono block">IPK / GPA</span>
              <span className="text-2xl font-black text-white">{transcript.overallGpa}</span>
            </div>
            <div className="text-center border-l border-white/20 pl-4">
              <span className="text-[10px] text-blue-200 uppercase font-mono block">Rata-Rata</span>
              <span className="text-2xl font-black text-emerald-300">{transcript.overallAverageScore}</span>
            </div>
            <div className="text-center border-l border-white/20 pl-4">
              <span className="text-[10px] text-blue-200 uppercase font-mono block">Predikat</span>
              <span className="text-base font-extrabold text-amber-300 mt-1 block">{transcript.overallLetterGrade}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tabs & Academic Period Filter Toolbar (Hidden during Print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab("transcript")}
            className={`px-5 py-2.5 rounded-2xl transition-all cursor-pointer ${
              activeSubTab === "transcript"
                ? "bg-[#2c1ee8] text-white shadow-md shadow-blue-500/20"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
            }`}
          >
            📜 Transkrip Nilai
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("reportCard")}
            className={`px-5 py-2.5 rounded-2xl transition-all cursor-pointer ${
              activeSubTab === "reportCard"
                ? "bg-[#2c1ee8] text-white shadow-md shadow-blue-500/20"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
            }`}
          >
            📋 Ringkasan Rapor Semester
          </button>
        </div>

        {/* Academic Period Selector & Print Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {semesters.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 focus:outline-hidden cursor-pointer"
              >
                <option value="">Semester Aktif</option>
                {semesters.map((s) => {
                  const sId = s.id || s.Id;
                  return (
                    <option key={sId} value={sId}>
                      {s.name || s.Name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rapor</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 font-semibold">Memuat nilai siswa...</div>
      ) : activeSubTab === "transcript" ? (
        /* Transcript View */
        <div className="space-y-4">
          {!transcript || !transcript.subjectSummaries || transcript.subjectSummaries.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-gray-100 text-gray-500 font-semibold shadow-xs">
              Belum ada nilai mata pelajaran yang dipublikasikan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transcript.subjectSummaries.map((sub) => (
                <div key={sub.classSubjectId} className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[10px] bg-blue-50 text-[#2c1ee8] font-extrabold font-mono px-2 py-0.5 rounded-md border border-blue-100">
                        {sub.subjectCode}
                      </span>
                      <h4 className="font-black text-gray-900 text-sm sm:text-base mt-1.5">{sub.subjectName}</h4>
                      <p className="text-xs text-gray-500 font-medium">Pengampu: {sub.teacherName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#2c1ee8] font-mono block">
                        {sub.finalScore}
                      </span>
                      <span className="text-xs font-extrabold text-gray-700">
                        {sub.letterGrade} ({sub.predicate})
                      </span>
                    </div>
                  </div>

                  {/* Assessment Grades Breakdown */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 uppercase font-mono font-bold block">Detail Penilaian:</span>
                    {sub.grades.length === 0 ? (
                      <span className="text-xs text-gray-400 italic block">Belum ada item penilaian.</span>
                    ) : (
                      sub.grades.map((g) => (
                        <div key={g.id} className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-semibold">
                          <span className="text-gray-800 truncate max-w-[180px]">{g.assessmentTitle}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-600">{g.rawScore}/{g.maxScore}</span>
                            <span className="text-[10px] bg-white text-gray-600 px-2 py-0.5 rounded-md font-mono border border-gray-200">{g.letterGrade}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs font-semibold">
                    <span className="text-gray-500 font-mono">Ranking Kelas: <strong className="text-amber-600">#{sub.rankInClass}</strong></span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      sub.isPassed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {sub.isPassed ? "LULUS" : "REMIDIAL"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Report Card Summary (Printable Layout) */
        <div className="printable-report-card bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Official Header for Printable Report Card */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
              LAPORAN HASIL BELAJAR SISWA (RAPOR)
            </h2>
            <p className="text-xs font-bold text-slate-600 mt-1 uppercase">
              SMK NEGERI 2 SURAKARTA • PROGRAM KEAHLIAN PPLG
            </p>
          </div>

          {/* Student Identity Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-gray-200 pb-4">
            <div>
              <p><span className="text-gray-500 font-bold">Nama Siswa:</span> <strong>{reportCard?.studentName || transcript?.studentName}</strong></p>
              <p><span className="text-gray-500 font-bold">NIS:</span> <strong>{reportCard?.studentNis || transcript?.studentNis}</strong></p>
              <p><span className="text-gray-500 font-bold">Kelas:</span> <strong>{reportCard?.className || transcript?.className}</strong></p>
            </div>
            <div className="text-right sm:text-left">
              <p><span className="text-gray-500 font-bold">Semester:</span> <strong>{reportCard?.semesterName || "Semester Aktif"}</strong></p>
              <p><span className="text-gray-500 font-bold">Tahun Ajaran:</span> <strong>{reportCard?.academicYear || "2026/2027"}</strong></p>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border border-slate-200">No</th>
                  <th className="py-2.5 px-3 border border-slate-200">Mata Pelajaran</th>
                  <th className="py-2.5 px-3 border border-slate-200">Guru Pengampu</th>
                  <th className="py-2.5 px-3 border border-slate-200 text-right">Nilai Akhir</th>
                  <th className="py-2.5 px-3 border border-slate-200 text-center">Grade</th>
                  <th className="py-2.5 px-3 border border-slate-200 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!reportCard?.subjectGrades || reportCard.subjectGrades.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-400 font-semibold">
                      Belum ada data nilai mata pelajaran untuk semester ini.
                    </td>
                  </tr>
                ) : (
                  reportCard.subjectGrades.map((sub, idx) => (
                    <tr key={sub.classSubjectId || idx}>
                      <td className="py-2.5 px-3 border border-slate-200 font-mono text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 border border-slate-200 font-bold">{sub.subjectName}</td>
                      <td className="py-2.5 px-3 border border-slate-200">{sub.teacherName}</td>
                      <td className="py-2.5 px-3 border border-slate-200 text-right font-mono font-bold">{sub.finalScore}</td>
                      <td className="py-2.5 px-3 border border-slate-200 text-center font-bold">{sub.letterGrade}</td>
                      <td className="py-2.5 px-3 border border-slate-200 text-center">{sub.predicate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Academic & Attendance Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider">Ringkasan Akademik</h4>
              <p>Rata-Rata Semester: <strong className="text-emerald-700">{reportCard?.semesterAverage || transcript?.overallAverageScore || "0.0"}</strong></p>
              <p>Predikat Rapor: <strong>{reportCard?.overallLetterGrade || transcript?.overallLetterGrade || "-"} ({reportCard?.overallPredicate || transcript?.overallPredicate || "-"})</strong></p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider">Kehadiran Siswa</h4>
              <p>Persentase Kehadiran: <strong>{reportCard?.attendancePercentage || 100}%</strong></p>
              <p>Hadir: <strong>{reportCard?.totalPresentDays || 0} hari</strong> • Absen: <strong>{reportCard?.totalAbsentDays || 0} hari</strong></p>
            </div>
          </div>

          {/* Teacher Remarks Box */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
            <h4 className="font-bold text-gray-700 uppercase tracking-wider">Catatan Wali Kelas / Guru</h4>
            <p className="text-gray-800 italic font-medium">
              &quot;{reportCard?.teacherRemarks || "Tingkatkan motivasi belajar dan jagalah tingkat kehadiran."}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
