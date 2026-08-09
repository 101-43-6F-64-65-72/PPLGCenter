"use client";

import React from "react";
import { FileText, Pin, Trash2, Edit3, ExternalLink, ShieldCheck, Clock } from "lucide-react";

const getStatusStyle = (status = "") => {
  if (status.includes("Disetujui")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status.includes("Ditolak")) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
};

export default function ProposalCard({
  proposal,
  isPinned = false,
  onTogglePin,
  onEdit,
  onDelete,
}) {
  return (
    <article
      className={`relative w-full rounded-3xl border bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 hover:shadow-md space-y-3.5 ${
        isPinned ? "border-blue-200 bg-blue-50/20 ring-1 ring-blue-500/20" : "border-gray-100"
      }`}
    >
      {/* Top Header Row: Title, Status Badge & Pin Action */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Meta Badges: Organization & Submission Date */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {isPinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-xs bg-[#2c1ee8] text-white shadow-2xs">
                <Pin className="w-3 h-3 fill-white" />
                <span>Dipin</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold bg-blue-50 text-[#2c1ee8] border border-blue-100">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{proposal.organization}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-semibold bg-gray-50 px-2.5 py-0.5 rounded-lg border border-gray-100">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>Tanggal: {proposal.createdAt}</span>
            </span>
          </div>

          {/* Proposal Title (Largest Text, max 2 lines with ellipsis) */}
          <h3
            className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug line-clamp-2"
            title={proposal.title}
          >
            {proposal.title}
          </h3>
        </div>

        {/* Status Badge & Pin Button */}
        <div className="flex items-center gap-2 flex-shrink-0 self-start">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black border ${getStatusStyle(proposal.status)}`}>
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
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

      {/* Short Description (Max 2 lines with ellipsis) */}
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
        {proposal.description}
      </p>

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
