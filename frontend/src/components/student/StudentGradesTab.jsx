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
        <div className="bg-gradient-to-r from-[#2c1ee8] to-indigo-700 p-6 sm:p-8 rounded-3xl shadow-lg shadow-blue-500/20 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
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

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-bold">
        <button
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

      {loading ? (
        <div className="p-12 text-center text-gray-400 font-semibold">Memuat nilai siswa...</div>
      ) : activeSubTab === "transcript" ? (
        /* Transcript View */
        <div className="space-y-4">
          {!transcript || transcript.subjectSummaries.length === 0 ? (
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
        /* Report Card Summary (Module 10) */
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">📋 Rapor Akademik Siswa</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {reportCard?.semesterName} • Tahun Ajaran {reportCard?.academicYear}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
                Kehadiran: <strong>{reportCard?.attendancePercentage}%</strong>
              </div>
              <div className="bg-blue-50 text-[#2c1ee8] px-3 py-1.5 rounded-xl border border-blue-200 font-bold">
                Hadir: <strong>{reportCard?.totalPresentDays} hari</strong>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2">
            <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">💬 Catatan Wali Kelas / Guru</h4>
            <p className="text-sm text-gray-800 italic leading-relaxed font-medium">
              &quot;{reportCard?.teacherRemarks}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
