"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Send,
  MessageSquare,
  ShieldCheck,
  Building2,
  ChevronDown
} from "lucide-react";
import proposalService from "@/services/proposalService";

export default function OsisProposalTab({ proposals = [], onStatusUpdate }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [fetchedProposals, setFetchedProposals] = useState([]);

  React.useEffect(() => {
    if (proposals.length === 0) {
      proposalService.getProposals().then((res) => {
        if (Array.isArray(res)) setFetchedProposals(res);
      });
    }
  }, [proposals]);

  const listToRender = proposals.length > 0 ? proposals : fetchedProposals;

  const filteredProposals = listToRender.filter((prop) => {
    const matchesSearch =
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.organization.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "semua") return matchesSearch;
    if (statusFilter === "menunggu") return matchesSearch && prop.status.includes("Menunggu");
    if (statusFilter === "disetujui") return matchesSearch && prop.status === "Disetujui";
    if (statusFilter === "revisi") return matchesSearch && (prop.status === "Perlu Perbaikan" || prop.status === "Ditolak");
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    if (status.includes("Menunggu")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          <span>{status}</span>
        </span>
      );
    }
    if (status === "Disetujui") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Disetujui</span>
        </span>
      );
    }
    if (status.includes("Diteruskan")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2c1ee8] border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Diteruskan ke Guru & Super Admin</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5" />
        <span>{status}</span>
      </span>
    );
  };

  const handleActionStatus = (newStatus) => {
    if (!selectedProposal) return;

    proposalService.updateProposalStatus(selectedProposal.id, newStatus, noteText).catch((err) => {
      console.warn("Async proposal status update warning:", err);
    });

    if (onStatusUpdate) {
      onStatusUpdate(selectedProposal.id, newStatus, noteText);
    }
    selectedProposal.status = newStatus;
    selectedProposal.notes = noteText || selectedProposal.notes;
    setSelectedProposal(null);
    setNoteText("");
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul proposal atau organisasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 text-sm transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "semua", label: "Semua Proposal" },
            { id: "menunggu", label: "Menunggu OSIS" },
            { id: "disetujui", label: "Disetujui" },
            { id: "revisi", label: "Perlu Revisi" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#2c1ee8] text-white shadow-md shadow-blue-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Proposal Table / Card List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2c1ee8]" />
            <span>Daftar Proposal Masuk ({filteredProposals.length})</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">Peninjauan Awal OSIS (Opsional)</span>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-semibold">Tidak ada proposal yang sesuai filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProposals.map((prop) => (
              <div
                key={prop.id}
                className="p-5 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(prop.status)}
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                      {prop.organization}
                    </span>
                    <span className="text-xs text-gray-400">Tgl: {prop.submittedDate}</span>
                  </div>

                  <h4 className="text-base font-extrabold text-gray-900 leading-snug">
                    {prop.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{prop.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    onClick={() => setSelectedProposal(prop)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-[#2c1ee8] hover:bg-blue-100 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review & Verifikasi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-[#2c1ee8] uppercase tracking-wider">
                  Review Proposal OSIS
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
                    <span>{selectedProposal.fileName || "Dokumen_Proposal.pdf"}</span>
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
                  Catatan Verifikasi OSIS:
                </label>
                <textarea
                  rows={3}
                  placeholder="Tambahkan instruksi, masukan revisi, atau alasan persetujuan untuk organisasi pengaju..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#2c1ee8]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={() => handleActionStatus("Perlu Perbaikan")}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Minta Revisi
              </button>
              <button
                onClick={() => handleActionStatus("Diteruskan ke Guru & Super Admin")}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-[#2c1ee8] hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Teruskan ke Guru & Super Admin
              </button>
              <button
                onClick={() => handleActionStatus("Disetujui")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all shadow-md cursor-pointer"
              >
                Setujui Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
