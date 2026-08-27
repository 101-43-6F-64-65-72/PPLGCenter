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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-none border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col justify-between text-left">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2C1EE8] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-none border border-blue-100 mb-1">
              <Sparkles className="w-3 h-3 text-[#2C1EE8]" />
              {group.name}
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase">
              <UserPlus className="w-4 h-4 text-[#2C1EE8]" />
              Undang Pengguna Ke Komunitas
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 flex-1">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Cari nama lengkap pengguna..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-none pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#2C1EE8] focus:bg-white"
            />
          </div>

          {/* Results List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                Mencari pengguna...
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {query.trim().length >= 2
                  ? "Tidak ada pengguna yang cocok."
                  : "Ketik minimal 2 karakter untuk mencari pengguna."}
              </div>
            ) : (
              results.map((u) => {
                const isInvited = u.isAlreadyMemberOrInvited;
                const isProcessing = invitingUserIds.includes(u.userId);

                return (
                  <div
                    key={u.userId}
                    className="flex items-center justify-between p-2.5 rounded-none border border-slate-200 bg-white hover:bg-slate-50 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.photoUrl || u.avatarUrl ? (
                        <img
                          src={u.photoUrl || u.avatarUrl}
                          alt={u.fullName}
                          className="w-7 h-7 rounded-none object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-none bg-blue-50 text-[#2C1EE8] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100 uppercase">
                          {(u.fullName || "U").slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate uppercase">{u.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          @{u.userName} · {u.role}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isInvited || isProcessing}
                      onClick={() => handleInvite(u.userId)}
                      className={`px-3 py-1.5 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                        isInvited
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white shadow-xs"
                      }`}
                    >
                      {isInvited ? "Telah Bergabung" : isProcessing ? "Mengirim..." : "+ Undang"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
