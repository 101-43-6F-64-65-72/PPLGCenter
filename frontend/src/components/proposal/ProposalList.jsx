"use client";

import React from "react";
import ProposalCard from "./ProposalCard";
import { FileText } from "@/components/common/Icons";

export default function ProposalList({
  proposals,
  onEdit,
  onDelete,
  onRemoveFile,
}) {
  if (!proposals.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#2C1EE8]">
          <FileText className="h-6 w-6" />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-lg font-semibold text-gray-900">
            Belum ada proposal yang diajukan.
          </p>
          <p className="text-sm text-gray-500">
            Silakan isi form di sebelah kiri untuk mengajukan proposal pertama
            Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onEdit={onEdit}
          onDelete={onDelete}
          onRemoveFile={onRemoveFile}
        />
      ))}
    </div>
  );
}
