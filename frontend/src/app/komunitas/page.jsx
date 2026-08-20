"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import communityService from "@/services/communityService";
import groupMessageService from "@/services/groupMessageService";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Users, MessageSquare, PlusCircle, CheckCircle2, XCircle, Shield, UserCheck, Send, Lock, Mail,
  UserPlus, Sparkles, AtSign, Crown, Trash2, Pin, Info, Search, Filter, Image as ImageIcon,
  Paperclip, LogOut, UserMinus, ShieldAlert, Smile
} from "lucide-react";
import BatchMemberPickerModal from "@/features/community/components/BatchMemberPickerModal";
import InviteUserModal from "@/features/community/components/InviteUserModal";
import CommunityInboxModal from "@/features/community/components/CommunityInboxModal";

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
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("chat"); // "chat" | "members"
  const [alertMessage, setAlertMessage] = useState(null);

  // Category Filter State
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Pinned Groups in localStorage
  const [pinnedGroupIds, setPinnedGroupIds] = useState([]);

  // Pinned Banner Message per Group (WhatsApp Style)
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState(null);

  // Message Reactions (stored in local state per msg id)
  const [messageReactions, setMessageReactions] = useState({});

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedBatchMembers, setSelectedBatchMembers] = useState([]);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inboxModalOpen, setInboxModalOpen] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);

  // Mention Auto-Complete Popover State
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(-1);

  // File Upload Ref
  const fileInputRef = useRef(null);

  // Dedicated Chat Scroll Container Ref
  const chatContainerRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pplg_pinned_groups");
      if (stored) setPinnedGroupIds(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const togglePinGroup = (groupId, e) => {
    if (e) e.stopPropagation();
    let updated;
    if (pinnedGroupIds.includes(groupId)) {
      updated = pinnedGroupIds.filter((id) => id !== groupId);
    } else {
      updated = [...pinnedGroupIds, groupId];
    }
    setPinnedGroupIds(updated);
    try {
      localStorage.setItem("pplg_pinned_groups", JSON.stringify(updated));
    } catch (e) {}
  };

  const fetchGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const res = await communityService.getGroups({ page: 1, pageSize: 50 });
      setGroups(res?.items || res?.data?.items || []);
    } catch (err) {
      console.error("Failed to load community groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const fetchInboxCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const invites = await communityService.getInvitations();
      const items = invites?.data || invites || [];
      setInboxCount(Array.isArray(items) ? items.length : 0);
    } catch (err) {}
  }, [isAuthenticated]);

  useEffect(() => {
    fetchGroups();
    fetchInboxCount();
  }, [fetchGroups, fetchInboxCount]);

  const loadGroupDetails = useCallback(async (group) => {
    if (!group) return;
    try {
      if (group.myStatus === "Accepted" || group.myStatus === 1 || user?.role === "Admin") {
        const [msgRes, memRes] = await Promise.all([
          groupMessageService.getGroupMessages(group.id, { page: 1, pageSize: 50 }),
          communityService.getMembers(group.id),
        ]);
        const fetchedMsgs = (msgRes?.items || msgRes?.data?.items || []).reverse();
        setMessages(fetchedMsgs);
        setMembers(memRes?.data || memRes || []);

        // Load pinned announcement if any message starts with [PENGUMUMAN]
        const pinnedMsg = fetchedMsgs.find((m) => {
          const text = safeBase64Decode(m.encryptedPayloadBase64);
          return text.startsWith("📌 [PENGUMUMAN]") || text.startsWith("[PENGUMUMAN]");
        });
        if (pinnedMsg) {
          setPinnedAnnouncement(safeBase64Decode(pinnedMsg.encryptedPayloadBase64));
        } else {
          setPinnedAnnouncement(null);
        }
      }
    } catch (err) {
      console.error("Failed to load chat details:", err);
    }
  }, [user]);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setActiveSubTab("chat");
    setAlertMessage(null);
    setInfoDrawerOpen(false);
    loadGroupDetails(group);
  };

  useEffect(() => {
    if (!selectedGroup || (selectedGroup.myStatus !== "Accepted" && selectedGroup.myStatus !== 1 && user?.role !== "Admin")) {
      return;
    }

    const interval = setInterval(() => {
      if (!document.hidden) {
        loadGroupDetails(selectedGroup);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedGroup, user, loadGroupDetails]);

  // CONTAINER-ISOLATED SCROLL
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleJoinGroup = async (groupId) => {
    try {
      setAlertMessage(null);
      await communityService.joinGroupRequest(groupId);
      setAlertMessage({ type: "success", text: "Permintaan bergabung telah dikirim ke pengelola grup." });
      fetchGroups();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal meminta bergabung." });
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    if (!window.confirm(`Apakah Anda yakin ingin keluar dari grup "${selectedGroup.name}"?`)) return;

    try {
      setAlertMessage(null);
      await communityService.leaveGroup(selectedGroup.id);
      setSelectedGroup(null);
      setAlertMessage({ type: "success", text: "Anda telah keluar dari grup." });
      fetchGroups();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal keluar dari grup." });
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setAlertMessage(null);
      const initialMemberUserIds = selectedBatchMembers.map((m) => m.userId || m.id);
      await communityService.createGroup({
        name: newGroupName,
        description: newGroupDesc,
        initialMemberUserIds: initialMemberUserIds.length > 0 ? initialMemberUserIds : undefined,
      });
      setCreateModalOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedBatchMembers([]);
      setAlertMessage({ type: "success", text: "Komunitas baru berhasil dibuat!" });
      fetchGroups();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal membuat komunitas." });
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);
    try {
      await communityService.deleteGroup(deletingGroup.id);
      setDeleteModalOpen(false);
      setDeletingGroup(null);
      setSelectedGroup(null);
      setAlertMessage({ type: "success", text: "Komunitas berhasil dihapus secara permanen." });
      fetchGroups();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal menghapus komunitas." });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cloudinary / Supabase File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroup) return;

    try {
      setUploadingFile(true);
      setAlertMessage(null);
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengunggah file.");
      }

      const fileUrl = json.data?.url || json.url;
      const isImage = file.type.startsWith("image/");
      const attachmentText = isImage ? `![Gambar](${fileUrl})` : `[📄 Dokumen: ${file.name}](${fileUrl})`;

      const payloadBase64 = safeBase64Encode(attachmentText);
      await groupMessageService.sendMessage({
        groupId: selectedGroup.id,
        encryptedPayloadBase64: payloadBase64,
        nonce: "foundation-nonce-" + Date.now(),
        recipientEnvelopes: [],
      });

      await loadGroupDetails(selectedGroup);
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengunggah file." });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMessageInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    const lastAtPos = val.lastIndexOf("@");
    if (lastAtPos !== -1 && lastAtPos >= val.length - 15) {
      const q = val.substring(lastAtPos + 1).toLowerCase();
      setMentionQuery(q);
      setMentionIndex(lastAtPos);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (member) => {
    if (mentionIndex === -1) return;
    const prefix = newMessage.substring(0, mentionIndex);
    const mentionText = `@${member.userName} `;
    setNewMessage(prefix + mentionText);
    setMentionQuery(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup || sendingMessage) return;

    try {
      setSendingMessage(true);
      const payloadBase64 = safeBase64Encode(newMessage);
      await groupMessageService.sendMessage({
        groupId: selectedGroup.id,
        encryptedPayloadBase64: payloadBase64,
        nonce: "foundation-nonce-" + Date.now(),
        recipientEnvelopes: [],
      });
      setNewMessage("");
      setMentionQuery(null);
      await loadGroupDetails(selectedGroup);
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengirim pesan." });
    } finally {
      setSendingMessage(false);
    }
  };

  // WhatsApp Style: Promote, Demote, Kick Member Handler
  const handleManageMemberAction = async (targetUserId, targetUserName, actionType) => {
    if (!selectedGroup) return;

    let newStatus = 1; // Accepted
    let newRole = 2; // Member

    if (actionType === "KICK") {
      if (!window.confirm(`Apakah Anda yakin ingin mengeluarkan "${targetUserName}" dari grup?`)) return;
      newStatus = 2; // Rejected/Kicked
    } else if (actionType === "PROMOTE") {
      if (!window.confirm(`Jadikan "${targetUserName}" sebagai Admin Grup?`)) return;
      newRole = 1; // Admin
    } else if (actionType === "DEMOTE") {
      if (!window.confirm(`Cabut status Admin dari "${targetUserName}"?`)) return;
      newRole = 2; // Member
    }

    try {
      setAlertMessage(null);
      await communityService.manageMember(selectedGroup.id, targetUserId, {
        status: newStatus,
        role: newRole,
      });
      setAlertMessage({
        type: "success",
        text: actionType === "KICK" ? `Pengguna ${targetUserName} telah dikeluarkan.` : `Status ${targetUserName} berhasil diperbarui.`,
      });
      loadGroupDetails(selectedGroup);
      fetchGroups();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengelola anggota." });
    }
  };

  const handleAddReaction = (msgId, emoji) => {
    setMessageReactions((prev) => {
      const current = prev[msgId] || {};
      const count = (current[emoji] || 0) + 1;
      return { ...prev, [msgId]: { ...current, [emoji]: count } };
    });
  };

  const isGlobalAdmin = user?.role === "Admin" || user?.role === "Teacher";
  const isGroupOwner = selectedGroup?.createdByUserId === user?.id || selectedGroup?.myRole === "Owner" || selectedGroup?.myRole === 0;
  const isGroupAdmin = isGlobalAdmin || isGroupOwner || selectedGroup?.myRole === "Admin" || selectedGroup?.myRole === 1;

  const filteredGroups = groups.filter((g) => {
    if (categoryFilter === "ALL") return true;
    if (categoryFilter === "MY_GROUPS") return g.createdByUserId === user?.id;
    if (categoryFilter === "STUDENT_GROUPS") return g.creatorName?.toLowerCase().includes("siswa") || !g.creatorName?.includes("S.Pd");
    if (categoryFilter === "TEACHER_GROUPS") return g.creatorName?.includes("S.Pd") || g.creatorName?.includes("M.T") || g.creatorName?.toLowerCase().includes("guru");
    if (categoryFilter === "CLASS_X") return g.name.toUpperCase().includes("X PPLG");
    if (categoryFilter === "CLASS_XI") return g.name.toUpperCase().includes("XI PPLG");
    if (categoryFilter === "CLASS_XII") return g.name.toUpperCase().includes("XII PPLG");
    return true;
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    const isAPinned = pinnedGroupIds.includes(a.id);
    const isBPinned = pinnedGroupIds.includes(b.id);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filteredMembersForMention = mentionQuery != null
    ? members.filter((m) => m.userName?.toLowerCase().includes(mentionQuery))
    : [];

  const searchedMembersInDrawer = members.filter((m) =>
    !memberSearchQuery.trim() || m.userName?.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-full mb-2">
              Komunitas PPLG Center
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Komunitas & Forum Diskusi Siswa
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Wadah diskusi kelompok privat, proyek bersama, dan pertukaran ilmu siswa & guru PPLG.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setInboxModalOpen(true)}
                className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Inbox Komunitas</span>
                {inboxCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse">
                    {inboxCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated && (
              <button
                id="buat-komunitas-btn"
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-600/20 cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Komunitas</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Alert */}
        {alertMessage && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm font-semibold border ${
              alertMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {alertMessage.text}
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Group Directory */}
          <div className="lg:col-span-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Daftar Komunitas Saya</span>
              </h2>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                {sortedGroups.length} Grup
              </span>
            </div>

            {/* Role-Aware Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {!isGlobalAdmin ? (
                [
                  { id: "ALL", label: "Semua Grup" },
                  { id: "STUDENT_GROUPS", label: "Grup Siswa" },
                  { id: "TEACHER_GROUPS", label: "Grup Guru & Sekolah" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCategoryFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all shrink-0 cursor-pointer ${
                      categoryFilter === f.id
                        ? "bg-cyan-600 text-white shadow-2xs"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))
              ) : (
                [
                  { id: "ALL", label: "Semua" },
                  { id: "MY_GROUPS", label: "Grup Saya" },
                  { id: "CLASS_X", label: "Kelas X" },
                  { id: "CLASS_XI", label: "Kelas XI" },
                  { id: "CLASS_XII", label: "Kelas XII" },
                  { id: "TEACHER_GROUPS", label: "Guru & Admin" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCategoryFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all shrink-0 cursor-pointer ${
                      categoryFilter === f.id
                        ? "bg-cyan-600 text-white shadow-2xs"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))
              )}
            </div>

            {loadingGroups ? (
              <div className="text-slate-500 text-xs py-8 text-center">Memuat daftar komunitas...</div>
            ) : sortedGroups.length === 0 ? (
              <div className="text-slate-400 text-xs py-8 text-center">Belum ada grup komunitas terdaftar.</div>
            ) : (
              <div className="space-y-2.5">
                {sortedGroups.map((group) => {
                  const isAccepted = group.myStatus === "Accepted" || group.myStatus === 1;
                  const isPending = group.myStatus === "Pending" || group.myStatus === 0;
                  const isPinned = pinnedGroupIds.includes(group.id);

                  return (
                    <div
                      key={group.id}
                      onClick={() => handleSelectGroup(group)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                        selectedGroup?.id === group.id
                          ? "bg-cyan-900/30 border-cyan-500/50"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
                          {isPinned && <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 rotate-45" />}
                          <span>{group.name}</span>
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => togglePinGroup(group.id, e)}
                            className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                            title={isPinned ? "Lepaskan Pin" : "Sematkan Grup"}
                          >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-amber-400 fill-amber-400" : ""}`} />
                          </button>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                            {group.memberCount} Anggota
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-1">{group.description}</p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Oleh: {group.creatorName}</span>
                        {isAccepted ? (
                          <span className="text-emerald-400 font-bold">Anggota</span>
                        ) : isPending ? (
                          <span className="text-amber-400 font-bold">Menunggu</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinGroup(group.id);
                            }}
                            className="text-cyan-400 font-bold hover:underline cursor-pointer"
                          >
                            Gabung
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Chat & Community Workspace */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col h-[620px] relative overflow-hidden">
            {!selectedGroup ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-700" />
                <p>Pilih komunitas di sebelah kiri untuk melihat pesan & diskusi kelompok.</p>
              </div>
            ) : selectedGroup.myStatus !== "Accepted" && selectedGroup.myStatus !== 1 && user?.role !== "Admin" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-2xl border border-slate-700">
                  🔒
                </div>
                <h3 className="text-base font-bold text-white">{selectedGroup.name}</h3>
                <p className="max-w-md text-slate-400">{selectedGroup.description}</p>
                <button
                  type="button"
                  onClick={() => handleJoinGroup(selectedGroup.id)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Minta Bergabung dengan Komunitas
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full space-y-3">
                {/* Group Workspace Header */}
                <div className="pb-3 border-b border-slate-700/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedGroup.name}</span>
                      {isGroupAdmin && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase">
                          Admin Grup
                        </span>
                      )}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-1">{selectedGroup.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Invite Button ONLY for Group Admins/Teachers/Global Admins */}
                    {isGroupAdmin && (
                      <button
                        type="button"
                        onClick={() => setInviteModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Invite</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInfoDrawerOpen(!infoDrawerOpen)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Informasi Komunitas"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {/* Leave Group Button for Regular Members */}
                    {!isGroupOwner && (
                      <button
                        type="button"
                        onClick={handleLeaveGroup}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="Keluar Komunitas"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Group Button ONLY for Group Creator / Admin */}
                    {isGroupAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingGroup(selectedGroup);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="Hapus Komunitas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* WhatsApp Pinned Announcement Banner */}
                {pinnedAnnouncement && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-300">
                    <div className="flex items-center gap-2">
                      <Pin className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                      <span className="font-semibold line-clamp-1">{pinnedAnnouncement}</span>
                    </div>
                    {isGroupAdmin && (
                      <button
                        onClick={() => setPinnedAnnouncement(null)}
                        className="text-amber-400 hover:text-amber-200 text-[10px] font-bold underline"
                      >
                        Tutup
                      </button>
                    )}
                  </div>
                )}

                {/* Chat Messages View */}
                <div className="flex flex-col flex-1 min-h-0 relative">
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 text-xs">
                        Belum ada pesan di komunitas ini. Mulai percakapan!
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const decoded = safeBase64Decode(msg.encryptedPayloadBase64);
                        const isMe = msg.senderUserId === user?.id;
                        const reactions = messageReactions[msg.id] || {};

                        const isImageAttachment = decoded.startsWith("![Gambar]");
                        const imageUrl = isImageAttachment ? decoded.match(/\((.*?)\)/)?.[1] : null;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"} group/msg relative`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 font-mono">
                              <span className="font-bold text-slate-300">{msg.senderName}</span>
                              <span>•</span>
                              <span>{new Date(msg.sentAt).toLocaleTimeString()}</span>
                            </div>

                            <div
                              className={`px-4 py-2.5 rounded-2xl max-w-md text-xs sm:text-sm font-medium relative ${
                                isMe
                                  ? "bg-cyan-600 text-white rounded-tr-none shadow-md"
                                  : "bg-slate-900 border border-slate-700/60 text-slate-200 rounded-tl-none"
                              }`}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt="Attachment"
                                  className="max-w-xs rounded-lg my-1 border border-slate-700 shadow-md"
                                />
                              ) : (
                                <span>{decoded}</span>
                              )}

                              {/* Emoji Reactions display */}
                              {Object.keys(reactions).length > 0 && (
                                <div className="flex gap-1 mt-1.5 pt-1 border-t border-white/20 text-[10px]">
                                  {Object.entries(reactions).map(([emoji, count]) => (
                                    <span key={emoji} className="bg-black/30 px-1.5 py-0.5 rounded-md font-bold">
                                      {emoji} {count}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Quick Emoji Reaction Popup on Hover */}
                            <div className="hidden group-hover/msg:flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-1 shadow-lg absolute -top-4 right-2 z-10">
                              {["👍", "❤️", "🔥", "🚀", "😂"].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                  className="text-xs hover:scale-125 transition-transform cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Mention Autocomplete Popover */}
                  {mentionQuery != null && filteredMembersForMention.length > 0 && (
                    <div className="absolute bottom-14 left-0 w-64 bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-2xl z-20 max-h-40 overflow-y-auto space-y-1">
                      <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 flex items-center gap-1">
                        <AtSign className="w-3 h-3 text-cyan-400" /> Mention Anggota:
                      </div>
                      {filteredMembersForMention.map((m) => (
                        <div
                          key={m.userId}
                          onClick={() => insertMention(m)}
                          className="p-2 rounded-xl hover:bg-slate-700 text-xs font-bold text-white cursor-pointer flex items-center justify-between"
                        >
                          <span>{m.userName}</span>
                          <span className="text-[10px] text-slate-400">{m.className || m.position || "Anggota"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Composer Form with Cloudinary Upload */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-700/50">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 rounded-xl transition-all cursor-pointer"
                      title="Unggah Gambar / Dokumen (Cloudinary)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      id="community-chat-input"
                      type="text"
                      placeholder={uploadingFile ? "Mengunggah file ke Cloudinary..." : "Tulis pesan... (gunakan @ untuk tag)"}
                      value={newMessage}
                      disabled={uploadingFile}
                      onChange={handleMessageInputChange}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                    />
                    <button
                      id="send-community-msg-btn"
                      type="submit"
                      disabled={sendingMessage || uploadingFile || !newMessage.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim</span>
                    </button>
                  </form>
                </div>

                {/* WhatsApp-Style Group Info & Member Tier Drawer */}
                {infoDrawerOpen && (
                  <div className="absolute inset-y-0 right-0 w-84 bg-slate-900/95 border-l border-slate-700/80 backdrop-blur-xl p-5 z-30 flex flex-col justify-between shadow-2xl animate-slide-left">
                    <div className="space-y-4 flex-1 overflow-y-auto">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Info className="w-4 h-4 text-cyan-400" /> Info & Anggota Komunitas
                        </h4>
                        <button
                          onClick={() => setInfoDrawerOpen(false)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Group Header Info */}
                      <div className="text-center space-y-2 py-2">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/30">
                          {selectedGroup.name?.charAt(0) || "G"}
                        </div>
                        <h3 className="text-base font-extrabold text-white">{selectedGroup.name}</h3>
                        <p className="text-xs text-slate-400">{selectedGroup.description}</p>
                        <span className="inline-block text-[10px] text-slate-500 font-mono">
                          Dibuat oleh: {selectedGroup.creatorName}
                        </span>
                      </div>

                      {/* Search & Manage Members */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">
                            Daftar Anggota ({searchedMembersInDrawer.length})
                          </span>
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Cari anggota..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {searchedMembersInDrawer.map((mem) => {
                            const isMemOwner = mem.role === 0 || mem.role === "Owner";
                            const isMemAdmin = mem.role === 1 || mem.role === "Admin" || isMemOwner;

                            return (
                              <div
                                key={mem.id}
                                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                    {mem.userName?.charAt(0) || "A"}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-white text-[11px] truncate flex items-center gap-1">
                                      <span>{mem.userName}</span>
                                      {isMemOwner && (
                                        <span className="text-[9px] text-amber-400 font-black">👑 Pembuat</span>
                                      )}
                                      {isMemAdmin && !isMemOwner && (
                                        <span className="text-[9px] text-cyan-400 font-black">🛡️ Admin</span>
                                      )}
                                    </p>
                                    <p className="text-[9px] text-slate-500 truncate">{mem.className || mem.userEmail}</p>
                                  </div>
                                </div>

                                {/* Admin Actions: Promote, Demote, Kick */}
                                {isGroupAdmin && !isMemOwner && mem.userId !== user?.id && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    {!isMemAdmin ? (
                                      <button
                                        type="button"
                                        onClick={() => handleManageMemberAction(mem.userId, mem.userName, "PROMOTE")}
                                        className="p-1 rounded-md bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/40 text-[10px] font-bold cursor-pointer"
                                        title="Jadikan Admin Grup"
                                      >
                                        + Admin
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleManageMemberAction(mem.userId, mem.userName, "DEMOTE")}
                                        className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white text-[10px] font-bold cursor-pointer"
                                        title="Cabut Status Admin"
                                      >
                                        - Admin
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleManageMemberAction(mem.userId, mem.userName, "KICK")}
                                      className="p-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/40 cursor-pointer"
                                      title="Keluarkan dari Grup"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {isGroupAdmin && (
                      <div className="pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingGroup(selectedGroup);
                            setDeleteModalOpen(true);
                          }}
                          className="w-full py-2.5 bg-rose-600/20 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl hover:bg-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                          <span>Hapus Komunitas Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Group Confirmation Modal */}
      {deleteModalOpen && deletingGroup && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Hapus Komunitas?</h3>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Apakah Anda yakin ingin menghapus grup <span className="font-extrabold text-white">"{deletingGroup.name}"</span> secara permanen? Seluruh pesan dan keanggotaan grup akan dihapus. Action ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingGroup(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Buat Komunitas Baru</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="new-group-name" className="block text-xs text-slate-400 mb-1 font-semibold">Nama Komunitas:</label>
                <input
                  id="new-group-name"
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="new-group-desc" className="block text-xs text-slate-400 mb-1 font-semibold">Deskripsi:</label>
                <textarea
                  id="new-group-desc"
                  rows="3"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              {/* Teacher / Admin Batch Member Selection */}
              {isGlobalAdmin && (
                <div className="space-y-2 pt-1 border-t border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs text-slate-400 font-semibold">Anggota Pilihan Batch:</label>
                    <button
                      type="button"
                      onClick={() => setBatchPickerOpen(true)}
                      className="px-3 py-1 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold hover:bg-cyan-600/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Pilih Anggota ({selectedBatchMembers.length})</span>
                    </button>
                  </div>

                  {selectedBatchMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-700">
                      {selectedBatchMembers.map((m) => (
                        <span key={m.userId || m.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md text-[10px] font-bold">
                          {m.fullName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Buat Komunitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Member Picker Modal */}
      <BatchMemberPickerModal
        isOpen={batchPickerOpen}
        onClose={() => setBatchPickerOpen(false)}
        initialSelected={selectedBatchMembers}
        onSave={(users) => setSelectedBatchMembers(users)}
      />

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        group={selectedGroup}
        onInviteSuccess={() => loadGroupDetails(selectedGroup)}
      />

      {/* Community Inbox Modal */}
      <CommunityInboxModal
        isOpen={inboxModalOpen}
        onClose={() => setInboxModalOpen(false)}
        onInvitationProcessed={() => {
          fetchGroups();
          fetchInboxCount();
        }}
      />

      <Footer />
    </div>
  );
}


