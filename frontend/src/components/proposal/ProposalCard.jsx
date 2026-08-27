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
      className={`relative w-full rounded-none border bg-white p-4 sm:p-5 shadow-xs transition-colors space-y-3 text-left ${
        isPinned
          ? "border-blue-300 bg-blue-50/15"
          : isRejected
          ? "border-rose-200"
          : "border-slate-200"
      }`}
    >
      {/* Top Header Row: Meta Badges, Title, Status & Pin */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Meta Badges */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-none font-bold font-mono text-[10px] uppercase bg-[#2C1EE8] text-white">
                <Pin className="w-3 h-3 fill-white" />
                <span>Dipin</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-none font-bold font-mono text-[10px] uppercase bg-blue-50 text-[#2C1EE8] border border-blue-200">
              <FileText className="w-3 h-3 shrink-0" />
              <span>{proposal.organization}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-slate-500 text-[10px] font-mono font-medium bg-slate-100 px-2 py-0.2 rounded-none border border-slate-200 uppercase">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{proposal.createdAt}</span>
            </span>
          </div>

          {/* Proposal Title */}
          <h3
            className="text-base sm:text-lg font-bold uppercase text-slate-900 leading-snug line-clamp-2"
            title={proposal.title}
          >
            {proposal.title}
          </h3>
        </div>

        {/* Status Badge & Pin Button */}
        <div className="flex items-center gap-1.5 shrink-0 self-start">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold font-mono uppercase border ${statusConfig.style}`}>
            <StatusIcon className="w-3 h-3 shrink-0" />
            <span>{proposal.status}</span>
          </span>

          <button
            type="button"
            onClick={() => onTogglePin && onTogglePin(proposal.id)}
            title={isPinned ? "Lepas sematan" : "Sematkan proposal ke paling atas"}
            className={`p-1.5 rounded-none transition-colors cursor-pointer border ${
              isPinned
                ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                : "bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-white" : ""}`} />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-normal">
        {proposal.description}
      </p>

      {/* 🔴 Rejection Notice / Admin Feedback Box */}
      {isRejected && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 space-y-2 rounded-none">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-rose-200/60 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-rose-800 uppercase tracking-wide">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Catatan Penolakan Pembina / Admin</span>
            </div>
            {proposal.reviewerName && (
              <span className="text-[10px] font-bold uppercase font-mono text-rose-700 bg-white px-2 py-0.2 rounded-none border border-rose-200">
                Oleh: {proposal.reviewerName}
              </span>
            )}
          </div>

          <p className="text-xs font-normal leading-relaxed bg-white p-2.5 rounded-none border border-rose-100 text-rose-950 italic">
            "{feedbackText || "Proposal belum memenuhi kriteria. Silakan periksa berkas dan deskripsi proposal Anda."}"
          </p>

          <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10.5px] font-medium text-rose-700">
              {proposal.reviewedAt ? `Direview: ${proposal.reviewedAt}` : "Silakan perbaiki proposal ini untuk diajukan ulang."}
            </span>

            <button
              type="button"
              onClick={() => onEdit && onEdit(proposal)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit & Ajukan Ulang</span>
            </button>
          </div>
        </div>
      )}

      {/* 🟢 Approved Feedback Box (if comments present) */}
      {isApproved && feedbackText && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5 rounded-none">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-emerald-200/60 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-800 uppercase tracking-wide">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Catatan Pembina / Admin</span>
            </div>
            {proposal.reviewerName && (
              <span className="text-[10px] font-bold uppercase font-mono text-emerald-700 bg-white px-2 py-0.2 rounded-none border border-emerald-200">
                Oleh: {proposal.reviewerName}
              </span>
            )}
          </div>
          <p className="text-xs font-normal leading-relaxed bg-white p-2.5 rounded-none border border-emerald-100 text-emerald-950 italic">
            "{feedbackText}"
          </p>
        </div>
      )}

      {/* Bottom Actions Bar (Full Horizontal Row) */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {proposal.fileUrl ? (
            <a
              href={proposal.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-blue-50 text-[#2C1EE8] text-xs font-bold uppercase tracking-wider hover:bg-[#2C1EE8] hover:text-white transition-colors border border-blue-200 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lihat PDF Proposal</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          ) : (
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-none border border-slate-200 uppercase">
              Dokumen Tidak Tersedia
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit && onEdit(proposal)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete && onDelete(proposal.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </article>
  );
}
