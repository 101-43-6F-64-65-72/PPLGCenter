"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import osisRecruitmentService from "@/services/osisRecruitmentService";
import useAuth from "@/hooks/useAuth";
import {
  Users, Briefcase, CheckCircle2, XCircle, Clock, Send,
  Loader2, Filter, Plus, Award
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  Submitted: { label: "Diajukan", color: "bg-blue-50 border-blue-200 text-blue-700", icon: Clock },
  TeacherReviewed: { label: "Direview Guru", color: "bg-purple-50 border-purple-200 text-purple-700", icon: CheckCircle2 },
  ChairmanRecommended: { label: "Rekomendasi Ketua", color: "bg-amber-50 border-amber-200 text-amber-700", icon: Award },
  Approved: { label: "Diterima", color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: CheckCircle2 },
  Rejected: { label: "Ditolak", color: "bg-red-50 border-red-200 text-red-700", icon: XCircle },
};

export default function OsisRecruitmentPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.OSIS]}>
      <RecruitmentContent />
    </AuthGuard>
  );
}

function RecruitmentContent() {
  const { user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deptFilter, setDeptFilter] = useState("Semua");
  const [applyForm, setApplyForm] = useState({ positionId: "", motivation: "", portfolioUrl: "" });

  const loadData = useCallback(async () => {
    setLoadingPositions(true);
    try {
      const [posRes, appRes] = await Promise.all([
        osisRecruitmentService.getPositions(),
        user?.id ? osisRecruitmentService.getApplications({ studentId: user.id }) : Promise.resolve({ data: { data: [] } }),
      ]);
      setPositions(posRes?.data?.data ?? []);
      setMyApplications(appRes?.data?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPositions(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyForm.positionId) return;
    setSubmitting(true);
    try {
      await osisRecruitmentService.submitApplication({
        osisPositionId: applyForm.positionId,
        motivation: applyForm.motivation,
        portfolioUrl: applyForm.portfolioUrl || undefined,
      });
      toast.success("Pendaftaran berhasil diajukan!");
      setActiveForm(null);
      setApplyForm({ positionId: "", motivation: "", portfolioUrl: "" });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Gagal mendaftar");
    } finally {
      setSubmitting(false);
    }
  };

  const depts = ["Semua", ...new Set(positions.map((p) => p.department))];
  const filtered = deptFilter === "Semua" ? positions : positions.filter((p) => p.department === deptFilter);
  const appliedPositionIds = new Set(myApplications.map((a) => a.osisPositionId));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-20">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold tracking-wide mb-3 border border-emerald-200">
            <Users className="w-4 h-4" />
            <span>REKRUTMEN PENGURUS OSIS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Daftar Pengurus OSIS</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Bergabunglah dalam kepengurusan OSIS. Pilih posisi yang sesuai passion dan kemampuanmu.
          </p>
        </div>

        {/* My Applications */}
        {myApplications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide mb-3">Pendaftaran Saya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myApplications.map((app) => {
                const sc = STATUS_CONFIG[app.statusText] ?? STATUS_CONFIG.Submitted;
                const Icon = sc.icon;
                return (
                  <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2c1ee8] to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{app.positionTitle}</p>
                      <p className="text-xs text-gray-400">{app.department}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${sc.color}`}>
                      <Icon className="w-3 h-3" />
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Department filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {depts.map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                deptFilter === d
                  ? "bg-[#2c1ee8] text-white shadow-md shadow-blue-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Positions Grid */}
        {loadingPositions ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#2c1ee8] mb-3" />
            <p className="text-sm text-gray-500">Memuat posisi OSIS...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="font-bold text-gray-500">Belum ada posisi terbuka</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((pos) => {
              const alreadyApplied = appliedPositionIds.has(pos.id);
              const isFull = pos.filledCount >= pos.capacity;
              const isOpen = pos.isOpenForRecruitment && !isFull;

              return (
                <div key={pos.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        !pos.isOpenForRecruitment ? "bg-gray-100 text-gray-400" :
                        isFull ? "bg-red-50 text-red-500 border border-red-100" :
                        "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {!pos.isOpenForRecruitment ? "Ditutup" : isFull ? "Penuh" : "Terbuka"}
                      </span>
                    </div>
                    <h3 className="font-black text-gray-900 text-base mb-1">{pos.title}</h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{pos.department}</p>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">{pos.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <span>Kuota: <strong className="text-gray-700">{pos.filledCount}/{pos.capacity}</strong></span>
                      <span>{pos.academicYearName}</span>
                    </div>

                    {/* Capacity bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? "bg-red-400" : "bg-emerald-400"}`}
                        style={{ width: `${Math.min((pos.filledCount / pos.capacity) * 100, 100)}%` }}
                      />
                    </div>

                    {alreadyApplied ? (
                      <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 py-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sudah mendaftar</span>
                      </div>
                    ) : isOpen ? (
                      <button
                        onClick={() => {
                          setApplyForm({ positionId: pos.id, motivation: "", portfolioUrl: "" });
                          setActiveForm(`apply:${pos.id}`);
                        }}
                        className="w-full py-2.5 rounded-2xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Daftar Sekarang
                      </button>
                    ) : null}
                  </div>

                  {/* Inline Application Form */}
                  {activeForm === `apply:${pos.id}` && (
                    <form onSubmit={handleApply} className="border-t border-gray-100 p-5 space-y-3 bg-gray-50">
                      <p className="text-xs font-black text-gray-700 uppercase tracking-wide">Formulir Pendaftaran</p>
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Motivasi</label>
                        <textarea required rows={3}
                          value={applyForm.motivation}
                          onChange={(e) => setApplyForm({ ...applyForm, motivation: e.target.value })}
                          placeholder="Mengapa Anda ingin bergabung di posisi ini?"
                          className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 resize-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">URL Portofolio (opsional)</label>
                        <input type="text" value={applyForm.portfolioUrl}
                          onChange={(e) => setApplyForm({ ...applyForm, portfolioUrl: e.target.value })}
                          className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/30 bg-white"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setActiveForm(null)}
                          className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                          Batal
                        </button>
                        <button type="submit" disabled={submitting}
                          className="flex-1 py-2 rounded-xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
                          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Kirim
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
