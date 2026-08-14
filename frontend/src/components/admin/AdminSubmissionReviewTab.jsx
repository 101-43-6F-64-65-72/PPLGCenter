"use client";

import { useState, useEffect, useCallback } from "react";
import { assignmentService } from "@/services/assignmentService";
import { submissionService } from "@/services/submissionService";
import { CheckCircle, AlertCircle, FileText, ExternalLink, ArrowLeft } from "lucide-react";

export default function AdminSubmissionReviewTab({ assignment, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  useEffect(() => {
    async function load() {
      if (!assignment) return;
      try {
        setLoading(true);
        setError("");
        const res = await assignmentService.getSubmissions(assignment.id);
        setSubmissions(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Gagal memuat daftar submisi");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [assignment]);

  async function fetchSubmissions() {
    if (!assignment) return;
    try {
      setLoading(true);
      setError("");
      const res = await assignmentService.getSubmissions(assignment.id);
      setSubmissions(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat daftar submisi");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenGrading(sub) {
    setSelectedSub(sub);
    setScore(sub.score !== null && sub.score !== undefined ? sub.score.toString() : "");
    setFeedback(sub.feedback || "");
  }

  async function handleGradeSubmit(e) {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      setSubmittingGrade(true);
      const parsedScore = parseFloat(score);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > assignment.maxScore) {
        alert(`Skor harus antara 0 dan ${assignment.maxScore}`);
        setSubmittingGrade(false);
        return;
      }
      await submissionService.grade(selectedSub.id, {
        score: parsedScore,
        feedback: feedback.trim(),
      });
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memberikan nilai");
    } finally {
      setSubmittingGrade(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <button
          onClick={onBack}
          className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Review Submisi: {assignment?.title}</h2>
          <p className="text-sm text-slate-500">{assignment?.className} — {assignment?.subjectName} (Maks Skor: {assignment?.maxScore})</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat submisi siswa...</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Belum ada siswa yang mengumpulkan tugas ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="p-4">NIS & Nama Siswa</th>
                  <th className="p-4">Versi Terakhir</th>
                  <th className="p-4">Waktu Pengumpulan</th>
                  <th className="p-4">Status Pengumpulan</th>
                  <th className="p-4">Nilai</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      <div>{sub.studentName}</div>
                      <div className="text-xs text-slate-400 font-mono">NIS: {sub.studentNis}</div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      v{sub.latestVersion} ({sub.revisions?.length || 0} Histori)
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                      {new Date(sub.submittedAt).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4">
                      {sub.isLate ? (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">Terlambat</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">Tepat Waktu</span>
                      )}
                    </td>
                    <td className="p-4">
                      {sub.score !== null && sub.score !== undefined ? (
                        <span className="font-bold text-emerald-600">{sub.score} / {assignment.maxScore}</span>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Belum Dinilai</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenGrading(sub)}
                        className="px-3 py-1.5 text-xs bg-[#2c1ee8] text-white rounded hover:bg-[#2015be]"
                      >
                        Beri Nilai & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Grading & Revision History */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Review Submisi: {selectedSub.studentName}</h3>
                <p className="text-xs text-slate-500">Histori Pengumpulan & Penilaian</p>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* Revision History */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Histori Revisi</h4>
                <div className="space-y-2">
                  {selectedSub.revisions?.map((rev) => (
                    <div key={rev.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#2c1ee8]">Revisi v{rev.version} ({rev.submissionType})</span>
                        <span className="text-slate-400">{new Date(rev.createdAt).toLocaleString("id-ID")}</span>
                      </div>
                      {rev.textAnswer && <div className="text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200">{rev.textAnswer}</div>}
                      {rev.fileUrl && (
                        <div>
                          <a href={rev.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> Buka Berkas Submisi v{rev.version}
                          </a>
                        </div>
                      )}
                      {rev.linkUrl && (
                        <div>
                          <a href={rev.linkUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline flex items-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> {rev.linkUrl}
                          </a>
                        </div>
                      )}
                      {rev.comment && <div className="text-slate-500 italic">Catatan siswa: {rev.comment}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grading Form */}
              <form onSubmit={handleGradeSubmit} className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Form Penilaian</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Skor (Maksimal {assignment.maxScore})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={assignment.maxScore}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Upan Balik (Feedback Guru)
                  </label>
                  <textarea
                    rows="3"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Berikan umpan balik atau saran perbaikan..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSub(null)}
                    className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGrade}
                    className="px-4 py-2 text-sm bg-[#2c1ee8] text-white rounded-lg hover:bg-[#2015be] disabled:opacity-50"
                  >
                    {submittingGrade ? "Menyimpan..." : "Simpan Nilai"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
