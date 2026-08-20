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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col justify-between">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#2C1EE8]" />
              Kotak Masuk Komunitas
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Cek undangan masuk grup dan mention obrolan kamu di sini.
            </p>
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
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 gap-1">
            <button
              onClick={() => setActiveTab("Invitations")}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "Invitations" ? "bg-[#2C1EE8] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Undangan ({invitations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("Mentions")}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "Mentions" ? "bg-[#2C1EE8] text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <AtSign className="w-4 h-4" />
              <span>Pesan & Mention</span>
            </button>
          </div>

          {/* List Content */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">Memuat data kotak masuk...</div>
            ) : activeTab === "Invitations" ? (
              invitations.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">Tidak ada undangan grup pending saat ini.</p>
                </div>
              ) : (
                invitations.map((invite) => {
                  const isProcessing = processingIds.includes(invite.membershipId);
                  return (
                    <div
                      key={invite.membershipId}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#2C1EE8] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {invite.groupName?.charAt(0) || "G"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">{invite.groupName}</h4>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                            Diundang oleh: <span className="font-extrabold text-slate-800">{invite.creatorName}</span>
                          </p>
                          {invite.groupDescription && (
                            <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                              "{invite.groupDescription}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleRespond(invite.membershipId, false)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Tolak</span>
                        </button>

                        <button
                          onClick={() => handleRespond(invite.membershipId, true)}
                          disabled={isProcessing}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Terima & Bergabung</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : mentions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <AtSign className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400 font-bold">Belum ada mention pesan di grup kamu.</p>
              </div>
            ) : (
              mentions.map((mention) => (
                <div
                  key={mention.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#2C1EE8]">{mention.groupName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(mention.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    <span className="font-extrabold text-slate-900">{mention.senderName}: </span>
                    {mention.contentSnippet}
                  </p>
                </div>
              ))
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
