"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { FileText } from "@/components/common/Icons";

const statusStyles = {
  "Menunggu Review": "bg-amber-50 text-amber-700",
  Disetujui: "bg-emerald-50 text-emerald-700",
  Ditolak: "bg-rose-50 text-rose-700",
};

export default function ProposalCard({
  proposal,
  onEdit,
  onDelete,
  onRemoveFile,
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute right-4 top-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[proposal.status] || "bg-slate-100 text-slate-700"}`}
        >
          {proposal.status}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2C1EE8]">
              <FileText className="h-4 w-4" />
              <span>{proposal.organization}</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {proposal.title}
            </h3>
          </div>
        </div>

        <p className="text-sm leading-6 text-gray-600">
          {proposal.description}
        </p>

        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Daftar File</p>
              <p className="text-xs text-gray-500">
                {proposal.files?.length
                  ? `${proposal.files.length} file`
                  : "Belum ada dokumen."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {proposal.files?.length ? (
              proposal.files.map((file) => (
                <div
                  key={file.id}
                  className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <span>📄</span>
                      <span>{file.name}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </p>
                  </div>
                  {file.url && file.url.startsWith("http") ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-[#2C1EE8] px-4 py-2 text-xs font-bold text-[#2C1EE8] hover:bg-[#2C1EE8] hover:text-white transition-all shadow-2xs"
                    >
                      Lihat Dokumen
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-400">
                      Tidak Tersedia
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveFile(proposal.id, file.id)}
                    className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    🗑 Hapus
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Belum ada dokumen.</p>
            )}
          </div>
        </div>

        <div className="grid gap-3 border-t border-gray-100 pt-4 text-sm text-gray-500 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="font-medium text-gray-900">Tanggal Upload</p>
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <span>🕒</span>
              <span>{proposal.createdAt}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(proposal)}
        >
          ✏ Edit
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => onDelete(proposal.id)}
        >
          🗑 Hapus
        </Button>
      </div>
    </article>
  );
}
