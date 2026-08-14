"use client";

import React, { useState, useEffect, useMemo } from "react";
import ProposalCard from "./ProposalCard";
import { FileText, Pin, ChevronDown, PlusCircle, Search, X } from "lucide-react";

const PIN_STORAGE_KEY = "pplgcenter:pinned-proposals";
const INITIAL_LIMIT = 6;

export default function ProposalList({
  proposals = [],
  onEdit,
  onDelete,
}) {
  const [pinnedIds, setPinnedIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(PIN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_LIMIT);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua"); // 'semua' | 'pending' | 'approved' | 'rejected'

  // Debounce search input (300ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleTogglePin = (id) => {
    setPinnedIds((prev) => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter((pId) => pId !== id);
      } else {
        updated = [id, ...prev];
      }
      try {
        localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Filter proposals by debouncedSearch & statusFilter
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch =
        !debouncedSearch ||
        p.title?.toLowerCase().includes(debouncedSearch) ||
        p.organization?.toLowerCase().includes(debouncedSearch) ||
        p.description?.toLowerCase().includes(debouncedSearch) ||
        p.status?.toLowerCase().includes(debouncedSearch);

      const matchesStatus =
        statusFilter === "semua" ||
        (statusFilter === "pending" && p.status?.includes("Menunggu")) ||
        (statusFilter === "approved" && p.status?.includes("Disetujui")) ||
        (statusFilter === "rejected" && p.status?.includes("Ditolak"));

      return matchesSearch && matchesStatus;
    });
  }, [proposals, debouncedSearch, statusFilter]);

  // Separate pinned proposals from normal proposals
  const { pinnedProposals, normalProposals } = useMemo(() => {
    if (!filteredProposals.length) return { pinnedProposals: [], normalProposals: [] };

    const map = new Map(filteredProposals.map((p) => [p.id, p]));
    const pinned = [];
    const normal = [];

    // Add pinned items in pin order
    pinnedIds.forEach((pId) => {
      if (map.has(pId)) {
        pinned.push(map.get(pId));
        map.delete(pId);
      }
    });

    // Add remaining items to normal list
    filteredProposals.forEach((p) => {
      if (map.has(p.id)) {
        normal.push(p);
      }
    });

    return { pinnedProposals: pinned, normalProposals: normal };
  }, [filteredProposals, pinnedIds]);

  const visibleNormalProposals = useMemo(() => {
    return normalProposals.slice(0, visibleLimit);
  }, [normalProposals, visibleLimit]);

  const handleLoadMore = () => {
    setVisibleLimit((prev) => prev + 6);
  };

  if (!proposals.length) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center text-sm text-gray-500 space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-blue-50 text-[#2C1EE8] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-gray-900">
            Belum Ada Proposal yang Diajukan
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Anda belum memiliki proposal aktif. Silakan isi formulir pengajuan di atas untuk mengajukan proposal pertama Anda secara digital.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2C1EE8] hover:bg-[#2218a3] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Isi Form Pengajuan</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar (with Debounce) & Status Filter Pills */}
      <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari proposal, organisasi, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#2c1ee8] text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search/Filter Empty Results State */}
      {filteredProposals.length === 0 ? (
        <div className="p-8 text-center text-gray-400 space-y-2 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          <FileText className="w-8 h-8 mx-auto text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Tidak ada proposal yang sesuai.</p>
          <p className="text-xs text-gray-500">Coba ubah kata kunci pencarian atau filter status yang Anda pilih.</p>
        </div>
      ) : (
        <>
          {/* 📌 Pinned Proposals Section (Full-Width Horizontal Cards) */}
          {pinnedProposals.length > 0 && (
            <div className="space-y-3 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2 text-xs font-black text-[#2c1ee8] bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 w-fit">
                <Pin className="w-4 h-4 fill-[#2c1ee8]" />
                <span>📌 Proposal Dipin ({pinnedProposals.length})</span>
              </div>

              <div className="flex flex-col gap-4">
                {pinnedProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isPinned={true}
                    onTogglePin={handleTogglePin}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Normal Proposals Section (Full-Width Horizontal Cards) */}
          {normalProposals.length > 0 && (
            <div className="space-y-4">
              {pinnedProposals.length > 0 && (
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Semua Proposal ({normalProposals.length})
                </h3>
              )}

              <div className="flex flex-col gap-4">
                {visibleNormalProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isPinned={false}
                    onTogglePin={handleTogglePin}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>

              {/* Load More Pagination Button */}
              {normalProposals.length > visibleLimit && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span>Muat Lebih Banyak ({normalProposals.length - visibleLimit} proposal tersisa)</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
