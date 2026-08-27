"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Mail, Check, Trash2, AtSign, Users, Bell } from "lucide-react";
import communityService from "@/services/communityService";

export default function CommunityInboxModal({ isOpen, onClose, onInvitationProcessed }) {
  const [activeTab, setActiveTab] = useState("Invitations"); // "Invitations" | "Mentions"
  const [invitations, setInvitations] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState([]);

  const loadInbox = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      if (activeTab === "Invitations") {
        const res = await communityService.getInvitations();
        const items = res?.data || res || [];
        setInvitations(Array.isArray(items) ? items : []);
      } else {
        const res = await communityService.getMentions();
        const items = res?.data || res || [];
        setMentions(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.error("Failed to load inbox data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handleRespond = async (membershipId, accept) => {
    if (processingIds.includes(membershipId)) return;
    setProcessingIds((prev) => [...prev, membershipId]);

    try {
      await communityService.respondToInvitation(membershipId, accept);
      setInvitations((prev) => prev.filter((i) => i.membershipId !== membershipId));
      if (onInvitationProcessed) onInvitationProcessed(membershipId, accept);
    } catch (err) {
      alert("Gagal memproses undangan.");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== membershipId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-none border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col justify-between text-left">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase">
              <Mail className="w-4 h-4 text-[#2C1EE8]" />
              Kotak Masuk Komunitas
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Cek undangan masuk grup dan mention obrolan Anda di sini.
            </p>
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
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-none border border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab("Invitations")}
              className={`py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === "Invitations" ? "bg-[#2C1EE8] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Undangan ({invitations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("Mentions")}
              className={`py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === "Mentions" ? "bg-[#2C1EE8] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <AtSign className="w-3.5 h-3.5" />
              <span>Pesan & Mention</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-72 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                Memuat kotak masuk...
              </div>
            ) : activeTab === "Invitations" ? (
              invitations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada undangan grup baru yang tertunda.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {invitations.map((inv) => (
                    <div
                      key={inv.membershipId}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-none flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate uppercase">{inv.groupName}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">Diundang oleh: {inv.inviterName || "Admin"}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRespond(inv.membershipId, false)}
                          className="px-2.5 py-1 rounded-none text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(inv.membershipId, true)}
                          className="px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider text-white bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] transition-colors shadow-xs cursor-pointer"
                        >
                          Gabung
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              mentions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada sebutan mention baru.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {mentions.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2C1EE8] uppercase">{m.groupName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(m.sentAt).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{m.senderName}: &quot;{m.text}&quot;</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
