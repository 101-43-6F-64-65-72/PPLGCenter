"use client";

import React, { useState, useEffect } from "react";
import { gradebookService } from "@/services/gradebookService";

export default function StudentGradesTab() {
  const [transcript, setTranscript] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("transcript"); // 'transcript' | 'reportCard'

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [transRes, reportRes] = await Promise.all([
          gradebookService.getTranscript(),
          gradebookService.getReportCardSummary(),
        ]);

        if (isMounted) {
          if (transRes?.data) setTranscript(transRes.data);
          if (reportRes?.data) setReportCard(reportRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch student grades/transcript", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner Summary */}
      {transcript && (
        <div className="bg-gradient-to-r from-indigo-900/60 via-slate-800 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-3xl shadow-inner">
              🎓
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{transcript.studentName}</h2>
              <p className="text-xs text-slate-400 font-mono">
                NIS: {transcript.studentNis} • Kelas: {transcript.className}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-700/60 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">IPK / GPA</span>
              <span className="text-2xl font-extrabold text-indigo-400">{transcript.overallGpa}</span>
            </div>
            <div className="text-center border-l border-slate-700/50 pl-4">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Rata-Rata</span>
              <span className="text-2xl font-extrabold text-emerald-400">{transcript.overallAverageScore}</span>
            </div>
            <div className="text-center border-l border-slate-700/50 pl-4">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Predikat</span>
              <span className="text-base font-bold text-amber-300 mt-1 block">{transcript.overallLetterGrade}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab("transcript")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeSubTab === "transcript"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          📜 Transkrip Nilai
        </button>
        <button
          onClick={() => setActiveSubTab("reportCard")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeSubTab === "reportCard"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          📋 Ringkasan Rapor Semester
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Memuat nilai siswa...</div>
      ) : activeSubTab === "transcript" ? (
        /* Transcript View */
        <div className="space-y-4">
          {!transcript || transcript.subjectSummaries.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-700 text-slate-400">
              Belum ada nilai mata pelajaran yang dipublikasikan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transcript.subjectSummaries.map((sub) => (
                <div key={sub.classSubjectId} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-3">
                    <div>
                      <span className="text-[10px] bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded">
                        {sub.subjectCode}
                      </span>
                      <h4 className="font-bold text-slate-100 text-sm mt-1">{sub.subjectName}</h4>
                      <p className="text-xs text-slate-400">Pengampu: {sub.teacherName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-indigo-400 font-mono block">
                        {sub.finalScore}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {sub.letterGrade} ({sub.predicate})
                      </span>
                    </div>
                  </div>

                  {/* Assessment Grades Breakdown */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Detail Penilaian:</span>
                    {sub.grades.length === 0 ? (
                      <span className="text-xs text-slate-500 italic block">Belum ada item penilaian.</span>
                    ) : (
                      sub.grades.map((g) => (
                        <div key={g.id} className="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded border border-slate-700/40">
                          <span className="text-slate-300 font-medium truncate max-w-[180px]">{g.assessmentTitle}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400">{g.rawScore}/{g.maxScore}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{g.letterGrade}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-xs">
                    <span className="text-slate-400 font-mono">Ranking Kelas: <strong className="text-amber-400">#{sub.rankInClass}</strong></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sub.isPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
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
        /* Report Card Summary (Module 10) */
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">📋 Rapor Akademik Siswa</h3>
              <p className="text-xs text-slate-400">
                {reportCard?.semesterName} • Tahun Ajaran {reportCard?.academicYear}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                Kehadiran: <strong className="text-emerald-400">{reportCard?.attendancePercentage}%</strong>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                Hadir: <strong className="text-slate-200">{reportCard?.totalPresentDays} hr</strong>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">💬 Catatan Wali Kelas / Guru</h4>
            <p className="text-sm text-slate-200 italic leading-relaxed">
              &quot;{reportCard?.teacherRemarks}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
