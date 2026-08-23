"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import communityService from "@/services/communityService";

import groupMessageService from "@/services/groupMessageService";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/features/auth/components/LoginModal";
import {
  Users,
  MessageSquare,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Shield,
  UserCheck,
  Send,
  Lock,
  Mail,
  UserPlus,
  Sparkles,
  AtSign,
  Crown,
  Trash2,
  Pin,
  Info,
  Search,
  Filter,
  Image as ImageIcon,
  Paperclip,
  LogOut,
  UserMinus,
  ShieldAlert,
  Smile,
  X,
  MessageCircle,
  MoreVertical,
  Check,
  Clock,
  Radio,
  FileText,
  Edit3,
  CornerUpLeft,
  EyeOff,
  ThumbsUp,
  Heart,
  Flame,
  Zap,
  Award,
  Lightbulb,
  Mic,
  Volume2,
  Play,
  Pause,
  PinOff,
  Download,
  Link as LinkIcon,
  Square
} from "lucide-react";



import BatchMemberPickerModal from "@/features/community/components/BatchMemberPickerModal";
import InviteUserModal from "@/features/community/components/InviteUserModal";
import CommunityInboxModal from "@/features/community/components/CommunityInboxModal";
import ErrorFallback from "@/components/ErrorFallback";

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
  const { isAuthenticated, user, role } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("chat"); // "chat" | "members"
  const [alertMessage, setAlertMessage] = useState(null);

  // Category & Search Filter State
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchGroupQuery, setSearchGroupQuery] = useState("");

  // Pinned Groups in localStorage
  const [pinnedGroupIds, setPinnedGroupIds] = useState([]);

  // Pinned Banner Message per Group (WhatsApp Style)
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState(null);

  // Chat Controls & Reactions State
  const [replyingMessage, setReplyingMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);

  const popoverCardRef = useRef(null);

  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "💡"];

  // GSAP Animation when popover menu opens
  useEffect(() => {
    if (activeMenuMsgId && popoverCardRef.current) {
      gsap.fromTo(
        popoverCardRef.current,
        { scale: 0.65, opacity: 0, y: -10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: "back.out(1.8)" }
      );
    }
  }, [activeMenuMsgId]);



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

  // In-Chat Search State
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  // Slide-Out Drawer Sub-Tabs ("members" | "media" | "links")
  const [drawerTab, setDrawerTab] = useState("members");

  // Voice Note Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const [playingAudioMsgId, setPlayingAudioMsgId] = useState(null);

  // Mention Auto-Complete Popover State
  const [mentionQuery, setMentionQuery] = useState(null);

  const [mentionIndex, setMentionIndex] = useState(-1);

  // File Upload Ref
  const fileInputRef = useRef(null);

  // Dedicated Chat Scroll Container Ref
  const chatContainerRef = useRef(null);

  // Close active context menu on document click
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (e.target && e.target.closest("[data-message-action]")) return;
      setActiveMenuMsgId(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);


  // Load pinned groups from localStorage
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
      setPageError(null);
      const res = await communityService.getGroups({ page: 1, pageSize: 50 });
      const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      setGroups(items);
    } catch (err) {
      console.error("Failed to load community groups:", err);
      setPageError(err);
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

  const loadGroupDetails = useCallback(
    async (group) => {
      if (!group) return;
      try {
        const [memRes, msgRes] = await Promise.all([
          communityService.getMembers(group.id).catch(() => ({ data: [] })),
          groupMessageService.getMessages(group.id).catch(() => ({ data: { items: [] } })),
        ]);

        const fetchedMembers = memRes?.data || memRes || [];
        const fetchedMsgs = msgRes?.data?.items || msgRes?.items || [];

        const sortedMsgs = Array.isArray(fetchedMsgs)
          ? [...fetchedMsgs].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
          : [];

        setMembers(Array.isArray(fetchedMembers) ? fetchedMembers : []);
        setMessages(sortedMsgs);

        // Load pinned announcement if any message starts with [PENGUMUMAN]
        const pinnedMsg = sortedMsgs.slice().reverse().find((m) => {
          const text = safeBase64Decode(m.encryptedPayloadBase64);
          return text.startsWith("📌 [PENGUMUMAN]") || text.startsWith("[PENGUMUMAN]");
        });
        if (pinnedMsg) {
          setPinnedAnnouncement(safeBase64Decode(pinnedMsg.encryptedPayloadBase64));
        } else {
          setPinnedAnnouncement(null);
        }
      } catch (err) {
        console.error("Failed to load chat details:", err);
      }
    },
    []
  );

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setActiveSubTab("chat");
    setAlertMessage(null);
    setInfoDrawerOpen(false);
    loadGroupDetails(group);
  };

  useEffect(() => {
    if (
      !selectedGroup ||
      (selectedGroup.myStatus !== "Accepted" && selectedGroup.myStatus !== 1 && user?.role !== "Admin")
    ) {
      return;
    }

    const interval = setInterval(() => {
      if (!document.hidden) {
        loadGroupDetails(selectedGroup);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedGroup, user, loadGroupDetails]);

  // Container-isolated scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleJoinGroup = async (groupId) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
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
      const res = await communityService.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        initialMemberUserIds: initialMemberUserIds.length > 0 ? initialMemberUserIds : undefined,
      });
      const createdGroup = res?.data || res;
      setCreateModalOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedBatchMembers([]);
      setAlertMessage({ type: "success", text: "Komunitas baru berhasil dibuat!" });
      await fetchGroups();
      if (createdGroup?.id) {
        handleSelectGroup(createdGroup);
      }
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

  const triggerMentionPicker = () => {
    const spacePrefix = newMessage && !newMessage.endsWith(" ") ? " " : "";
    const newText = newMessage + spacePrefix + "@";
    setNewMessage(newText);
    setMentionQuery("");
    setMentionIndex(newText.length - 1);
  };

  // Pin & Unpin Message Banner Handler
  const handlePinMessage = (msg) => {
    const text = safeBase64Decode(msg.encryptedPayloadBase64);
    const pinData = { id: msg.id, sender: msg.senderName, text };
    setPinnedAnnouncement(pinData);
    if (selectedGroup) {
      try {
        localStorage.setItem(`pplg_pinned_${selectedGroup.id}`, JSON.stringify(pinData));
      } catch (e) {}
    }
  };

  const handleUnpinMessage = () => {
    setPinnedAnnouncement(null);
    if (selectedGroup) {
      try {
        localStorage.removeItem(`pplg_pinned_${selectedGroup.id}`);
      } catch (e) {}
    }
  };

  // Voice Recording Handlers
  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Browser Anda tidak mendukung perekaman suara.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Gagal memulai perekaman audio:", err);
      alert("Izin mikrofon ditolak atau mikrofon tidak tersedia.");
    }
  };

  const stopVoiceRecordingAndSend = () => {
    if (!mediaRecorderRef.current) return;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Audio = reader.result;
        const durationSec = recordingSeconds || 1;
        const formattedDuration = `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, "0")}`;
        const payloadText = `[🎙️ Pesan Suara: ${formattedDuration}](${base64Audio})`;

        try {
          setSendingMessage(true);
          const payloadBase64 = safeBase64Encode(payloadText);
          await groupMessageService.sendMessage({
            groupId: selectedGroup.id,
            encryptedPayloadBase64: payloadBase64,
            nonce: "audio-nonce-" + Date.now(),
            replyToMessageId: replyingMessage ? replyingMessage.id : null,
            recipientEnvelopes: [],
          });
          setReplyingMessage(null);
          await loadGroupDetails(selectedGroup);
        } catch (err) {
          console.error("Gagal mengirim pesan suara:", err);
        } finally {
          setSendingMessage(false);
          setIsRecordingAudio(false);
          setRecordingSeconds(0);
        }
      };

      reader.readAsDataURL(audioBlob);

      if (recorder.stream) {
        recorder.stream.getTracks().forEach((track) => track.stop());
      }
    };

    recorder.stop();
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };


  const filteredMembersForMention = members.filter((m) => {
    if (mentionQuery === null) return false;

    // Filter ONLY members who are active & accepted in the community group
    const isAcceptedMember = m.status === "Accepted" || m.status === 1;
    if (!isAcceptedMember) return false;

    if (!mentionQuery) return true;
    const q = mentionQuery.toLowerCase();
    const usernameMatch = m.userName && m.userName.toLowerCase().includes(q);
    const fullNameMatch = m.fullName && m.fullName.toLowerCase().includes(q);
    return usernameMatch || fullNameMatch;
  });


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
      const payloadBase64 = safeBase64Encode(newMessage.trim());

      if (editingMessage) {
        const res = await groupMessageService.editMessage(editingMessage.id, {
          encryptedPayloadBase64: payloadBase64,
          nonce: "edited-nonce-" + Date.now(),
        });
        const updatedMsg = res.data?.data || res.data || res;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, ...updatedMsg, encryptedPayloadBase64: payloadBase64, isEdited: true }
              : m
          )
        );
        setEditingMessage(null);
      } else {
        await groupMessageService.sendMessage({
          groupId: selectedGroup.id,
          replyToMessageId: replyingMessage?.id || null,
          encryptedPayloadBase64: payloadBase64,
          nonce: "foundation-nonce-" + Date.now(),
          recipientEnvelopes: [],
        });
        setReplyingMessage(null);
        await loadGroupDetails(selectedGroup);
      }

      setNewMessage("");
      setMentionQuery(null);
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Gagal mengirim pesan." });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartEdit = (msg) => {
    const decoded = safeBase64Decode(msg.encryptedPayloadBase64);
    setEditingMessage(msg);
    setReplyingMessage(null);
    setNewMessage(decoded);
    setActiveMenuMsgId(null);
  };

  const handleStartReply = (msg) => {
    setReplyingMessage(msg);
    setEditingMessage(null);
    setActiveMenuMsgId(null);
  };

  const handleDeleteForEveryone = async (msgId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pesan ini untuk semua orang?")) return;
    try {
      await groupMessageService.deleteForEveryone(msgId);
      const deletedTextBase64 = safeBase64Encode("[Pesan ini telah dihapus]");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, isDeletedForEveryone: true, encryptedPayloadBase64: deletedTextBase64 } : m
        )
      );
      setActiveMenuMsgId(null);
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Gagal menghapus pesan untuk semua orang." });
    }
  };

  const handleDeleteForMe = async (msgId) => {
    try {
      await groupMessageService.deleteForMe(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      setActiveMenuMsgId(null);
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Gagal menghapus pesan untuk saya." });
    }
  };


  const handleManageMemberAction = async (targetUserId, targetUserName, actionType) => {
    if (!selectedGroup) return;

    let newStatus = 1; // Accepted
    let newRole = 2; // Member

    if (actionType === "KICK") {
      if (!window.confirm(`Apakah Anda yakin ingin mengeluarkan "${targetUserName}" dari grup?`)) return;
      newStatus = 2; // Rejected/Kicked
    } else if (actionType === "ACCEPT") {
      newStatus = 1; // Accepted
      newRole = 2; // Member
    } else if (actionType === "DECLINE") {
      if (!window.confirm(`Apakah Anda yakin ingin menolak permintaan dari "${targetUserName}"?`)) return;
      newStatus = 2; // Rejected/Declined
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
        text:
          actionType === "KICK"
            ? `Pengguna ${targetUserName} telah dikeluarkan.`
            : actionType === "ACCEPT"
            ? `Permintaan ${targetUserName} telah diterima.`
            : actionType === "DECLINE"
            ? `Permintaan ${targetUserName} telah ditolak.`
            : `Status ${targetUserName} berhasil diperbarui.`,
      });
      loadGroupDetails(selectedGroup);
      fetchGroups();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengelola anggota." });
    }
  };

  const handleAddReaction = async (msgId, emoji) => {
    try {
      const res = await groupMessageService.toggleReaction(msgId, emoji);
      const updatedMsg = res.data?.data || res.data || res;
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m.id === msgId
            ? {
                ...m,
                reactions: updatedMsg.reactions ?? updatedMsg.Reactions ?? {},
                userReaction: updatedMsg.userReaction ?? updatedMsg.UserReaction ?? null,
              }
            : m
        )
      );
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Gagal memperbarui reaksi." });
    }
  };


  const userRoleStr = (role || user?.role || "").toString().toLowerCase();
  const isGlobalAdmin = userRoleStr === "admin" || userRoleStr === "teacher" || userRoleStr === "guru";
  const isGroupOwner =
    selectedGroup?.createdByUserId === user?.id || selectedGroup?.myRole === "Owner" || selectedGroup?.myRole === 0;
  const isGroupAdmin = isGlobalAdmin || isGroupOwner || selectedGroup?.myRole === "Admin" || selectedGroup?.myRole === 1;

  const filteredGroups = groups.filter((g) => {
    if (searchGroupQuery.trim()) {
      const q = searchGroupQuery.toLowerCase();
      const matchName = g.name?.toLowerCase().includes(q);
      const matchDesc = g.description?.toLowerCase().includes(q);
      const matchCreator = g.creatorName?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCreator) return false;
    }

    if (categoryFilter === "ALL") return true;
    if (categoryFilter === "MY_GROUPS") return g.createdByUserId === user?.id;
    if (categoryFilter === "STUDENT_GROUPS")
      return g.creatorName?.toLowerCase().includes("siswa") || !g.creatorName?.includes("S.Pd");
    if (categoryFilter === "TEACHER_GROUPS")
      return (
        g.creatorName?.includes("S.Pd") ||
        g.creatorName?.includes("M.T") ||
        g.creatorName?.toLowerCase().includes("guru")
      );
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

  const searchedMembersInDrawer = members.filter(

    (m) =>
      !memberSearchQuery.trim() ||
      m.userName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.fullName?.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  if (pageError) {
    const is401or403 =
      pageError?.response?.status === 401 ||
      pageError?.response?.status === 403 ||
      pageError?.status === 401 ||
      pageError?.status === 403;

    return (
      <ErrorFallback
        error={pageError}
        statusCode={pageError?.response?.status || pageError?.status || 500}
        title={is401or403 ? "Perlu Akses Komunitas" : "Gagal Memuat Komunitas"}
        description={
          pageError?.response?.data?.message ||
          pageError?.message ||
          "Terjadi kesalahan saat memuat data kelompok komunitas PPLG Center."
        }
        primaryAction={
          is401or403
            ? { label: "Masuk Akun (Login)", onClick: () => setIsLoginModalOpen(true) }
            : { label: "Coba Lagi", onClick: () => fetchGroups() }
        }
        secondaryAction={{ label: "Kembali ke Beranda", href: "/" }}
        fullPage={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-6">
        {/* Top Header Card */}
        <div id="komunitas-header-card" className="bg-white/90 backdrop-blur-md rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2C1EE8] text-[11px] font-mono font-extrabold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>Kolaborasi & Forum Komunitas PPLG</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Komunitas & Diskusi Siswa
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Wadah diskusi kelompok belajar, proyek aplikasi bersama, dan ruang koordinasi antarkelas kejuruan PPLG.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setInboxModalOpen(true)}
                  className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-[#2C1EE8]" />
                  <span>Inbox Undangan</span>
                  {inboxCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse">
                      {inboxCount}
                    </span>
                  )}
                </button>
              )}

              {isAuthenticated ? (
                <button
                  id="buat-komunitas-btn"
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Komunitas</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Login untuk Bergabung</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global Alert Notification */}
        {alertMessage && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold border flex items-center justify-between gap-3 animate-fade-in ${
              alertMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span>{alertMessage.text}</span>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main 2-Column Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Group Directory */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-[28px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2C1EE8]" />
                <span>Daftar Komunitas</span>
              </h2>
              <span className="text-[11px] bg-blue-50 text-[#2C1EE8] font-bold px-2.5 py-0.5 rounded-full">
                {sortedGroups.length} Grup
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari komunitas..."
                value={searchGroupQuery}
                onChange={(e) => setSearchGroupQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all"
              />
              {searchGroupQuery && (
                <button
                  type="button"
                  onClick={() => setSearchGroupQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "ALL", label: "Semua" },
                { id: "STUDENT_GROUPS", label: "Siswa" },
                { id: "CLASS_X", label: "Kelas X" },
                { id: "CLASS_XI", label: "Kelas XI" },
                { id: "CLASS_XII", label: "Kelas XII" },
                { id: "TEACHER_GROUPS", label: "Guru" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all shrink-0 cursor-pointer ${
                    categoryFilter === f.id
                      ? "bg-[#2C1EE8] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loadingGroups ? (
              <div className="text-slate-400 text-xs py-12 text-center font-medium">
                <div className="w-6 h-6 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Memuat komunitas...
              </div>
            ) : sortedGroups.length === 0 ? (
              <div className="text-slate-400 text-xs py-10 text-center bg-slate-50 rounded-2xl border border-slate-100">
                Belum ada grup komunitas terdaftar.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                {sortedGroups.map((group) => {
                  const isAccepted = group.myStatus === "Accepted" || group.myStatus === 1;
                  const isPending = group.myStatus === "Pending" || group.myStatus === 0;
                  const isPinned = pinnedGroupIds.includes(group.id);
                  const isSelected = selectedGroup?.id === group.id;

                  return (
                    <div
                      key={group.id}
                      onClick={() => handleSelectGroup(group)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? "bg-blue-50/80 border-[#2C1EE8] shadow-xs"
                          : "bg-white border-slate-200/90 hover:border-blue-200 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 truncate">
                          {isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 rotate-45 shrink-0" />}
                          <span className="truncate">{group.name}</span>
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => togglePinGroup(group.id, e)}
                            className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                            title={isPinned ? "Lepaskan Pin" : "Sematkan Grup"}
                          >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-amber-500 fill-amber-500" : ""}`} />
                          </button>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold">
                            {group.memberCount} Anggota
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-500 text-xs mt-1 line-clamp-1">{group.description}</p>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[120px]">
                          Oleh: <strong className="text-slate-600">{group.creatorName}</strong>
                        </span>
                        {isAccepted ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                            Anggota
                          </span>
                        ) : isPending ? (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                            Menunggu
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinGroup(group.id);
                            }}
                            className="text-[#2C1EE8] font-extrabold hover:underline cursor-pointer"
                          >
                            Gabung →
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
          <div className={`lg:col-span-2 bg-white border border-slate-200 rounded-[28px] p-6 flex flex-col h-[650px] relative ${activeMenuMsgId !== null ? "overflow-visible z-30" : "overflow-hidden"} shadow-xs`}>

            {!selectedGroup ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#2C1EE8]">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <p className="font-semibold text-slate-600 text-sm">Pilih Komunitas untuk Mulai Berdiskusi</p>
                <p className="text-slate-400 max-w-xs text-center">
                  Klik salah satu grup di sebelah kiri untuk melihat pesan, mengirim materi, atau berkolaborasi.
                </p>
              </div>
            ) : selectedGroup.myStatus !== "Accepted" &&
              selectedGroup.myStatus !== 1 &&
              user?.role !== "Admin" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-xs p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-3xl border border-blue-100 text-[#2C1EE8]">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedGroup.name}</h3>
                <p className="max-w-md text-slate-500">{selectedGroup.description}</p>
                <button
                  type="button"
                  onClick={() => handleJoinGroup(selectedGroup.id)}
                  className="px-6 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Minta Bergabung ke Komunitas
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full space-y-3">
                {/* Group Workspace Header */}
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{selectedGroup.name}</span>
                      {isGroupAdmin && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase">
                          Admin Grup
                        </span>
                      )}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-1">{selectedGroup.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* In-Chat Search Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsChatSearchOpen(!isChatSearchOpen)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isChatSearchOpen
                          ? "bg-blue-50 border-blue-200 text-[#2C1EE8]"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Cari Pesan dalam Komunitas"
                    >
                      <Search className="w-4 h-4" />
                    </button>

                    {/* Invite Button ONLY for Group Admins/Teachers/Global Admins */}
                    {isGroupAdmin && (
                      <button
                        type="button"
                        onClick={() => setInviteModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#2C1EE8] border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Undang</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInfoDrawerOpen(!infoDrawerOpen)}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer hover:bg-slate-100"
                      title="Informasi Komunitas"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {/* Leave Group Button for Regular Members */}
                    {!isGroupOwner && (
                      <button
                        type="button"
                        onClick={handleLeaveGroup}
                        className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
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
                        className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                        title="Hapus Komunitas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* In-Chat Search Bar */}
                {isChatSearchOpen && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                    <input
                      type="text"
                      placeholder="Cari kata kunci pesan atau dokumen..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden font-medium"
                    />
                    {chatSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setChatSearchQuery("")}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}


                {/* Pinned Announcement Banner */}
                {pinnedAnnouncement && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs text-amber-900 shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <Pin className="w-4 h-4 text-amber-600 fill-amber-600 shrink-0" />
                      <div className="flex flex-col truncate">
                        <span className="font-extrabold text-[10px] text-amber-800 uppercase tracking-wider">
                          Pesan Disematkan oleh {pinnedAnnouncement.sender || "Admin"}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {pinnedAnnouncement.text}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isGroupAdmin && (
                        <button
                          type="button"
                          onClick={handleUnpinMessage}
                          className="text-amber-700 hover:text-amber-900 text-[10px] font-bold underline cursor-pointer px-1"
                        >
                          Lepas
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Messages View */}
                <div className={`flex flex-col flex-1 min-h-0 relative ${activeMenuMsgId !== null ? "overflow-visible" : ""}`}>
                  {/* Subtle Backdrop Dim & Blur Overlay when a message is focused/active */}
                  {activeMenuMsgId !== null && (
                    <div
                      onClick={() => setActiveMenuMsgId(null)}
                      className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-30 transition-all duration-300 pointer-events-auto"
                    />
                  )}

                  <div
                    ref={chatContainerRef}
                    className={`flex-1 space-y-3 pr-2 mb-3 ${activeMenuMsgId !== null ? "overflow-visible" : "overflow-y-auto"}`}
                  >
                    {messages.length === 0 ? (
                      <div className="text-center py-20 text-slate-400 text-xs">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        Belum ada pesan di komunitas ini. Mulai percakapan pertama!
                      </div>
                    ) : (
                      messages
                        .filter((msg) => {
                          if (!chatSearchQuery) return true;
                          const text = safeBase64Decode(msg.encryptedPayloadBase64);
                          return text.toLowerCase().includes(chatSearchQuery.toLowerCase());
                        })
                        .map((msg, idx) => {
                          const decoded = safeBase64Decode(msg.encryptedPayloadBase64);
                          const isMe = msg.senderUserId === user?.id;
                          const reactions = msg.reactions || msg.Reactions || {};
                          const userReaction = msg.userReaction || msg.UserReaction || null;

                          const isImageAttachment = decoded.startsWith("![Gambar]");
                          const imageUrl = isImageAttachment ? decoded.match(/\((.*?)\)/)?.[1] : null;

                          // Check if current logged-in user is mentioned in this message
                          const isMentionedMe = user?.userName && decoded.toLowerCase().includes(`@${user.userName.toLowerCase()}`);

                          // Smart positioning: if message is near bottom of chat, position popover ABOVE
                          const isNearBottom = idx >= messages.length - 3;
                          const isActive = activeMenuMsgId === msg.id;

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"} group/msg relative transition-all duration-300 ${
                                isActive ? "z-50" : "z-0"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 font-mono">
                                {(msg.senderPhotoUrl || msg.senderAvatarUrl || msg.senderPhoto || msg.SenderPhotoUrl) && (
                                  <img
                                    src={msg.senderPhotoUrl || msg.senderAvatarUrl || msg.senderPhoto || msg.SenderPhotoUrl}
                                    alt={msg.senderName}
                                    className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                                  />
                                )}
                                <span className="font-bold text-slate-600">{msg.senderName}</span>

                                <span>•</span>
                                <span>
                                  {new Date(msg.sentAt).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {(msg.isEdited || msg.IsEdited) && (
                                  <span className="text-[9px] font-semibold text-amber-600 italic"> (diedit)</span>
                                )}
                                {isMentionedMe && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase flex items-center gap-0.5 shadow-2xs">
                                    <AtSign className="w-2.5 h-2.5 text-amber-700" /> Menyebut Anda
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 max-w-full">
                                {/* Left Option Button for My Messages (Hover-only or active) */}
                                {isMe && !msg.isDeletedForEveryone && (
                                  <button
                                    type="button"
                                    data-message-action="true"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                                    }}
                                    className={`p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-all cursor-pointer ${
                                      isActive ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100"
                                    } shrink-0`}
                                    title="Opsi & Reaksi Pesan"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Message Bubble Container with Scale & Highlight */}
                                <div
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                                  }}
                                  className={`px-4 py-2.5 rounded-2xl max-w-md text-xs sm:text-sm font-medium relative transition-all duration-300 ease-out ${
                                    isActive ? "scale-[1.04] shadow-2xl ring-2 ring-[#2C1EE8]/50 z-50" : "shadow-2xs"
                                  } ${
                                    isMe
                                      ? "bg-[#2C1EE8] text-white rounded-br-xs"
                                      : "bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60"
                                  }`}
                                >
                                  {/* Quoted Reply Card */}
                                  {((msg.replyToSenderName || msg.ReplyToSenderName) || (msg.replyToEncryptedPayloadBase64 || msg.ReplyToEncryptedPayloadBase64)) && (
                                    <div
                                      className={`mb-2 p-2 rounded-xl text-[11px] border-l-3 ${
                                        isMe ? "bg-white/15 border-white/70 text-blue-100" : "bg-slate-200/80 border-[#2C1EE8] text-slate-700"
                                      }`}
                                    >
                                      <div className="font-bold text-[10px] tracking-wide opacity-90">
                                        Membalas {msg.replyToSenderName || msg.ReplyToSenderName || "Anggota"}
                                      </div>
                                      <div className="truncate opacity-80 font-normal">
                                        {safeBase64Decode(msg.replyToEncryptedPayloadBase64 || msg.ReplyToEncryptedPayloadBase64)}
                                      </div>
                                    </div>
                                  )}

                                  {(() => {
                                    const isDocAttachment = decoded.startsWith("[📄 Dokumen:");
                                    const docUrl = isDocAttachment ? decoded.match(/\((.*?)\)/)?.[1] : null;
                                    const docName = isDocAttachment ? decoded.match(/\[📄 Dokumen:\s*(.*?)\]/)?.[1] : null;

                                    const isAudioAttachment = decoded.startsWith("[🎙️ Pesan Suara:");
                                    const audioUrl = isAudioAttachment ? decoded.match(/\((.*?)\)/)?.[1] : null;
                                    const audioDuration = isAudioAttachment ? decoded.match(/\[🎙️ Pesan Suara:\s*(.*?)\]/)?.[1] : "0:05";

                                    if (isAudioAttachment && audioUrl) {
                                      const isPlaying = playingAudioMsgId === msg.id;
                                      return (
                                        <div className={`my-1 p-2.5 rounded-2xl border flex items-center gap-3 text-xs ${isMe ? "bg-white/15 border-white/20 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                                          <button
                                            type="button"
                                            onClick={() => setPlayingAudioMsgId(isPlaying ? null : msg.id)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-transform active:scale-95 ${isMe ? "bg-white text-[#2C1EE8]" : "bg-[#2C1EE8] text-white"}`}
                                          >
                                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                          </button>
                                          <div className="flex flex-col flex-1 min-w-36">
                                            <div className="flex items-center justify-between mb-1 text-[10px] font-bold opacity-90">
                                              <span>Pesan Suara</span>
                                              <span>{audioDuration}</span>
                                            </div>
                                            {/* Animated Waveform Bars */}
                                            <div className="flex items-center gap-0.5 h-4">
                                              {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 35, 65, 85, 40].map((h, i) => (
                                                <div
                                                  key={i}
                                                  className={`flex-1 rounded-full transition-all duration-300 ${isPlaying ? "bg-current animate-pulse" : "opacity-40 bg-current"}`}
                                                  style={{ height: `${isPlaying ? Math.max(25, (h + (i * 7) % 50)) : h}%` }}
                                                />
                                              ))}
                                            </div>
                                            {isPlaying && (
                                              <audio
                                                src={audioUrl}
                                                autoPlay
                                                onEnded={() => setPlayingAudioMsgId(null)}
                                                className="hidden"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (isImageAttachment && imageUrl) {
                                      return (
                                        <div className="rounded-xl overflow-hidden my-1 max-w-xs">
                                          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                                            <img
                                              src={imageUrl}
                                              alt="Lampiran Gambar"
                                              className="object-cover w-full max-h-48 rounded-lg hover:opacity-95 transition-opacity cursor-pointer"
                                            />
                                          </a>
                                        </div>
                                      );
                                    }

                                    if (isDocAttachment && docUrl) {
                                      return (
                                        <div
                                          className={`my-1 p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                                            isMe ? "bg-white/10 border-white/20 text-white" : "bg-white border-slate-200 text-slate-900"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <FileText className="w-4 h-4 shrink-0 text-blue-400" />
                                            <span className="font-bold text-xs truncate">{docName || "Dokumen Lampiran"}</span>
                                          </div>
                                          <a
                                            href={docUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold shrink-0 transition-colors ${
                                              isMe ? "bg-white text-[#2C1EE8] hover:bg-slate-100" : "bg-[#2C1EE8] text-white hover:bg-blue-700"
                                            }`}
                                          >
                                            Buka File
                                          </a>
                                        </div>
                                      );
                                    }

                                    // Parse URLs and @fullName / @userName mention tags dynamically
                                    const mentionTargets = [];
                                    members.forEach((m) => {
                                      if (m.fullName && m.fullName.trim()) mentionTargets.push(m.fullName.trim());
                                      if (m.userName && m.userName.trim()) mentionTargets.push(m.userName.trim());
                                    });
                                    mentionTargets.sort((a, b) => b.length - a.length);
                                    const escapedTargets = mentionTargets.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
                                    const pattern = `(https?:\\/\\/[^\\s]+|@(?:${escapedTargets.length > 0 ? escapedTargets.join("|") + "|" : ""}[a-zA-Z0-9_.-]+))`;
                                    const tokenRegex = new RegExp(pattern, "gi");
                                    const parts = decoded.split(tokenRegex);

                                    return (
                                      <p className={`whitespace-pre-wrap leading-relaxed ${msg.isDeletedForEveryone ? "italic opacity-70" : ""}`}>
                                        {parts.map((part, idx) => {
                                          if (!part) return null;
                                          if (part.match(/^https?:\/\//i)) {
                                            return (
                                              <a
                                                key={idx}
                                                href={part}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`underline font-bold hover:opacity-80 transition-opacity break-all ${
                                                  isMe ? "text-blue-100" : "text-[#2C1EE8]"
                                                }`}
                                              >
                                                {part}
                                              </a>
                                            );
                                          }
                                          if (part.startsWith("@")) {
                                            return (
                                              <span
                                                key={idx}
                                                className={`font-extrabold px-1.5 py-0.5 rounded-md border inline-flex items-center gap-0.5 mx-0.5 transition-transform hover:scale-105 ${
                                                  isMe
                                                    ? "bg-white/20 text-white border-white/30 shadow-2xs"
                                                    : "bg-blue-100/90 text-[#2C1EE8] border-blue-200/80 shadow-2xs"
                                                }`}
                                              >
                                                {part}
                                              </span>
                                            );
                                          }
                                          return part;
                                        })}
                                      </p>
                                    );

                                  })()}



                                {/* GSAP Animated Floating Popover Card (Dynamic Placement Top vs Bottom) */}
                                {activeMenuMsgId === msg.id && (
                                  <div
                                    ref={popoverCardRef}
                                    data-message-action="true"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute ${
                                      isNearBottom ? "bottom-full mb-2" : "top-full mt-2"
                                    } ${
                                      isMe ? "right-0" : "left-0"
                                    } bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-3 z-40 min-w-56 flex flex-col gap-2.5 font-sans`}
                                  >
                                    {/* Real Emoji Reaction Bar */}
                                    <div className="flex items-center justify-between gap-1 bg-slate-50 border border-slate-200/60 rounded-xl p-1.5">
                                      {REACTION_EMOJIS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => {
                                            handleAddReaction(msg.id, emoji);
                                            setActiveMenuMsgId(null);
                                          }}
                                          className="hover:scale-135 active:scale-95 transition-transform text-lg sm:text-xl cursor-pointer p-1 rounded-lg hover:bg-white flex items-center justify-center"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>

                                    <div className="w-full h-px bg-slate-100" />

                                    {/* Action Buttons List */}
                                    <div className="flex flex-col gap-1 text-xs sm:text-sm font-semibold">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleStartReply(msg);
                                          setActiveMenuMsgId(null);
                                        }}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-[#2C1EE8] transition-colors cursor-pointer w-full text-left"
                                      >
                                        <CornerUpLeft className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span>Balas Pesan</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          handlePinMessage(msg);
                                          setActiveMenuMsgId(null);
                                        }}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors cursor-pointer w-full text-left"
                                      >
                                        <Pin className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>Sematkan Pesan</span>
                                      </button>

                                      {isMe && !msg.isDeletedForEveryone && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleStartEdit(msg);
                                            setActiveMenuMsgId(null);
                                          }}
                                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-50 text-amber-800 transition-colors cursor-pointer w-full text-left"
                                        >
                                          <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                                          <span>Edit Pesan</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDeleteForMe(msg.id);
                                          setActiveMenuMsgId(null);
                                        }}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer w-full text-left"
                                      >
                                        <EyeOff className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span>Hapus untuk Saya</span>
                                      </button>

                                      {(isMe || isGroupAdmin) && !msg.isDeletedForEveryone && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleDeleteForEveryone(msg.id);
                                            setActiveMenuMsgId(null);
                                          }}
                                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors cursor-pointer w-full text-left"
                                        >
                                          <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                                          <span>Hapus untuk Semua</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right Option Button for Other Users' Messages (Hover-only or active) */}
                              {!isMe && !msg.isDeletedForEveryone && (
                                <button
                                  type="button"
                                  data-message-action="true"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                                  }}
                                  className={`p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-all cursor-pointer ${
                                    activeMenuMsgId === msg.id ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100"
                                  } shrink-0`}
                                  title="Opsi & Reaksi Pesan"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* Rendered Emoji Reaction Counter Pills */}

                            {Object.keys(reactions).length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                {Object.entries(reactions).map(([emojiKey, count]) => {
                                  if (!count || count <= 0) return null;
                                  const isUserReacted = userReaction === emojiKey;
                                  return (
                                    <span
                                      key={emojiKey}
                                      className={`bg-white border ${
                                        isUserReacted ? "border-blue-500 bg-blue-50/70 text-[#2C1EE8]" : "border-slate-200 text-slate-700"
                                      } rounded-full px-2 py-0.5 text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-colors`}
                                    >
                                      <span>{emojiKey}</span>
                                      <span>{count}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}


                          </div>
                        );
                      })


                    )}
                  </div>

                  {/* Reply Preview Banner */}

                  {replyingMessage && (
                    <div className="flex items-center justify-between bg-blue-50/90 border-l-4 border-[#2C1EE8] px-3 py-2 rounded-r-xl text-xs mb-2 shadow-2xs">
                      <div className="flex items-center gap-2 truncate">
                        <CornerUpLeft className="w-3.5 h-3.5 text-[#2C1EE8] shrink-0" />
                        <span className="font-bold text-slate-800">Membalas {replyingMessage.senderName}:</span>
                        <span className="text-slate-600 truncate">{safeBase64Decode(replyingMessage.encryptedPayloadBase64)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingMessage(null)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Edit Message Banner */}
                  {editingMessage && (
                    <div className="flex items-center justify-between bg-amber-50/90 border-l-4 border-amber-500 px-3 py-2 rounded-r-xl text-xs mb-2 shadow-2xs">
                      <div className="flex items-center gap-2 truncate">
                        <Edit3 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold text-amber-900">Mengedit Pesan...</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessage(null);
                          setNewMessage("");
                        }}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Voice Recording Live Banner */}
                  {isRecordingAudio && (
                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200/90 rounded-2xl px-4 py-2.5 text-xs text-rose-700 font-semibold mb-2 shadow-2xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping shrink-0" />
                        <span className="font-extrabold text-rose-900">
                          Merekam Suara... ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelVoiceRecording}
                          className="px-3 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={stopVoiceRecordingAndSend}
                          className="px-3 py-1 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Kirim Suara
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Chat Input Bar Container with Relative Positioning for Popover */}
                  <div className="relative pt-2 border-t border-slate-100">
                    {/* Mention Autocomplete Dropdown Popover */}
                    {mentionQuery != null && filteredMembersForMention.length > 0 && (
                      <div className="absolute bottom-full mb-3 left-0 right-0 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 z-50 max-h-56 overflow-y-auto font-sans animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100">
                          <span className="text-[10px] font-extrabold text-[#2C1EE8] uppercase tracking-wider flex items-center gap-1">
                            <AtSign className="w-3 h-3" /> Sebut Anggota (@)
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {filteredMembersForMention.length} saran anggota
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {filteredMembersForMention.map((member) => (
                            <button
                              key={member.userId || member.id}
                              type="button"
                              onClick={() => insertMention(member)}
                              className="flex items-center justify-between p-2 hover:bg-blue-50/80 rounded-xl cursor-pointer text-xs transition-colors w-full text-left group/mitem"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {member.userPhotoUrl || member.userPhoto || member.photoUrl || member.avatarUrl || member.UserPhotoUrl ? (
                                  <img
                                    src={member.userPhotoUrl || member.userPhoto || member.photoUrl || member.avatarUrl || member.UserPhotoUrl}
                                    alt={member.userName}
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2C1EE8] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                                    {(member.fullName || member.userName || "U").slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex flex-col truncate">
                                  <span className="font-extrabold text-slate-900 group-hover/mitem:text-[#2C1EE8] truncate">
                                    {member.fullName || member.userName}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 truncate">
                                    @{member.userName}
                                  </span>
                                </div>
                              </div>

                              {member.role && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 uppercase border border-slate-200 shrink-0">
                                  {member.role}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <button
                      type="button"
                      disabled={uploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                      title="Lampirkan File / Gambar"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Mention / Tag Button (@) */}
                    <button
                      type="button"
                      onClick={triggerMentionPicker}
                      className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2C1EE8] font-black transition-colors cursor-pointer text-xs flex items-center justify-center shrink-0 border border-blue-200"
                      title="Sebut / Tag Anggota (@)"
                    >
                      <AtSign className="w-4 h-4" />
                    </button>

                    {/* Voice Note Mic Button */}
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black transition-colors cursor-pointer text-xs flex items-center justify-center shrink-0 border border-rose-200"
                      title="Rekam Pesan Suara"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder="Ketik pesan... (Gunakan @ untuk mention)"
                      value={newMessage}
                      onChange={handleMessageInputChange}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                    />



                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-2.5 rounded-xl bg-[#2C1EE8] hover:bg-blue-700 text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Slide-out Community Info Drawer */}
            {infoDrawerOpen && selectedGroup && (
              <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl p-5 z-30 flex flex-col justify-between animate-fade-in">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm">Informasi Komunitas</h3>
                    <button
                      onClick={() => setInfoDrawerOpen(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{selectedGroup.name}</h4>
                    <p className="text-slate-500 text-xs mt-1">{selectedGroup.description}</p>
                  </div>

                  {/* Drawer Sub-Tabs Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDrawerTab("members")}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                        drawerTab === "members" ? "bg-white text-[#2C1EE8] shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Anggota
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerTab("media")}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                        drawerTab === "media" ? "bg-white text-[#2C1EE8] shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Media & File
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerTab("links")}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                        drawerTab === "links" ? "bg-white text-[#2C1EE8] shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Tautan
                    </button>
                  </div>

                  {drawerTab === "members" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                        <span>Daftar Anggota:</span>
                        <span className="font-bold text-[#2C1EE8]">{members.length} Orang</span>
                      </div>

                      <input
                        type="text"
                        placeholder="Cari anggota..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#2C1EE8]"
                      />

                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                        {searchedMembersInDrawer.map((m) => {
                          const isMemberAdmin = m.role === "Admin" || m.role === 1 || m.role === "Owner" || m.role === 0;
                          const isMemberPending = m.status === "Pending" || m.status === 0;
                          const isMe = m.userId === user?.id;

                          return (
                            <div
                              key={m.userId || m.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs border border-slate-100"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {m.userPhotoUrl || m.userPhoto || m.photoUrl || m.avatarUrl || m.UserPhotoUrl ? (
                                  <img
                                    src={m.userPhotoUrl || m.userPhoto || m.photoUrl || m.avatarUrl || m.UserPhotoUrl}
                                    alt={m.userName}
                                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#2C1EE8] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                                    {(m.fullName || m.userName || "U").slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate">
                                    {m.fullName || m.userName} {isMe && "(Anda)"}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">@{m.userName}</p>
                                </div>
                              </div>


                              <div className="flex items-center gap-1 shrink-0">
                                {isMemberPending ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      Menunggu
                                    </span>
                                    {isGroupAdmin && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleManageMemberAction(m.userId, m.fullName || m.userName, "ACCEPT")}
                                          className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                                          title="Terima Bergabung"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleManageMemberAction(m.userId, m.fullName || m.userName, "DECLINE")}
                                          className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                          title="Tolak Permintaan"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ) : isMemberAdmin ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                      Admin
                                    </span>
                                    {isGroupOwner && !isMe && (
                                      <button
                                        type="button"
                                        onClick={() => handleManageMemberAction(m.userId, m.fullName || m.userName, "DEMOTE")}
                                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                        title="Cabut Status Admin"
                                      >
                                        <UserMinus className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  isGroupAdmin &&
                                  !isMe && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleManageMemberAction(m.userId, m.fullName || m.userName, "PROMOTE")}
                                        className="p-1 text-slate-400 hover:text-amber-600 cursor-pointer"
                                        title="Jadikan Admin"
                                      >
                                        <Crown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleManageMemberAction(m.userId, m.fullName || m.userName, "KICK")}
                                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                        title="Keluarkan dari Grup"
                                      >
                                        <UserMinus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {drawerTab === "media" && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">Berkas & Foto Komunitas:</span>
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {(() => {
                          const mediaList = messages.filter((m) => {
                            const text = safeBase64Decode(m.encryptedPayloadBase64);
                            return text.startsWith("![Gambar]") || text.startsWith("[📄 Dokumen:");
                          });

                          if (mediaList.length === 0) {
                            return <p className="text-xs text-slate-400 text-center py-8">Belum ada foto atau dokumen yang dibagikan.</p>;
                          }

                          return mediaList.map((m) => {
                            const text = safeBase64Decode(m.encryptedPayloadBase64);
                            const isImg = text.startsWith("![Gambar]");
                            const fileUrl = text.match(/\((.*?)\)/)?.[1];
                            const fileName = isImg ? "Foto Lampiran" : text.match(/\[📄 Dokumen:\s*(.*?)\]/)?.[1] || "Dokumen";

                            return (
                              <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <div className="flex items-center gap-2 truncate">
                                  {isImg ? <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" /> : <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
                                  <div className="flex flex-col truncate">
                                    <span className="font-bold text-slate-800 truncate">{fileName}</span>
                                    <span className="text-[10px] text-slate-400">Oleh {m.senderName}</span>
                                  </div>
                                </div>
                                {fileUrl && (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-blue-50 text-[#2C1EE8] hover:bg-blue-100 transition-colors shrink-0"
                                    title="Buka / Unduh"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {drawerTab === "links" && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">Tautan Web Dibagikan:</span>
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {(() => {
                          const linkMsgs = messages.filter((m) => {
                            const text = safeBase64Decode(m.encryptedPayloadBase64);
                            return text.match(/https?:\/\/[^\s]+/);
                          });

                          if (linkMsgs.length === 0) {
                            return <p className="text-xs text-slate-400 text-center py-8">Belum ada tautan web yang dibagikan.</p>;
                          }

                          return linkMsgs.map((m) => {
                            const text = safeBase64Decode(m.encryptedPayloadBase64);
                            const urlMatch = text.match(/https?:\/\/[^\s]+/);
                            const targetUrl = urlMatch ? urlMatch[0] : "";

                            return (
                              <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-700 text-[10px]">{m.senderName}</span>
                                  <a
                                    href={targetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#2C1EE8] font-bold text-[10px] underline flex items-center gap-1"
                                  >
                                    Buka <LinkIcon className="w-3 h-3" />
                                  </a>
                                </div>
                                <p className="text-blue-600 font-semibold truncate break-all">{targetUrl}</p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setInfoDrawerOpen(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Tutup Info
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Group Modal */}
      {deleteModalOpen && deletingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-md w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-xl font-bold text-slate-900">Hapus Komunitas?</h3>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Apakah Anda yakin ingin menghapus grup <strong className="text-slate-900">"{deletingGroup.name}"</strong>{" "}
              secara permanen? Seluruh riwayat percakapan dan keanggotaan akan dihapus.
            </p>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingGroup(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-md w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Buat Komunitas Baru</h3>
              <p className="text-xs text-slate-500 mt-0.5">Buat kelompok belajar atau forum diskusi PPLG.</p>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label htmlFor="new-group-name" className="block text-slate-700 mb-1 font-bold">
                  Nama Komunitas:
                </label>
                <input
                  id="new-group-name"
                  type="text"
                  required
                  placeholder="Misal: Web Dev Enthusiast, Game Dev X RPL..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label htmlFor="new-group-desc" className="block text-slate-700 mb-1 font-bold">
                  Deskripsi:
                </label>
                <textarea
                  id="new-group-desc"
                  rows="3"
                  placeholder="Penjelasan topik dan tujuan komunitas..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Teacher / Admin Batch Member Selection */}
              {isGlobalAdmin && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">Anggota Pilihan Batch:</label>
                    <button
                      type="button"
                      onClick={() => setBatchPickerOpen(true)}
                      className="px-3 py-1.5 bg-blue-50 text-[#2C1EE8] border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Pilih ({selectedBatchMembers.length})</span>
                    </button>
                  </div>

                  {selectedBatchMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      {selectedBatchMembers.map((m) => (
                        <span
                          key={m.userId || m.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold shadow-2xs"
                        >
                          {m.fullName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
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

      {/* Login Modal for Guest users */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          fetchGroups();
          fetchInboxCount();
        }}
      />

      <Footer />


    </div>
  );
}
