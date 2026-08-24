"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import announcementService from "@/services/announcementService";
import useAuth from "@/hooks/useAuth";
import { resolveImageUrl } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  Trash2,
  Lock,
  Unlock,
  CornerDownRight,
  Loader2,
  AlertCircle,
  ThumbsUp,
  X
} from "lucide-react";

// Strictly specified list of 12 emojis
const EMOJI_LIST = [
  { type: "sob", emoji: "😭", label: "Sedih" },
  { type: "joy", emoji: "😂", label: "Tertawa" },
  { type: "hushed", emoji: "😯", label: "Kaget" },
  { type: "heart", emoji: "❤️", label: "Cinta" },
  { type: "broken_heart", emoji: "💔", label: "Patah Hati" },
  { type: "fire", emoji: "🔥", label: "Semangat" },
  { type: "giggle", emoji: "🤭", label: "Malu" },
  { type: "sleepy", emoji: "😴", label: "Tidur" },
  { type: "frown", emoji: "☹️", label: "Cemberut" },
  { type: "skull", emoji: "💀", label: "Tengkorak" },
  { type: "pleading", emoji: "🥹", label: "Terharu" },
  { type: "pleading_face", emoji: "🥺", label: "Polos" }
];

export default function AnnouncementCommentSection({ announcementId, isCommentsLockedInitial = false }) {
  const { user, role } = useAuth();
  const userRole = (role || user?.role || "").toLowerCase();
  const isTeacherOrAdmin = userRole === "admin" || userRole === "teacher" || role === "Admin" || role === "Guru";

  // State Management
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isCommentsLocked, setIsCommentsLocked] = useState(isCommentsLockedInitial);

  // Reactions & Pop-up State
  const [showReactionPopup, setShowReactionPopup] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionsCount, setReactionsCount] = useState({});
  const [submittingReaction, setSubmittingReaction] = useState(false);

  // Hover timeout ref to fix disappearing popup when moving mouse
  const hoverTimeoutRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // PC Hover Handlers with Buffer Delay & Hover Bridge
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowReactionPopup(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // 300ms grace period buffer so moving mouse from button to modal never closes it
    hoverTimeoutRef.current = setTimeout(() => {
      setShowReactionPopup(false);
    }, 300);
  };

  // Mobile Click Handler
  const handleTriggerClick = () => {
    // On mobile / touch screens, toggle open/close explicitly
    setShowReactionPopup((prev) => !prev);
  };

  // Fetch Comments List
  const fetchComments = useCallback(async () => {
    if (!announcementId) return;
    setLoadingComments(true);
    try {
      const res = await announcementService.getComments(announcementId, { page: 1, pageSize: 50 });
      const items = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setComments(items);
    } catch (err) {
      console.error("Gagal memuat komentar pengumuman:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [announcementId]);

  // Fetch Reactions Breakdown & Active User Reaction
  const fetchReactions = useCallback(async () => {
    if (!announcementId) return;
    try {
      const res = await announcementService.getReactions(announcementId);
      const data = res?.data || res;
      if (data) {
        setReactionsCount(data.counts || data.Counts || {});
        setUserReaction(data.userReaction || data.UserReaction || null);
      }
    } catch (err) {
      console.error("Gagal memuat reaksi pengumuman:", err);
    }
  }, [announcementId]);

  useEffect(() => {
    fetchComments();
    fetchReactions();
  }, [fetchComments, fetchReactions]);

  // Total reactions count calculation
  const totalReactionsCount = useMemo(() => {
    return Object.values(reactionsCount).reduce((acc, curr) => acc + (curr || 0), 0);
  }, [reactionsCount]);

  // Unique active reactions list for top summary
  const activeReactionsSummary = useMemo(() => {
    return EMOJI_LIST.filter((e) => (reactionsCount[e.type] || 0) > 0);
  }, [reactionsCount]);

  // Handle Submit New Comment / Reply
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await announcementService.addComment(
        announcementId,
        newComment.trim(),
        replyingTo ? (replyingTo.id || replyingTo.Id) : null
      );
      setNewComment("");
      setReplyingTo(null);
      await fetchComments();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Gagal mengirimkan komentar.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus komentar ini?")) return;
    try {
      await announcementService.deleteComment(announcementId, commentId);
      await fetchComments();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Gagal menghapus komentar.");
    }
  };

  // Handle Toggle Comments Lock
  const handleToggleLock = async () => {
    try {
      const res = await announcementService.toggleCommentsLock(announcementId);
      setIsCommentsLocked(!!res?.isCommentsLocked);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Gagal mengunci komentar.");
    }
  };

  // Handle Reaction Selection
  const handleReactionClick = async (type) => {
    if (submittingReaction) return;
    setSubmittingReaction(true);
    setShowReactionPopup(false);
    const isCurrent = userReaction === type;
    try {
      if (isCurrent) {
        await announcementService.removeReaction(announcementId);
      } else {
        await announcementService.toggleReaction(announcementId, type);
      }
      await fetchReactions();
    } catch (err) {
      console.error("Gagal memperbarui reaksi:", err);
    } finally {
      setSubmittingReaction(false);
    }
  };

  // Insert emoji directly into comment text input
  const handleInsertEmoji = (emojiChar) => {
    setNewComment((prev) => `${prev}${emojiChar}`);
  };

  // Current active emoji object
  const currentUserEmojiObj = useMemo(() => {
    return EMOJI_LIST.find((e) => e.type === userReaction);
  }, [userReaction]);

  // Group comments into root comments and child replies
  const { rootComments, repliesMap } = useMemo(() => {
    if (!Array.isArray(comments)) return { rootComments: [], repliesMap: {} };
    const roots = [];
    const replies = {};

    comments.forEach((c) => {
      const pId = c.parentCommentId || c.ParentCommentId;
      if (pId) {
        if (!replies[pId]) replies[pId] = [];
        replies[pId].push(c);
      } else {
        roots.push(c);
      }
    });

    // Sort replies chronologically (oldest reply first under the parent)
    Object.keys(replies).forEach((k) => {
      replies[k].sort((a, b) => new Date(a.createdAt || a.CreatedAt) - new Date(b.createdAt || b.CreatedAt));
    });

    return { rootComments: roots, repliesMap: replies };
  }, [comments]);

  const inputRef = useRef(null);

  const handleStartReply = (commentObj) => {
    setReplyingTo(commentObj);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-visible flex flex-col font-sans relative">
      
      {/* ── HEADER & REACTION BAR ── */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
        
        {/* Top Summary Bar: ONLY display if totalReactionsCount > 0 or admin controls */}
        {(totalReactionsCount > 0 || isTeacherOrAdmin) && (
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 mb-3 pb-2 border-b border-slate-100">
            {totalReactionsCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="flex -space-x-1 items-center">
                  {activeReactionsSummary.map((item) => (
                    <span key={item.type} className="text-base transform hover:scale-110 transition-transform">
                      {item.emoji}
                    </span>
                  ))}
                </span>
                <span className="text-slate-800 font-bold ml-1">
                  {totalReactionsCount} Reaksi
                </span>
              </div>
            ) : (
              <span className="text-slate-400 font-normal">Belum ada reaksi</span>
            )}

            {/* Lock / Unlock Toggle for Admin / Teachers */}
            {isTeacherOrAdmin && (
              <button
                onClick={handleToggleLock}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isCommentsLocked
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-white text-slate-500 border-slate-200 hover:text-slate-800"
                }`}
                title={isCommentsLocked ? "Buka Komentar" : "Kunci Komentar"}
              >
                {isCommentsLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}

        {/* Reaction Trigger Area with Hover Bridge & PC/Mobile Flow */}
        <div
          className="relative inline-block w-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Animated Reaction Popup Modal */}
          {showReactionPopup && (
            <>
              {/* Invisible Hover Bridge Padding to prevent hover loss when moving cursor */}
              <div className="hidden md:block absolute -top-5 left-0 right-0 h-5 bg-transparent z-40" />

              {/* PC / Desktop Hover Floating Popup */}
              <div className="hidden md:grid grid-cols-6 gap-2 absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150 w-max max-w-[280px]">
                {EMOJI_LIST.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleReactionClick(item.type)}
                    className="text-2xl hover:scale-125 hover:-translate-y-1 transition-all duration-150 ease-out cursor-pointer p-1 flex items-center justify-center rounded-lg hover:bg-blue-50/60"
                    title={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>

              {/* Mobile Click Sheet Modal */}
              <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-end justify-center p-4 animate-in fade-in duration-150">
                <div
                  className="bg-white rounded-2xl w-full p-4 border border-slate-200 shadow-2xl space-y-3 animate-in slide-in-from-bottom-6 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pilih Reaksi</span>
                    <button
                      type="button"
                      onClick={() => setShowReactionPopup(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2 py-2 text-center">
                    {EMOJI_LIST.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleReactionClick(item.type)}
                        className="text-2xl active:scale-110 transition-transform p-1.5 rounded-xl hover:bg-slate-100 flex flex-col items-center gap-1"
                      >
                        <span>{item.emoji}</span>
                        <span className="text-[9px] font-semibold text-slate-500 truncate max-w-full">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Main Trigger Button */}
          <button
            onClick={handleTriggerClick}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              userReaction
                ? "bg-blue-50 text-[#2c1ee8] border-blue-200 shadow-2xs"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            {currentUserEmojiObj ? (
              <span className="text-lg leading-none">{currentUserEmojiObj.emoji}</span>
            ) : (
              <ThumbsUp className="w-4 h-4 text-[#2c1ee8]" />
            )}
            <span>{currentUserEmojiObj ? currentUserEmojiObj.label : "Beri Reaksi"}</span>
          </button>
        </div>

      </div>

      {/* ── COMMENTS SCROLLABLE FEED WITH NESTED REPLIES ── */}
      <div className="p-4 max-h-[480px] sm:max-h-[540px] overflow-y-auto space-y-4">
        {loadingComments ? (
          <div className="py-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            Memuat komentar...
          </div>
        ) : rootComments.length > 0 ? (
          rootComments.map((c) => {
            const author = c.authorName || c.userName || c.UserName || "Pengguna";
            const canDelete = isTeacherOrAdmin || (user?.id && (user.id === c.userId || user.id === c.UserId));
            const childReplies = repliesMap[c.id || c.Id] || [];

            const photo = c.userPhotoUrl || c.UserPhotoUrl || c.photoUrl || c.PhotoUrl || c.authorPhotoUrl || c.AuthorPhotoUrl;
            const resolvedPhoto = photo ? resolveImageUrl(photo) : null;

            const commentRole = (c.userRole || c.UserRole || "").toLowerCase();
            const commentClass = c.userClassName || c.UserClassName;
            const isCommentTeacher = commentRole === "teacher";
            const isCommentAdmin = commentRole === "admin";

            return (
              <div key={c.id || c.Id} className="space-y-2">
                {/* Root Comment Bubble */}
                <div className="flex gap-2.5 items-start group">
                  {/* User Avatar (Photo or Initial fallback) */}
                  {resolvedPhoto ? (
                    <img
                      src={resolvedPhoto}
                      alt={author || "Foto Pengguna"}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 shadow-2xs border border-gray-200"
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-full text-white font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5 shadow-2xs ${isCommentAdmin ? "bg-gradient-to-br from-rose-500 to-red-600" : isCommentTeacher ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-blue-600 to-indigo-700"}`}>
                      {author.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Facebook Comment Bubble */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100/80 hover:bg-gray-100 p-3 rounded-2xl text-xs space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-900 truncate">{author}</span>
                          {isCommentAdmin && (
                            <span className="text-[10px] font-bold text-rose-600">Admin</span>
                          )}
                          {isCommentTeacher && (
                            <span className="text-[10px] font-bold text-emerald-600">Guru</span>
                          )}
                          {!isCommentAdmin && !isCommentTeacher && commentClass && (
                            <span className="text-[10px] font-medium text-blue-600">{commentClass}</span>
                          )}
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(c.id || c.Id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity cursor-pointer shrink-0"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="text-gray-800 leading-relaxed font-normal break-words text-sm">
                        {c.content || c.Content}
                      </div>
                    </div>

                    {/* Comment Sub-bar: Timestamp & Reply */}
                    <div className="flex items-center gap-3 pl-2.5 mt-1 text-[10px] text-gray-400 font-semibold">
                      <span>
                        {new Date(c.createdAt || c.CreatedAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      {user && !isCommentsLocked && (
                        <button
                          onClick={() => handleStartReply(c)}
                          className="hover:text-blue-600 flex items-center gap-0.5 cursor-pointer"
                        >
                          <CornerDownRight className="w-2.5 h-2.5" /> Balas
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* VISUAL NESTED REPLIES (INDENTED UNDER PARENT COMMENT) */}
                {childReplies.length > 0 && (
                  <div className="ml-5 sm:ml-7 pl-3 border-l-2 border-blue-200/60 space-y-2.5 mt-1">
                    {childReplies.map((reply) => {
                      const replyAuthor = reply.authorName || reply.userName || reply.UserName || "Pengguna";
                      const canDeleteReply = isTeacherOrAdmin || (user?.id && (user.id === reply.userId || user.id === reply.UserId));

                      const replyPhoto = reply.userPhotoUrl || reply.UserPhotoUrl || reply.photoUrl || reply.PhotoUrl || reply.authorPhotoUrl || reply.AuthorPhotoUrl;
                      const resolvedReplyPhoto = replyPhoto ? resolveImageUrl(replyPhoto) : null;

                      const replyRole = (reply.userRole || reply.UserRole || "").toLowerCase();
                      const replyClass = reply.userClassName || reply.UserClassName;
                      const isReplyTeacher = replyRole === "teacher";
                      const isReplyAdmin = replyRole === "admin";

                      return (
                        <div key={reply.id || reply.Id} className="flex gap-2 items-start group">
                          {/* Nested Sub-Avatar (Photo or Initial fallback) */}
                          {resolvedReplyPhoto ? (
                            <img
                              src={resolvedReplyPhoto}
                              alt={replyAuthor || "Foto Pengguna"}
                              className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 shadow-2xs border border-gray-200"
                            />
                          ) : (
                            <div className={`w-6 h-6 rounded-full text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-2xs ${isReplyAdmin ? "bg-gradient-to-br from-rose-500 to-red-600" : isReplyTeacher ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
                              {replyAuthor.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="bg-blue-50/50 hover:bg-blue-50/80 p-2.5 rounded-2xl text-xs space-y-0.5 border border-blue-100/50">
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-gray-900 truncate">{replyAuthor}</span>
                                  {isReplyAdmin && (
                                    <span className="text-[9px] font-bold text-rose-600">Admin</span>
                                  )}
                                  {isReplyTeacher && (
                                    <span className="text-[9px] font-bold text-emerald-600">Guru</span>
                                  )}
                                  {!isReplyAdmin && !isReplyTeacher && replyClass && (
                                    <span className="text-[9px] font-medium text-blue-600">{replyClass}</span>
                                  )}
                                </div>
                                {canDeleteReply && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id || reply.Id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-600 transition-opacity cursor-pointer shrink-0"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>

                              <div className="text-gray-800 leading-normal font-normal break-words text-xs">
                                <span className="font-semibold text-blue-600 mr-1">@{author}</span>
                                {reply.content || reply.Content}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pl-2 mt-0.5 text-[9px] text-gray-400 font-semibold">
                              <span>
                                {new Date(reply.createdAt || reply.CreatedAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              {user && !isCommentsLocked && (
                                <button
                                  onClick={() => handleStartReply(c)}
                                  className="hover:text-blue-600 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <CornerDownRight className="w-2 h-2" /> Balas
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
            <MessageSquare className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs text-gray-500 font-medium">Belum ada komentar.</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Jadilah yang pertama berkomentar!</p>
          </div>
        )}
      </div>

      {/* ── EMOJI PICKER ROW & INPUT BOX AT BOTTOM ── */}
      <div className="p-3.5 bg-gray-50 border-t border-gray-100 space-y-2">
        
        {/* Large Emojis Bar for Quick Insert into Input */}
        {!isCommentsLocked && user && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
              Emoji:
            </span>
            {EMOJI_LIST.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleInsertEmoji(item.emoji)}
                className="text-lg hover:scale-125 transition-transform p-0.5 rounded cursor-pointer shrink-0"
                title={item.label}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        )}

        {isCommentsLocked ? (
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Komentar dikunci oleh pengelola.</span>
          </div>
        ) : user ? (
          <form onSubmit={handleSubmitComment} className="space-y-1.5">
            {replyingTo && (
              <div className="flex items-center justify-between text-[11px] bg-blue-50 text-blue-800 px-2.5 py-1 rounded-xl">
                <span className="truncate">
                  Membalas <strong>{replyingTo.authorName || replyingTo.userName || "Komentar"}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `Balas @${replyingTo.authorName || replyingTo.userName}...` : "Tulis komentar..."}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                required
              />

              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50 transition-all cursor-pointer shrink-0 shadow-xs"
                title="Kirim Komentar"
              >
                {submittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-[11px] text-gray-500 text-center py-1">
            Masuk ke akun Anda untuk menulis komentar.
          </p>
        )}
      </div>

    </div>
  );
}
