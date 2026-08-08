"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import proposalService from "@/services/proposalService";
import AnimatedContent from "@/components/common/AnimatedContent";

/**
 * Robustly parses title and organization name from title string
 * E.g., "[[SEED] Klub Software Engineering (DevClub)] Testing semua"
 * -> org: "Klub Software Engineering (DevClub)", title: "Testing semua"
 */
function parseTitleAndOrg(rawTitle = "") {
  let titleStr = String(rawTitle).trim();
  let org = "Ekstrakurikuler";
  let cleanTitle = titleStr;

  let temp = titleStr.replace(/^\[SEED\]\s*/i, "");

  const bracketMatch = temp.match(/^\[+(.*?)\]+\s*(.*)$/);
  if (bracketMatch) {
    org = bracketMatch[1].replace(/\[SEED\]\s*/i, "").trim();
    cleanTitle = bracketMatch[2].trim() || temp;
  } else if (temp.startsWith("[")) {
    const endIdx = temp.indexOf("]");
    if (endIdx > 1) {
      org = temp.substring(1, endIdx).replace(/\[SEED\]\s*/i, "").trim();
      cleanTitle = temp.substring(endIdx + 1).trim() || temp;
    }
  }

  if (!org) org = "Ekstrakurikuler";
  return { organization: org, cleanTitle };
}

const ProposalSkeleton = () => (
  <div className="divide-y divide-gray-100 animate-pulse">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 bg-slate-200 rounded-full" />
          <div className="h-5 w-32 bg-slate-200 rounded-md" />
        </div>
        <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
        <div className="h-4 w-full bg-slate-100 rounded-md" />
      </div>
    ))}
  </div>
);

