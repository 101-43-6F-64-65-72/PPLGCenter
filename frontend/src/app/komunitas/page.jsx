"use client";

import React, { useState, useEffect, useCallback } from "react";
import communityService from "@/services/communityService";
import groupMessageService from "@/services/groupMessageService";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const safeBase64Encode = (str) => {
  if (!str) return "";
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, "utf-8").toString("base64");
};

const safeBase64Decode = (b64) => {
  if (!b64) return "";
  try {
    if (typeof window !== "undefined") {
      return decodeURIComponent(escape(atob(b64)));
    }
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return b64;
  }
};

export default function KomunitasPage() {
  const { isAuthenticated, user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("groups"); // "groups" | "chat"
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await communityService.getGroups({ page: 1, pageSize: 20 });
      setGroups(res?.items || res?.data?.items || []);
    } catch (err) {
      console.error("Failed to load community groups:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const loadGroupDetails = async (group) => {
    setSelectedGroup(group);
    setActiveTab("chat");
    try {
      if (group.myStatus === "Accepted" || user?.role === "Admin") {
        const [msgRes, memRes] = await Promise.all([
          groupMessageService.getGroupMessages(group.id, { page: 1, pageSize: 50 }),
          communityService.getMembers(group.id),
        ]);
        setMessages((msgRes?.items || msgRes?.data?.items || []).reverse());
        setMembers(memRes?.data || memRes || []);
      }
    } catch (err) {
      console.error("Failed to load chat details:", err);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await communityService.joinGroupRequest(groupId);
      fetchGroups();
    } catch (err) {
      console.error("Failed to request joining group:", err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await communityService.createGroup({
        name: newGroupName,
        description: newGroupDesc,
      });
      setCreateModalOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      fetchGroups();
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;

    try {
      // In PPLG Center foundation, payloads are base64 string envelopes
      const payloadBase64 = safeBase64Encode(newMessage);
      await groupMessageService.sendMessage({
        groupId: selectedGroup.id,
        encryptedPayloadBase64: payloadBase64,
        nonce: "foundation-nonce-" + Date.now(),
        recipientEnvelopes: [],
      });
      setNewMessage("");
      loadGroupDetails(selectedGroup);
    } catch (err) {
      console.error("Failed to send group message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-full mb-2">
              Komunitas PPLG Center
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Komunitas & Kelompok Belajar
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Wadah diskusi kelompok, proyek bersama, dan pertukaran ilmu siswa & guru PPLG.
            </p>
          </div>

          {isAuthenticated && (
            <button
              id="buat-komunitas-btn"
              onClick={() => setCreateModalOpen(true)}
              className="self-start sm:self-auto px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-cyan-600/20 cursor-pointer"
            >
              + Buat Komunitas
            </button>
          )}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Group List */}
          <div className="lg:col-span-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 h-fit">
            <h2 className="text-lg font-bold text-white mb-4">Daftar Komunitas</h2>
            {loading ? (
              <div className="text-slate-500 text-xs py-8 text-center">Memuat daftar komunitas...</div>
            ) : groups.length === 0 ? (
              <div className="text-slate-400 text-xs py-8 text-center">Belum ada komunitas.</div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => loadGroupDetails(group)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedGroup?.id === group.id
                        ? "bg-cyan-900/30 border-cyan-500/50"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">{group.name}</h3>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                        {group.memberCount} Anggota
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-1">{group.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Oleh: {group.creatorName}</span>
                      {group.myStatus === "Accepted" ? (
                        <span className="text-emerald-400 font-semibold">Anggota</span>
                      ) : group.myStatus === "Pending" ? (
                        <span className="text-amber-400 font-semibold">Menunggu</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinGroup(group.id);
                          }}
                          className="text-cyan-400 font-semibold hover:underline"
                        >
                          Gabung
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Chat & Community Details */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col h-[600px]">
            {!selectedGroup ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Pilih komunitas di sebelah kiri untuk melihat pesan & grup belajar.
              </div>
            ) : selectedGroup.myStatus !== "Accepted" && user?.role !== "Admin" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm p-6 text-center">
                <span className="text-4xl mb-3">🔒</span>
                <h3 className="text-lg font-bold text-white mb-1">{selectedGroup.name}</h3>
                <p className="max-w-md text-xs text-slate-400 mb-4">{selectedGroup.description}</p>
                <button
                  onClick={() => handleJoinGroup(selectedGroup.id)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl"
                >
                  Minta Bergabung dengan Komunitas
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Group Header */}
                <div className="pb-4 mb-4 border-b border-slate-700/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedGroup.name}</h3>
                    <p className="text-slate-400 text-xs">{selectedGroup.description}</p>
                  </div>
                  <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1 rounded-lg">
                    {members.length} Anggota Terdaftar
                  </span>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Belum ada pesan di komunitas ini. Mulai percakapan!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const decoded = safeBase64Decode(msg.encryptedPayloadBase64);
                      const isMe = msg.senderUserId === user?.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[10px] text-slate-500 mb-0.5">
                            {msg.senderName} • {new Date(msg.sentAt).toLocaleTimeString()}
                          </span>
                          <div
                            className={`px-4 py-2.5 rounded-2xl max-w-md text-xs sm:text-sm ${
                              isMe
                                ? "bg-cyan-600 text-white rounded-tr-none"
                                : "bg-slate-900 border border-slate-700/60 text-slate-200 rounded-tl-none"
                            }`}
                          >
                            {decoded}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Message Form */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-700/50">
                  <input
                    id="community-chat-input"
                    type="text"
                    placeholder="Tulis pesan..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    id="send-community-msg-btn"
                    type="submit"
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Kirim
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Group Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Buat Komunitas Baru</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Komunitas:</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Deskripsi:</label>
                <textarea
                  rows="3"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-semibold"
                >
                  Buat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
