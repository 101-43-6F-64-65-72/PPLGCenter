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
        <div className="no-print bg-white p-4 sm:p-5 rounded-none shadow-xs text-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-blue-50 border border-blue-200 flex items-center justify-center text-xl shrink-0 text-[#2C1EE8] font-bold">
              🎓
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase text-slate-900">{transcript.studentName}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                NIS: {transcript.studentNis} • Kelas: {transcript.className}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 w-full md:w-auto">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">IPK / GPA</span>
              <span className="text-xl font-bold font-mono text-slate-900">{transcript.overallGpa}</span>
            </div>
            <div className="text-center border-l border-slate-100 pl-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Rata-Rata</span>
              <span className="text-xl font-bold font-mono text-emerald-700">{transcript.overallAverageScore}</span>
            </div>
            <div className="text-center border-l border-slate-100 pl-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Predikat</span>
              <span className="text-sm font-bold font-mono text-amber-700 mt-0.5 block">{transcript.overallLetterGrade}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tabs & Academic Period Filter Toolbar (Hidden during Print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 text-left">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveSubTab("transcript")}
            className={`px-4 py-2 rounded-none transition-colors cursor-pointer border ${
              activeSubTab === "transcript"
                ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
            }`}
          >
            Transkrip Nilai
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("reportCard")}
            className={`px-4 py-2 rounded-none transition-colors cursor-pointer border ${
              activeSubTab === "reportCard"
                ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
            }`}
          >
            Ringkasan Rapor
          </button>
        </div>

        {/* Academic Period Selector & Print Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {semesters.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-none px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Cetak Rapor</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
          <div className="w-5 h-5 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Memuat nilai siswa...
        </div>
      ) : activeSubTab === "transcript" ? (
        /* Transcript View */
        <div className="space-y-3 text-left">
          {!transcript || !transcript.subjectSummaries || transcript.subjectSummaries.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-none border border-slate-200 text-slate-500 font-medium">
              Belum ada nilai mata pelajaran yang dipublikasikan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {transcript.subjectSummaries.map((sub) => (
                <div key={sub.classSubjectId} className="bg-white border border-slate-200 rounded-none p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[9.5px] bg-blue-50 text-[#2C1EE8] font-bold font-mono px-1.5 py-0.2 rounded-none border border-blue-200">
                        {sub.subjectCode}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1 uppercase">{sub.subjectName}</h4>
                      <p className="text-[11px] text-slate-500 font-normal">Pengampu: {sub.teacherName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-[#2C1EE8] font-mono block">
                        {sub.finalScore}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {sub.letterGrade} ({sub.predicate})
                      </span>
                    </div>
                  </div>

                  {/* Assessment Grades Breakdown */}
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] text-slate-400 uppercase font-mono font-bold block">Detail Penilaian:</span>
                    {sub.grades.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic block">Belum ada item penilaian.</span>
                    ) : (
                      sub.grades.map((g) => (
                        <div key={g.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-none border border-slate-200 font-semibold">
                          <span className="text-slate-800 truncate max-w-[180px]">{g.assessmentTitle}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-700">{g.rawScore}/{g.maxScore}</span>
                            <span className="text-[9.5px] bg-white text-slate-600 px-1.5 py-0.2 rounded-none font-mono border border-slate-200">{g.letterGrade}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs font-semibold">
                    <span className="text-slate-500 font-mono text-[11px]">Ranking Kelas: <strong className="text-amber-700 font-bold">#{sub.rankInClass}</strong></span>
                    <span className={`px-2 py-0.2 rounded-none text-[9.5px] font-bold font-mono border ${
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
        <div className="printable-report-card bg-white border border-slate-200 rounded-none p-5 sm:p-6 space-y-4 shadow-xs text-left">
          {/* Official Header for Printable Report Card */}
          <div className="border-b-2 border-black pb-3 text-center">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900">
              LAPORAN HASIL BELAJAR SISWA (RAPOR)
            </h2>
            <p className="text-xs font-bold text-slate-600 mt-0.5 uppercase">
              SMK NEGERI 2 SURAKARTA • PROGRAM KEAHLIAN PPLG
            </p>
          </div>

          {/* Student Identity Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-medium border-b border-slate-200 pb-3">
            <div>
              <p><span className="text-slate-500 font-bold">Nama Siswa:</span> <strong>{reportCard?.studentName || transcript?.studentName}</strong></p>
              <p><span className="text-slate-500 font-bold">NIS:</span> <strong>{reportCard?.studentNis || transcript?.studentNis}</strong></p>
              <p><span className="text-slate-500 font-bold">Kelas:</span> <strong>{reportCard?.className || transcript?.className}</strong></p>
            </div>
            <div className="text-right sm:text-left">
              <p><span className="text-slate-500 font-bold">Semester:</span> <strong>{reportCard?.semesterName || "Semester Aktif"}</strong></p>
              <p><span className="text-slate-500 font-bold">Tahun Ajaran:</span> <strong>{reportCard?.academicYear || "2026/2027"}</strong></p>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 uppercase tracking-wider text-[11px]">
                  <th className="py-2 px-2.5 border border-slate-300">No</th>
                  <th className="py-2 px-2.5 border border-slate-300">Mata Pelajaran</th>
                  <th className="py-2 px-2.5 border border-slate-300">Guru Pengampu</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-right">Nilai Akhir</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-center">Grade</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!reportCard?.subjectGrades || reportCard.subjectGrades.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400 font-semibold">
                      Belum ada data nilai mata pelajaran untuk semester ini.
                    </td>
                  </tr>
                ) : (
                  reportCard.subjectGrades.map((sub, idx) => (
                    <tr key={sub.classSubjectId || idx}>
                      <td className="py-2 px-2.5 border border-slate-200 font-mono text-center">{idx + 1}</td>
                      <td className="py-2 px-2.5 border border-slate-200 font-bold">{sub.subjectName}</td>
                      <td className="py-2 px-2.5 border border-slate-200">{sub.teacherName}</td>
                      <td className="py-2 px-2.5 border border-slate-200 text-right font-mono font-bold">{sub.finalScore}</td>
                      <td className="py-2 px-2.5 border border-slate-200 text-center font-bold">{sub.letterGrade}</td>
                      <td className="py-2 px-2.5 border border-slate-200 text-center">{sub.predicate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Academic & Attendance Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-none bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Ringkasan Akademik</h4>
              <p>Rata-Rata Semester: <strong className="text-emerald-700">{reportCard?.semesterAverage || transcript?.overallAverageScore || "0.0"}</strong></p>
              <p>Predikat Rapor: <strong>{reportCard?.overallLetterGrade || transcript?.overallLetterGrade || "-"} ({reportCard?.overallPredicate || transcript?.overallPredicate || "-"})</strong></p>
            </div>

            <div className="p-3 rounded-none bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Kehadiran Siswa</h4>
              <p>Persentase Kehadiran: <strong>{reportCard?.attendancePercentage || 100}%</strong></p>
              <p>Hadir: <strong>{reportCard?.totalPresentDays || 0} hari</strong> • Absen: <strong>{reportCard?.totalAbsentDays || 0} hari</strong></p>
            </div>
          </div>

          {/* Teacher Remarks Box */}
          <div className="bg-slate-50 p-3 rounded-none border border-slate-200 space-y-1 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Catatan Wali Kelas / Guru</h4>
            <p className="text-slate-700 italic font-normal">
              &quot;{reportCard?.teacherRemarks || "Tingkatkan motivasi belajar dan jagalah tingkat kehadiran."}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
