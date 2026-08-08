"use client";

import React, { useState, useEffect } from "react";
import { gradebookService } from "@/services/gradebookService";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants/apiRoutes";
import useAuth from "@/hooks/useAuth";

export default function TeacherGradebookTab() {
  const { user } = useAuth();
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState("");
  const [gradebook, setGradebook] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [bulkScores, setBulkScores] = useState({});
  const [csvFile, setCsvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Assessment Form State
  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    description: "",
    gradeCategoryId: "",
    maxScore: 100,
    assessmentType: 1, // Assignment
    dueDate: "",
    isPublished: true,
  });

  const [fetchErrorMsg, setFetchErrorMsg] = useState("");

  const fetchClassSubjects = async () => {
    try {
      const teacherId = user?.id || user?.Id;
      const params = teacherId ? { teacherId } : {};
      const res = await api.get(API_ROUTES.CLASS_SUBJECTS.LIST, { params });
      if (res?.data) {
        setClassSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedClassSubjectId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch class subjects", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await gradebookService.getGradeCategories();
      if (res?.data) {
        setCategories(res.data);
        if (res.data.length > 0) {
          setAssessmentForm((prev) => ({ ...prev, gradeCategoryId: res.data[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchGradebook = async (classSubId) => {
    if (!classSubId) return;
    setLoading(true);
    setFetchErrorMsg("");
    try {
      const res = await gradebookService.getTeacherGradebook(classSubId);
      if (res?.data) {
        setGradebook(res.data);
      }
    } catch (err) {
      const status = err?.response?.status || err?.statusCode;
      if (status === 404) {
        setFetchErrorMsg("Belum ada data nilai atau penilaian pada kelas ini.");
      } else {
        setFetchErrorMsg(err?.response?.data?.message || err?.message || "Gagal memuat buku nilai kelas.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const teacherId = user?.id || user?.Id;
        const params = teacherId ? { teacherId } : {};
        const [csRes, catRes] = await Promise.all([
          api.get(API_ROUTES.CLASS_SUBJECTS.LIST, { params }),
          gradebookService.getGradeCategories(),
        ]);

        if (isMounted) {
          if (csRes?.data) {
            setClassSubjects(csRes.data);
            if (csRes.data.length > 0) {
              setSelectedClassSubjectId(csRes.data[0].id);
            }
          }
          if (catRes?.data) {
            setCategories(catRes.data);
            if (catRes.data.length > 0) {
              setAssessmentForm((prev) => ({ ...prev, gradeCategoryId: catRes.data[0].id }));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial gradebook dropdowns", err);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedClassSubjectId) return;

    const loadGradebook = async () => {
      setLoading(true);
      setFetchErrorMsg("");
      try {
        const res = await gradebookService.getTeacherGradebook(selectedClassSubjectId);
        if (isMounted && res?.data) {
          setGradebook(res.data);
        }
      } catch (err) {
        if (isMounted) {
          const status = err?.response?.status || err?.statusCode;
          if (status === 404) {
            setFetchErrorMsg("Belum ada data nilai atau penilaian pada kelas ini.");
          } else {
            setFetchErrorMsg(err?.response?.data?.message || err?.message || "Gagal memuat buku nilai kelas.");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadGradebook();
    return () => {
      isMounted = false;
    };
  }, [selectedClassSubjectId]);

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        classSubjectId: selectedClassSubjectId,
        gradeCategoryId: assessmentForm.gradeCategoryId,
        title: assessmentForm.title,
        description: assessmentForm.description,
        assessmentType: parseInt(assessmentForm.assessmentType),
        maxScore: parseFloat(assessmentForm.maxScore),
        publishAt: new Date().toISOString(),
        dueDate: new Date(assessmentForm.dueDate).toISOString(),
        isPublished: assessmentForm.isPublished,
      };

      await gradebookService.createAssessment(payload);
      setShowAssessmentModal(false);
      fetchGradebook(selectedClassSubjectId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal membuat penilaian.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenBulkGrade = (assessment) => {
    setSelectedAssessment(assessment);
    const initialScores = {};
    if (gradebook?.studentRows) {
      gradebook.studentRows.forEach((row) => {
        const gradeItem = row.assessmentGrades?.[assessment.id];
        initialScores[row.studentId] = {
          rawScore: gradeItem ? gradeItem.rawScore : "",
          remarks: gradeItem ? gradeItem.remarks || "" : "",
        };
      });
    }
    setBulkScores(initialScores);
    setShowBulkModal(true);
  };

  const handleSaveBulkGrade = async (publishImmediately = false) => {
    if (!selectedAssessment) return;
    setSubmitting(true);
    try {
      const items = Object.entries(bulkScores)
        .filter(([_, data]) => data.rawScore !== "" && !isNaN(data.rawScore))
        .map(([studentId, data]) => ({
          studentId,
          rawScore: parseFloat(data.rawScore),
          remarks: data.remarks,
        }));

      await gradebookService.bulkGrade({
        assessmentId: selectedAssessment.id,
        publishImmediately,
        items,
      });

      setShowBulkModal(false);
      fetchGradebook(selectedClassSubjectId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan nilai.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportCsv = async (e) => {
    e.preventDefault();
    if (!csvFile || !selectedAssessment) return;
    setSubmitting(true);
    try {
      const res = await gradebookService.importCsv(selectedAssessment.id, csvFile);
      alert(`Berhasil mengimpor ${res.data?.importedCount || 0} nilai.`);
      setShowBulkModal(false);
      fetchGradebook(selectedClassSubjectId);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengimpor file CSV.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = (assessmentId) => {
    window.open(gradebookService.getExportCsvUrl(assessmentId), "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📖</div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Buku Nilai (Gradebook)</h3>
            <p className="text-xs text-slate-400">Pilih mata pelajaran untuk mengelola nilai & penilaian.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClassSubjectId}
            onChange={(e) => setSelectedClassSubjectId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {classSubjects.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.className || cs.class?.name} - {cs.subjectName || cs.teacherSubject?.subject?.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAssessmentModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <span>+</span> Buat Penilaian
          </button>
        </div>
      </div>

      {/* Class Statistics Banner */}
      {gradebook && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-mono block">Rata-Rata Kelas</span>
            <span className="text-xl font-bold text-indigo-400">{gradebook.classAverage}</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-mono block">Nilai Tertinggi</span>
            <span className="text-xl font-bold text-emerald-400">{gradebook.classHighest}</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-mono block">Nilai Terendah</span>
            <span className="text-xl font-bold text-amber-400">{gradebook.classLowest}</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-mono block">Total Siswa</span>
            <span className="text-xl font-bold text-slate-200">{gradebook.totalStudents} Siswa</span>
          </div>
        </div>
      )}

      {/* Gradebook Matrix Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">Memuat buku nilai...</div>
      ) : fetchErrorMsg ? (
        <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-700 text-slate-300 font-medium">
          {fetchErrorMsg}
        </div>
      ) : !gradebook || !gradebook.studentRows || gradebook.studentRows.length === 0 ? (
        <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-700 text-slate-400">
          Belum ada data siswa atau penilaian pada kelas ini.
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-700">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-900 z-10 w-48">Siswa (NIS)</th>
                  {gradebook.assessments.map((ass) => (
                    <th key={ass.id} className="p-3 min-w-[130px] border-l border-slate-800">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 truncate max-w-[90px]" title={ass.title}>
                            {ass.title}
                          </span>
                          <button
                            onClick={() => handleOpenBulkGrade(ass)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded"
                            title="Input Nilai & Import CSV"
                          >
                            Input
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Max: {ass.maxScore}</span>
                          <span className="text-indigo-300 font-mono">{ass.gradeCategoryName}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="p-3 border-l border-slate-700 text-center font-bold text-indigo-300">Skor Akhir</th>
                  <th className="p-3 text-center font-bold">Huruf</th>
                  <th className="p-3 text-center font-bold">Ranking</th>
                  <th className="p-3 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {gradebook.studentRows.map((row) => (
                  <tr key={row.studentId} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 sticky left-0 bg-slate-800/95 font-medium text-slate-100 z-10 border-r border-slate-700/50">
                      <div className="truncate max-w-[180px]" title={row.studentName}>{row.studentName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{row.studentNis}</span>
                    </td>
                    {gradebook.assessments.map((ass) => {
                      const grade = row.assessmentGrades?.[ass.id];
                      return (
                        <td key={ass.id} className="p-3 border-l border-slate-800 font-mono text-center">
                          {grade ? (
                            <div className="flex flex-col items-center">
                              <span className="font-semibold text-slate-200">{grade.rawScore}</span>
                              <span className="text-[9px] text-slate-400">
                                {grade.letterGrade} ({grade.predicate})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 border-l border-slate-700 text-center font-bold text-indigo-400 font-mono">
                      {row.finalSubjectScore}
                    </td>
                    <td className="p-3 text-center font-extrabold text-slate-200">
                      {row.finalLetterGrade}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-amber-400">
                      #{row.classRank}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.isPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {row.isPassed ? "LULUS" : "REMIDIAL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Buat Penilaian */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Buat Penilaian Baru</h3>
            <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Judul Penilaian</label>
                <input
                  type="text"
                  required
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  placeholder="Contoh: Kuis 1 HTML & CSS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori</label>
                  <select
                    value={assessmentForm.gradeCategoryId}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, gradeCategoryId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.weight}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Skor Maksimum</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={assessmentForm.maxScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, maxScore: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipe Assessment</label>
                  <select
                    value={assessmentForm.assessmentType}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0}>Kuis</option>
                    <option value={1}>Tugas</option>
                    <option value={2}>UTS</option>
                    <option value={3}>UAS</option>
                    <option value={4}>Praktikum</option>
                    <option value={5}>Observasi</option>
                    <option value={6}>Proyek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tenggat Waktu (Due)</label>
                  <input
                    type="date"
                    required
                    value={assessmentForm.dueDate}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, dueDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Deskripsi</label>
                <textarea
                  rows="2"
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                  placeholder="Keterangan tugas/ujian..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPub"
                  checked={assessmentForm.isPublished}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, isPublished: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="isPub" className="text-slate-300">Publikasikan ke Siswa & Kirim Notifikasi</label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
                >
                  {submitting ? "Membuat..." : "Buat Penilaian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Nilai / Bulk Grading */}
      {showBulkModal && selectedAssessment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Input Nilai: {selectedAssessment.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Skor Maksimum: {selectedAssessment.maxScore}
                </p>
              </div>
              <button
                onClick={() => handleExportCsv(selectedAssessment.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg flex items-center gap-1"
              >
                📥 Export CSV
              </button>
            </div>

            {/* CSV Import Banner */}
            <form onSubmit={handleImportCsv} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 flex items-center justify-between gap-3 text-xs">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600"
              />
              <button
                type="submit"
                disabled={!csvFile || submitting}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-medium shrink-0"
              >
                Import CSV
              </button>
            </form>

            <div className="overflow-y-auto flex-1 border border-slate-700/60 rounded-lg divide-y divide-slate-700/50">
              {gradebook?.studentRows.map((row) => (
                <div key={row.studentId} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-700/20 text-xs">
                  <div className="w-1/3">
                    <span className="font-semibold text-slate-200 block truncate">{row.studentName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{row.studentNis}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max={selectedAssessment.maxScore}
                      step="0.1"
                      placeholder="Skor"
                      value={bulkScores[row.studentId]?.rawScore ?? ""}
                      onChange={(e) =>
                        setBulkScores({
                          ...bulkScores,
                          [row.studentId]: {
                            ...bulkScores[row.studentId],
                            rawScore: e.target.value,
                          },
                        })
                      }
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Catatan/Remarks"
                      value={bulkScores[row.studentId]?.remarks ?? ""}
                      onChange={(e) =>
                        setBulkScores({
                          ...bulkScores,
                          [row.studentId]: {
                            ...bulkScores[row.studentId],
                            remarks: e.target.value,
                          },
                        })
                      }
                      className="w-40 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveBulkGrade(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs"
              >
                Simpan Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveBulkGrade(true)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20"
              >
                {submitting ? "Menyimpan..." : "Simpan & Publikasikan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