export default function GuruProposalTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // 'semua' | 'pending' | 'approved' | 'rejected'
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [teacherNote, setTeacherNote] = useState("");
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiState, setApiState] = useState("loading"); // "loading" | "success" | "empty" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    setApiState("loading");
    setErrorMessage("");

    try {
      const res = await proposalService.getProposals();
      if (!res.success) {
        setApiState("error");
        setErrorMessage(res.message || "Gagal mengambil data proposal dari server.");
        setProposals([]);
        return;
      }

      const items = Array.isArray(res.data) ? res.data : [];
      if (items.length > 0) {
        const mapped = items.map((item) => {
          const rawTitle = item.title || item.Title || "";
          const { organization, cleanTitle } = parseTitleAndOrg(rawTitle);

          const statusVal = item.status ?? item.Status ?? 0;
          const reviewerName = item.reviewedByUserName || item.ReviewedByUserName || "";
          let statusText = "Menunggu Review";
          let statusKey = "pending";
          let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";

          if (statusVal === 1 || statusVal === "Approved") {
            statusText = reviewerName ? `Disetujui oleh ${reviewerName}` : "Disetujui Guru";
            statusKey = "approved";
            badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
          } else if (statusVal === 2 || statusVal === "Rejected") {
            statusText = reviewerName ? `Ditolak oleh ${reviewerName}` : "Ditolak Guru";
            statusKey = "rejected";
            badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
          }

          const submittedByName =
            item.submittedByUserName ||
            item.SubmittedByUserName ||
            "Pengurus OSIS / Ekstrakurikuler";

          return {
            id: item.id || item.Id,
            organization,
            title: cleanTitle,
            fullTitle: rawTitle,
            description: item.description || item.Description || "-",
            fileUrl: item.fileUrl || item.FileUrl || "",
            statusNum: statusVal,
            statusKey,
            statusText,
            badgeStyle,
            rejectionReason: item.rejectionReason || item.RejectionReason || "",
            submittedByUserId: item.submittedByUserId || item.SubmittedByUserId,
            submittedByUserName: submittedByName,
            reviewedByUserId: item.reviewedByUserId || item.ReviewedByUserId,
            reviewedByUserName: item.reviewedByUserName || item.ReviewedByUserName || null,
            submittedDate: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Baru saja",
            reviewedDate: item.reviewedAt
              ? new Date(item.reviewedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null,
          };
        });
        setProposals(mapped);
        setApiState("success");
      } else {
        setProposals([]);
        setApiState("empty");
      }
    } catch (err) {
      setApiState("error");
      setErrorMessage("Terjadi kesalahan sistem saat memuat proposal.");
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredProposals = proposals.filter((prop) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (prop.title || "").toLowerCase().includes(q) ||
      (prop.organization || "").toLowerCase().includes(q) ||
      (prop.submittedByUserName || "").toLowerCase().includes(q);
    if (statusFilter === "semua") return matchesSearch;
    return matchesSearch && prop.statusKey === statusFilter;
  });

  const handleUpdateStatus = async (proposalId, statusNum) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await proposalService.updateProposalStatus(proposalId, statusNum, teacherNote);
      await fetchProposals();
    } catch (err) {
      console.warn("Async proposal status update warning:", err);
    } finally {
      setIsSubmitting(false);
    }
    setSelectedProposal(null);
    setTeacherNote("");
  };

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) fetchProposals();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchProposals]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari proposal, organisasi, atau pengaju..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
          />
        </div>

        {/* Filter Tabs & Authority Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
            {[
              { id: "semua", label: "Semua" },
              { id: "pending", label: "Menunggu" },
              { id: "approved", label: "Disetujui" },
              { id: "rejected", label: "Ditolak" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-[#2c1ee8] shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-extrabold text-[#2c1ee8] bg-blue-50 px-3.5 py-2 rounded-2xl border border-blue-100">
            <ShieldCheck className="w-4 h-4" />
            <span>Wewenang Guru Pembina</span>
          </div>
        </div>
      </div>

      {/* Proposal Table Container wrapped in AnimatedContent */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2c1ee8]" />
            <span>Persetujuan Proposal Binaan ({filteredProposals.length})</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">Verifikasi Guru Pembina</span>
        </div>

        <AnimatedContent isLoading={isLoading} skeleton={<ProposalSkeleton />}>
          {apiState === "error" ? (
            /* Error State UI */
            <div className="p-10 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Gagal Memuat Proposal</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={fetchProposals}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-[#2218a3] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : filteredProposals.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredProposals.map((prop) => (
                <div key={prop.id} className="p-5 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${prop.badgeStyle}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{prop.statusText}</span>
                      </span>
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md">
                        {prop.organization}
                      </span>
                      <span className="text-xs text-gray-400">Pengaju: {prop.submittedByUserName}</span>
                      <span className="text-xs text-gray-400">• Tanggal: {prop.submittedDate}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-gray-900 leading-snug">
                      {prop.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{prop.description}</p>

                    {prop.rejectionReason && (
                      <p className="text-xs text-rose-700 font-semibold bg-rose-50 px-3 py-1 rounded-xl border border-rose-100">
                        Catatan Reviu: {prop.rejectionReason}
                      </p>
                    )}

                    {prop.reviewedByUserName && (
                      <p className="text-xs text-gray-400 font-medium">
                        Direviu oleh: <strong className="text-gray-700">{prop.reviewedByUserName}</strong> {prop.reviewedDate && `(${prop.reviewedDate})`}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProposal(prop);
                      setTeacherNote(prop.rejectionReason || "");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all cursor-pointer shadow-sm active:scale-95 self-start md:self-center"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Guru</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-[#2c1ee8] rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Belum Ada Proposal Ditemukan</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Tidak ada proposal yang sesuai dengan kriteria pencarian atau filter status yang dipilih.
              </p>
            </div>
          )}
        </AnimatedContent>
      </div>

      {/* Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-[#2c1ee8] uppercase tracking-wider">
                  Verifikasi Proposal Guru Pembina
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-1">
                  {selectedProposal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Organisasi Pengaju:</span>
                  <span className="font-extrabold text-gray-900">{selectedProposal.organization}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Diajukan Oleh:</span>
                  <span className="font-semibold text-gray-800">{selectedProposal.submittedByUserName} ({selectedProposal.submittedDate})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-400 block font-bold mb-1">File Dokumen PDF:</span>
                  {selectedProposal.fileUrl && selectedProposal.fileUrl.startsWith("http") ? (
                    <a
                      href={selectedProposal.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 font-bold text-xs text-[#2c1ee8] hover:bg-[#2c1ee8] hover:text-white transition-all shadow-2xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Lihat Dokumen PDF Proposal</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 inline-block">
                      Dokumen Tidak Tersedia
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Deskripsi Kegiatan:
                </span>
                <p className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs sm:text-sm leading-relaxed">
                  {selectedProposal.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Catatan Pembina / Rejection Reason:
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Tambahkan alasan penolakan, disposisi, atau instruksi persetujuan..."
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#2c1ee8]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedProposal.id, 2)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak Proposal</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedProposal.id, 1)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ACC Proposal (Disetujui Guru)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
