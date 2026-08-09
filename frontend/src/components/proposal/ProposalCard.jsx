"use client";

import React from "react";
import {
  FileText, Pin, Trash2, Edit3, ExternalLink, ShieldCheck,
  Clock, AlertTriangle, CheckCircle2, XCircle, MessageSquare
} from "lucide-react";

const getStatusConfig = (status = "", rawStatus = 0) => {
  const statusStr = String(status).toLowerCase();
  if (rawStatus === 1 || rawStatus === "Approved" || statusStr.includes("disetujui")) {
    return {
      style: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    };
  }
  if (rawStatus === 2 || rawStatus === "Rejected" || statusStr.includes("ditolak")) {
    return {
      style: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
    };
  }
  return {
    style: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  };
};

export default function ProposalCard({
  proposal,
  isPinned = false,
  onTogglePin,
  onEdit,
  onDelete,
}) {
  const isRejected =
    proposal.rawStatus === 2 ||
    proposal.rawStatus === "Rejected" ||
    (typeof proposal.status === "string" && proposal.status.toLowerCase().includes("ditolak"));

  const isApproved =
    proposal.rawStatus === 1 ||
    proposal.rawStatus === "Approved" ||
    (typeof proposal.status === "string" && proposal.status.toLowerCase().includes("disetujui"));

  const feedbackText =
    proposal.rejectionReason || proposal.adminComment || proposal.teacherComment || "";

  const statusConfig = getStatusConfig(proposal.status, proposal.rawStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <article
      className={`relative w-full rounded-3xl border bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 hover:shadow-md space-y-4 ${
        isPinned
          ? "border-blue-300 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/20 ring-2 ring-blue-500/20"
          : isRejected
          ? "border-rose-200/90 bg-white"
          : "border-gray-100"
      }`}
    >
      {/* Top Header Row: Meta Badges, Title, Status & Pin */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          {/* Meta Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {isPinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] bg-[#2c1ee8] text-white shadow-2xs">
                <Pin className="w-3 h-3 fill-white" />
                <span>Dipin</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold bg-blue-50 text-[#2c1ee8] border border-blue-100">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>{proposal.organization}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-semibold bg-gray-50 px-2.5 py-0.5 rounded-lg border border-gray-100">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>Tanggal: {proposal.createdAt}</span>
            </span>
          </div>

          {/* Proposal Title */}
          <h3
            className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug line-clamp-2"
            title={proposal.title}
          >
            {proposal.title}
          </h3>
        </div>

        {/* Status Badge & Pin Button */}
        <div className="flex items-center gap-2 shrink-0 self-start">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black border ${statusConfig.style}`}>
            <StatusIcon className="w-4 h-4 shrink-0" />
            <span>{proposal.status}</span>
          </span>

          <button
            type="button"
            onClick={() => onTogglePin && onTogglePin(proposal.id)}
            title={isPinned ? "Lepas sematan" : "Sematkan proposal ke paling atas"}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isPinned
                ? "bg-[#2c1ee8] text-white shadow-xs"
                : "bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Pin className={`w-4 h-4 ${isPinned ? "fill-white" : ""}`} />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed font-normal">
        {proposal.description}
      </p>

      {/* 🔴 Rejection Notice / Admin Feedback Box */}
      {isRejected && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 space-y-2.5 shadow-xs transition-all">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-rose-200/60 pb-2">
            <div className="flex items-center gap-2 font-black text-xs text-rose-800 uppercase tracking-wide">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
              <span>Catatan Penolakan Pembina / Admin</span>
            </div>
            {proposal.reviewerName && (
              <span className="text-[11px] font-extrabold text-rose-700 bg-white/80 px-2.5 py-0.5 rounded-md border border-rose-200">
                Oleh: {proposal.reviewerName}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-semibold leading-relaxed bg-white/80 p-3 rounded-xl border border-rose-100 text-rose-950 italic">
            "{feedbackText || "Proposal belum memenuhi kriteria. Silakan periksa berkas dan deskripsi proposal Anda."}"
          </p>

          <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-rose-700/80">
              {proposal.reviewedAt ? `Direview pada: ${proposal.reviewedAt}` : "Silakan perbaiki proposal ini untuk diajukan ulang."}
            </span>

            <button
              type="button"
              onClick={() => onEdit && onEdit(proposal)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit & Ajukan Ulang</span>
            </button>
          </div>
        </div>
      )}

      {/* 🟢 Approved Feedback Box (if comments present) */}
      {isApproved && feedbackText && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 space-y-2 shadow-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-emerald-200/60 pb-2">
            <div className="flex items-center gap-2 font-black text-xs text-emerald-800 uppercase tracking-wide">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Catatan Pembina / Admin</span>
            </div>
            {proposal.reviewerName && (
              <span className="text-[11px] font-extrabold text-emerald-700 bg-white/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Oleh: {proposal.reviewerName}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100 text-emerald-950 italic">
            "{feedbackText}"
          </p>
        </div>
      )}

      {/* Bottom Actions Bar (Full Horizontal Row) */}
      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {proposal.fileUrl ? (
            <a
              href={proposal.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-[#2c1ee8] text-xs sm:text-sm font-bold hover:bg-[#2c1ee8] hover:text-white transition-all border border-blue-100 shadow-2xs"
            >
              <FileText className="w-4 h-4" />
              <span>Lihat PDF Proposal</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          ) : (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
              Dokumen Tidak Tersedia
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit && onEdit(proposal)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete && onDelete(proposal.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </article>
  );
}
