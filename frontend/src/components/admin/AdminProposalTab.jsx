"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  Award,
  Send,
  AlertCircle
} from "lucide-react";
import proposalService from "@/services/proposalService";

export default function AdminProposalTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [proposals, setProposals] = useState([]);

  React.useEffect(() => {
    proposalService.getProposals().then((res) => {
      if (Array.isArray(res)) setProposals(res);
    });
  }, []);

  const filtered = proposals.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateStatus = (proposalId, newStatus) => {
    proposalService.updateProposalStatus(proposalId, newStatus, adminNote).catch((err) => {
      console.warn("Async proposal status update warning:", err);
    });

    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status: newStatus,
              notes: adminNote || p.notes,
            }
          : p
      )
    );
    setSelectedProposal(null);
    setAdminNote("");
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari proposal atau organisasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold text-[#2c1ee8] bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
          <ShieldCheck className="w-4 h-4" />
          <span>Wewenang Final: Super Admin & Waka Kesiswaan</span>
        </div>
      </div>

      {/* Proposal Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2c1ee8]" />
            <span>Persetujuan Final Proposal ({filtered.length})</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">Final Approval Waka</span>
        </div>

        <div className="divide-y divide-gray-100">
          {filtered.map((prop) => (
            <div key={prop.id} className="p-5 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2c1ee8] border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{prop.status}</span>
                  </span>
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {prop.organization}
                  </span>
                  <span className="text-xs text-gray-400">Tanggal: {prop.submittedDate}</span>
                </div>

                <h4 className="text-base font-extrabold text-gray-900 leading-snug">
                  {prop.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">{prop.description}</p>
                {prop.notes && (
                  <p className="text-xs text-[#2c1ee8] font-semibold bg-blue-50/60 px-3 py-1 rounded-xl">
                    Catatan Verifikator: {prop.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedProposal(prop)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>ACC Final Admin</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-[#2c1ee8] uppercase tracking-wider">
                  Approval Final Super Admin
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
                  <span className="text-xs text-gray-400 block font-bold">Tanggal Pengajuan:</span>
                  <span className="font-semibold text-gray-800">{selectedProposal.submittedDate}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-400 block font-bold mb-1">File Dokumen PDF:</span>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-300 font-bold text-xs text-[#2c1ee8]">
                    <FileText className="w-4 h-4" />
                    <span>{selectedProposal.fileName}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Ringkasan Deskripsi:
                </span>
                <p className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs sm:text-sm leading-relaxed">
                  {selectedProposal.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Catatan Surat Keputusan / Admin:
                </label>
                <textarea
                  rows={3}
                  placeholder="Tambahkan catatan SK, disposisi, atau instruksi persetujuan..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#2c1ee8]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={() => handleUpdateStatus(selectedProposal.id, "Perlu Perbaikan")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Minta Revisi
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedProposal.id, "Ditolak Super Admin")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Tolak
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedProposal.id, "Disetujui Super Admin")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ACC Final (Disetujui Super Admin)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
