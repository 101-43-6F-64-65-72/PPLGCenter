"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Search, UserPlus, Check, Sparkles } from "lucide-react";
import communityService from "@/services/communityService";

export default function InviteUserModal({ isOpen, onClose, group, onInviteSuccess }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invitingUserIds, setInvitingUserIds] = useState([]);

  const handleSearch = useCallback(async (q) => {
    if (!group?.id || !q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await communityService.searchUsersForInvite(group.id, q.trim());
      const items = res?.data || res || [];
      setResults(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [group?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) handleSearch(query);
      else setResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleInvite = async (userId) => {
    if (!group?.id || invitingUserIds.includes(userId)) return;
    setInvitingUserIds((prev) => [...prev, userId]);

    try {
      await communityService.inviteMember(group.id, userId);
      // Update local state to show invited
      setResults((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, isAlreadyMemberOrInvited: true } : u))
      );
      if (onInviteSuccess) onInviteSuccess(userId);
    } catch (err) {
      alert("Gagal mengirim undangan komunitas.");
    } finally {
      setInvitingUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col justify-between">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#2C1EE8] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 mb-1">
              <Sparkles className="w-3 h-3 text-[#2C1EE8]" />
              {group.name}
            </span>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#2C1EE8]" />
              Undang Pengguna Ke Grup
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 flex-1">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Cari nama lengkap pengguna..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Results List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">Mencari pengguna di Supabase...</div>
            ) : !query.trim() ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                Ketik nama lengkap pengguna untuk mencari dan mengundang.
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                Tidak ada pengguna yang cocok dengan nama tersebut.
              </div>
            ) : (
              results.map((user) => {
                const isInviting = invitingUserIds.includes(user.userId);
                return (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {user.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug">{user.fullName}</h4>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {user.role === "Student"
                            ? `Siswa (${user.className || "Kelas PPLG"})`
                            : `Guru (${user.position || "Pengajar"})`}
                        </span>
                      </div>
                    </div>

                    {user.isAlreadyMemberOrInvited ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" /> Terundang / Anggota
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInvite(user.userId)}
                        disabled={isInviting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C1EE8] hover:bg-blue-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isInviting ? "Mengundang..." : "Undang"}</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
