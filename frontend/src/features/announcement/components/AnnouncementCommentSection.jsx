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
    hoverTimeoutRef.current = setTimeout(() => {
      setShowReactionPopup(false);
    }, 300);
  };

  // Mobile Click Handler
  const handleTriggerClick = () => {
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
        : Array.isArray(res)
        ? res
        : [];
      setComments(items);
    } catch (err) {
      console.warn("Failed to load comments:", err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [announcementId]);

  // Fetch Current Reactions & Current User's Selected Reaction
  const fetchReactions = useCallback(async () => {
    if (!announcementId) return;
    try {
      const res = await announcementService.getReactions(announcementId);
      const data = res?.data || res || {};

      let initialCounts = {};
      if (data?.summary && typeof data.summary === "object") {
        initialCounts = data.summary;
      } else if (data?.counts && typeof data.counts === "object") {
        initialCounts = data.counts;
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        Object.keys(data).forEach((k) => {
          if (typeof data[k] === "number") {
            initialCounts[k] = data[k];
          }
        });
      }

      setReactionsCount(initialCounts);
      setUserReaction(data?.userReaction || data?.currentUserReaction || null);
    } catch (err) {
      console.warn("Failed to load reactions summary:", err);
    }
  }, [announcementId]);

  useEffect(() => {
    fetchComments();
    fetchReactions();
  }, [fetchComments, fetchReactions]);

  // Handle Emoji Selection & Click
  const handleReactionClick = async (reactionType) => {
    if (!user) {
      alert("Silakan masuk terlebih dahulu untuk memberikan reaksi.");
      return;
    }
    if (submittingReaction) return;

    const previousReaction = userReaction;
    const isRemoving = previousReaction === reactionType;

    // Optimistic UI Update
    setUserReaction(isRemoving ? null : reactionType);
    setReactionsCount((prev) => {
      const next = { ...prev };
      if (previousReaction && next[previousReaction] > 0) {
        next[previousReaction] = Math.max(0, next[previousReaction] - 1);
      }
      if (!isRemoving) {
        next[reactionType] = (next[reactionType] || 0) + 1;
      }
      return next;
    });

    setShowReactionPopup(false);
    setSubmittingReaction(true);

    try {
      await announcementService.toggleReaction(announcementId, reactionType);
    } catch (err) {
      console.error("Reaction failed, rolling back:", err);
      // Rollback on error
      setUserReaction(previousReaction);
      fetchReactions();
    } finally {
      setSubmittingReaction(false);
    }
  };

  // Handle Comment Submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment || isCommentsLocked) return;

    if (!user) {
      alert("Silakan login untuk menulis komentar.");
      return;
    }

    setSubmittingComment(true);
    try {
      await announcementService.addComment(announcementId, {
        content: newComment.trim(),
        parentCommentId: replyingTo?.id || replyingTo?.Id || null
      });

      setNewComment("");
      setReplyingTo(null);
      await fetchComments();
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert(err?.response?.data?.message || "Gagal mengirim komentar.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Comment Deletion
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus komentar ini?")) return;
    try {
      await announcementService.deleteComment(announcementId, commentId);
      await fetchComments();
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert(err?.response?.data?.message || err?.message || "Gagal menghapus komentar.");
    }
  };

  // Toggle Comment Section Lock / Unlock (For Teachers & Admin)
  const handleToggleLock = async () => {
    if (!isTeacherOrAdmin) return;
    const newLockState = !isCommentsLocked;
    try {
      await announcementService.toggleCommentsLock(announcementId, newLockState);
      setIsCommentsLocked(newLockState);
    } catch (err) {
      console.error("Failed to toggle lock status:", err);
      alert("Gagal mengubah status kunci komentar.");
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

  const totalReactionsCount = useMemo(() => {
    return Object.values(reactionsCount).reduce((acc, curr) => acc + (typeof curr === "number" ? curr : 0), 0);
  }, [reactionsCount]);

  const activeReactionsSummary = useMemo(() => {
    return EMOJI_LIST.filter((item) => (reactionsCount[item.type] || 0) > 0);
  }, [reactionsCount]);

  return (
    <div className="bg-white border border-slate-200 rounded-none shadow-xs overflow-visible flex flex-col font-sans relative text-left">
      
      {/* ── HEADER & REACTION BAR ── */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        
        {/* Top Summary Bar */}
        {(totalReactionsCount > 0 || isTeacherOrAdmin) && (
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 mb-3 pb-2 border-b border-slate-200">
            {totalReactionsCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="flex -space-x-1 items-center">
                  {activeReactionsSummary.map((item) => (
                    <span key={item.type} className="text-base">
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
                className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
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

        {/* Reaction Trigger Area */}
        <div
          className="relative inline-block w-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Animated Reaction Popup Modal */}
          {showReactionPopup && (
            <>
              <div className="hidden md:block absolute -top-5 left-0 right-0 h-5 bg-transparent z-40" />

              {/* PC / Desktop Hover Floating Popup */}
              <div className="hidden md:grid grid-cols-6 gap-1.5 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white p-2.5 rounded-none shadow-lg border border-slate-200 z-50 w-max max-w-[280px]">
                {EMOJI_LIST.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleReactionClick(item.type)}
                    className="text-xl hover:scale-125 transition-transform cursor-pointer p-1 flex items-center justify-center rounded-none hover:bg-blue-50"
                    title={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>

              {/* Mobile Click Sheet Modal */}
              <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4">
                <div
                  className="bg-white rounded-none w-full p-4 border border-slate-200 shadow-xl space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pilih Reaksi</span>
                    <button
                      type="button"
                      onClick={() => setShowReactionPopup(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
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
                        className="text-2xl p-1.5 rounded-none hover:bg-slate-100 flex flex-col items-center gap-1"
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
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
              userReaction
                ? "bg-blue-50 text-[#2C1EE8] border-blue-200 shadow-2xs"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            {currentUserEmojiObj ? (
              <span className="text-lg leading-none">{currentUserEmojiObj.emoji}</span>
            ) : (
              <ThumbsUp className="w-4 h-4 text-[#2C1EE8]" />
            )}
            <span>{currentUserEmojiObj ? currentUserEmojiObj.label : "Beri Reaksi"}</span>
          </button>
        </div>

      </div>

      {/* ── COMMENTS SCROLLABLE FEED WITH NESTED REPLIES ── */}
      <div className="p-4 max-h-[480px] sm:max-h-[540px] overflow-y-auto space-y-4">
        {loadingComments ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-bold uppercase tracking-wider">
            <Loader2 className="w-4 h-4 animate-spin text-[#2C1EE8]" />
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
                  {/* User Avatar */}
                  {resolvedPhoto ? (
                    <img
                      src={resolvedPhoto}
                      alt={author || "Foto Pengguna"}
                      className="w-7 h-7 rounded-none object-cover shrink-0 mt-0.5 border border-slate-200"
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-none text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${isCommentAdmin ? "bg-rose-600" : isCommentTeacher ? "bg-emerald-600" : "bg-[#2C1EE8]"}`}>
                      {author.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Comment Bubble */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-none text-xs space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 truncate">{author}</span>
                          {isCommentAdmin && (
                            <span className="text-[9.5px] font-bold uppercase text-rose-600">Admin</span>
                          )}
                          {isCommentTeacher && (
                            <span className="text-[9.5px] font-bold uppercase text-emerald-600">Guru</span>
                          )}
                          {!isCommentAdmin && !isCommentTeacher && commentClass && (
                            <span className="text-[9.5px] font-mono text-[#2C1EE8]">{commentClass}</span>
                          )}
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(c.id || c.Id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer shrink-0"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="text-slate-800 leading-relaxed font-normal break-words text-xs sm:text-sm">
                        {c.content || c.Content}
                      </div>
                    </div>

                    {/* Comment Sub-bar */}
                    <div className="flex items-center gap-3 pl-1 mt-1 text-[10px] text-slate-400 font-medium font-mono">
                      <span>
                        {new Date(c.createdAt || c.CreatedAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      {user && !isCommentsLocked && (
                        <button
                          onClick={() => handleStartReply(c)}
                          className="hover:text-[#2C1EE8] font-bold uppercase tracking-wider text-slate-600 cursor-pointer flex items-center gap-0.5"
                        >
                          <CornerDownRight className="w-2.5 h-2.5" />
                          <span>Balas</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nested Replies */}
                {childReplies.length > 0 && (
                  <div className="pl-8 space-y-2 border-l-2 border-slate-100 ml-3.5">
                    {childReplies.map((r) => {
                      const rAuthor = r.authorName || r.userName || r.UserName || "Pengguna";
                      const rCanDelete = isTeacherOrAdmin || (user?.id && (user.id === r.userId || user.id === r.UserId));
                      const rPhoto = r.userPhotoUrl || r.UserPhotoUrl || r.photoUrl || r.PhotoUrl || r.authorPhotoUrl || r.AuthorPhotoUrl;
                      const rResolvedPhoto = rPhoto ? resolveImageUrl(rPhoto) : null;
                      const rRole = (r.userRole || r.UserRole || "").toLowerCase();
                      const rClass = r.userClassName || r.UserClassName;

                      return (
                        <div key={r.id || r.Id} className="flex gap-2 items-start group">
                          {rResolvedPhoto ? (
                            <img
                              src={rResolvedPhoto}
                              alt={rAuthor}
                              className="w-6 h-6 rounded-none object-cover shrink-0 mt-0.5 border border-slate-200"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-none bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[9.5px] shrink-0 mt-0.5">
                              {rAuthor.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-none text-xs space-y-0.5">
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold text-slate-900 truncate">{rAuthor}</span>
                                {rCanDelete && (
                                  <button
                                    onClick={() => handleDeleteComment(r.id || r.Id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="text-slate-700 leading-relaxed font-normal break-words text-xs">
                                {r.content || r.Content}
                              </div>
                            </div>
                            <div className="pl-1 mt-0.5 text-[9.5px] text-slate-400 font-mono">
                              {new Date(r.createdAt || r.CreatedAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
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
          <div className="py-12 text-center text-slate-400 space-y-1">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Belum ada diskusi atau tanggapan</p>
            <p className="text-[11px] text-slate-400 font-medium">Jadilah yang pertama memberikan respon pada pengumuman ini.</p>
          </div>
        )}
      </div>

      {/* ── COMMENT INPUT COMPOSER ── */}
      <div className="p-3 border-t border-slate-100 bg-white">
        {isCommentsLocked ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-none text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Komentar dikunci oleh Administrator / Guru</span>
          </div>
        ) : user ? (
          <form onSubmit={handleSubmitComment} className="space-y-2">
            {replyingTo && (
              <div className="flex items-center justify-between px-2 py-1 bg-blue-50 border border-blue-100 rounded-none text-[11px] font-bold text-[#2C1EE8]">
                <span>Membalas {replyingTo.authorName || replyingTo.userName || "Komentar"}...</span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Tulis balasan Anda..." : "Tulis komentar atau tanggapan..."}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submittingComment}
                className="absolute right-1.5 p-1.5 bg-[#2C1EE8] text-white rounded-none disabled:opacity-40 hover:bg-[#2013ce] active:bg-[#1d129f] transition-colors cursor-pointer"
                title="Kirim"
              >
                {submittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-none text-center text-xs text-slate-600 font-medium">
            Silakan login untuk bergabung dalam diskusi pengumuman ini.
          </div>
        )}
      </div>

    </div>
  );
}
