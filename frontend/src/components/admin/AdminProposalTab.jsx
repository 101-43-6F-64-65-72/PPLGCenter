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

  // Clean [SEED] prefix first if present
  let temp = titleStr.replace(/^\[SEED\]\s*/i, "");

  // Match optional bracket like [[SEED] Klub...] or [OSIS] Title
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

export default function AdminProposalTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // 'semua' | 'pending_admin' | 'approved' | 'rejected'
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [adminNote, setAdminNote] = useState("");
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
      if (!res || !res.success) {
        setApiState("error");
        setErrorMessage(res?.message || "Gagal mengambil data proposal.");
        setProposals([]);
        return;
      }

      const items = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
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
            statusText = reviewerName ? `Disetujui oleh ${reviewerName}` : "Disetujui Admin";
            statusKey = "approved";
            badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
          } else if (statusVal === 2 || statusVal === "Rejected") {
            statusText = reviewerName ? `Ditolak oleh ${reviewerName}` : "Ditolak Admin";
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
      setErrorMessage(err?.message || "Gagal memuat data proposal.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) fetchProposals();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchProposals]);

  const filteredProposals = proposals.filter((item) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = (item.title || "").toLowerCase().includes(q);
    const orgMatch = (item.organization || "").toLowerCase().includes(q);
    const submitterMatch = (item.submittedByUserName || "").toLowerCase().includes(q);
    const matchesSearch = titleMatch || orgMatch || submitterMatch;

    if (!matchesSearch) return false;
    if (statusFilter === "semua") return true;
    if (statusFilter === "pending_admin" || statusFilter === "pending") return item.statusKey === "pending";
    if (statusFilter === "approved") return item.statusKey === "approved";
    if (statusFilter === "rejected") return item.statusKey === "rejected";

    return true;
  });

  const handleUpdateStatus = async (proposalId, statusNum) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await proposalService.updateProposalStatus(proposalId, {
        status: statusNum,
        rejectionReason: adminNote || (statusNum === 2 ? "Ditolak oleh Admin" : ""),
      });
      if (res && res.success) {
        setSelectedProposal(null);
        setAdminNote("");
        await fetchProposals();
      } else {
        alert(res?.message || "Gagal memperbarui status proposal.");
      }
    } catch (err) {
      alert(err?.message || "Gagal memperbarui status proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul proposal, pengaju, atau organisasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2c1ee8] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { id: "semua", label: "Semua Proposal" },
            { id: "pending_admin", label: "Menunggu Approval" },
            { id: "approved", label: "Disetujui" },
            { id: "rejected", label: "Ditolak" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#2c1ee8] text-white"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-between gap-3 text-rose-700 text-xs font-bold">
          <span>{errorMessage}</span>
          <button
            onClick={fetchProposals}
            className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs hover:bg-rose-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Proposal Table Container wrapped in AnimatedContent */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2c1ee8]" />
            <span>Persetujuan Final Proposal ({filteredProposals.length})</span>
          </h3>
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
            <div className="divide-y divide-slate-100">
              {filteredProposals.map((prop) => (
                <div key={prop.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold border ${prop.badgeStyle}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{prop.statusText}</span>
                      </span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {prop.organization}
                      </span>
                      <span className="text-slate-500">Pengaju: {prop.submittedByUserName} • {prop.submittedDate}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {prop.title}
                    </h4>

                    {prop.rejectionReason && (
                      <p className="text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
                        Catatan Reviu: {prop.rejectionReason}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProposal(prop);
                      setAdminNote(prop.rejectionReason || "");
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all cursor-pointer shrink-0 self-start md:self-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Verifikasi Admin</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-10 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">Belum Ada Proposal Ditemukan</h4>
            </div>
          )}
        </AnimatedContent>
      </div>

      {/* Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-lg border border-slate-200 p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  VERIFIKASI PROPOSAL ADMIN
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedProposal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-md cursor-pointer"
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
                  {selectedProposal.fileUrl ? (
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
                  Catatan Reviu / Rejection Reason:
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Tambahkan alasan penolakan, disposisi, atau instruksi persetujuan..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
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
                <span>ACC (Disetujui Admin)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
