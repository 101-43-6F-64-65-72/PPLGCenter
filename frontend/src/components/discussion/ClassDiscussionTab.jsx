"use client";

import React, { useState, useEffect } from "react";
import { discussionService } from "@/services/discussionService";

export default function ClassDiscussionTab({ classSubjectId, userRole }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [replies, setReplies] = useState([]);

  // Thread Form
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  // Reply Form
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [replyingToParentId, setReplyingToParentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!classSubjectId) return;

    const loadThreads = async () => {
      setLoading(true);
      try {
        const res = await discussionService.getThreadsByClassSubject(classSubjectId);
        if (isMounted && res?.data?.items) {
          setThreads(res.data.items);
        }
      } catch (err) {
        console.error("Failed to load discussions", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadThreads();
    return () => {
      isMounted = false;
    };
  }, [classSubjectId]);

  const loadReplies = async (threadId) => {
    try {
      const res = await discussionService.getReplies(threadId);
      if (res?.data) {
        setReplies(res.data);
      }
    } catch (err) {
      console.error("Failed to load replies", err);
    }
  };

  const handleOpenThread = async (thread) => {
    setActiveThread(thread);
    await loadReplies(thread.id);
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await discussionService.createThread({
        classSubjectId,
        title: newTitle,
        body: newBody,
      });
      setShowThreadModal(false);
      setNewTitle("");
      setNewBody("");
      const res = await discussionService.getThreadsByClassSubject(classSubjectId);
      if (res?.data?.items) setThreads(res.data.items);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal membuat diskusi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!activeThread) return;
    setSubmitting(true);
    try {
      await discussionService.createReply({
        threadId: activeThread.id,
        parentReplyId: replyingToParentId,
        body: replyText,
        attachmentUrl: replyAttachment?.url,
        attachmentFileName: replyAttachment?.fileName,
      });
      setReplyText("");
      setReplyAttachment(null);
      setReplyingToParentId(null);
      await loadReplies(activeThread.id);
      const res = await discussionService.getThreadsByClassSubject(classSubjectId);
      if (res?.data?.items) setThreads(res.data.items);
    } catch (err) {
      alert(err.response?.data?.message || "Gagal membalas diskusi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (threadId) => {
    try {
      await discussionService.togglePin(threadId);
      const res = await discussionService.getThreadsByClassSubject(classSubjectId);
      if (res?.data?.items) setThreads(res.data.items);
    } catch (err) {
      alert("Gagal menyematkan diskusi.");
    }
  };

  const handleToggleLock = async (threadId) => {
    try {
      await discussionService.toggleLock(threadId);
      const res = await discussionService.getThreadsByClassSubject(classSubjectId);
      if (res?.data?.items) setThreads(res.data.items);
    } catch (err) {
      alert("Gagal mengunci diskusi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>💬</span> Forum Diskusi Kelas
          </h3>
          <p className="text-xs text-slate-400">Tanyakan materi, tugas, dan berdiskusi dengan sesama anggota kelas.</p>
        </div>
        <button
          onClick={() => setShowThreadModal(true)}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <span>+</span> Buat Topik Diskusi
        </button>
      </div>

      {/* Main Grid: Thread List & Detail Modal */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">Memuat diskusi kelas...</div>
      ) : threads.length === 0 ? (
        <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-700 text-slate-400 text-xs">
          Belum ada topik diskusi di kelas ini. Klik tombol di atas untuk memulai diskusi baru.
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`bg-slate-800/90 border p-4 rounded-xl transition-all cursor-pointer hover:border-indigo-500/50 ${
                thread.isPinned ? "border-amber-500/50 bg-amber-500/5" : "border-slate-700"
              }`}
              onClick={() => handleOpenThread(thread)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {thread.isPinned && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                        📌 DISEMATHAN
                      </span>
                    )}
                    {thread.isLocked && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/30">
                        🔒 DIKUNCI
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-slate-100">{thread.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{thread.body}</p>
                </div>

                {/* Mod Tools for Teacher / Admin */}
                {(userRole === "Teacher" || userRole === "Admin") && (
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTogglePin(thread.id)}
                      className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                      title={thread.isPinned ? "Lepas Sematan" : "Sematkan Topik"}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => handleToggleLock(thread.id)}
                      className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                      title={thread.isLocked ? "Buka Kunci" : "Kunci Diskusi"}
                    >
                      🔒
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-700/50 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300">{thread.authorName}</span>
                  <span>•</span>
                  <span>{new Date(thread.createdAt).toLocaleDateString("id-ID")}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-indigo-400 font-semibold">
                  <span>💬 {thread.replyCount} Balasan</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Thread & Replies Tree */}
      {activeThread && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-700 pb-3">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">
                  {activeThread.subjectName} • {activeThread.className}
                </span>
                <h3 className="text-base font-bold text-slate-100">{activeThread.title}</h3>
                <p className="text-xs text-slate-400">Diposkan oleh {activeThread.authorName}</p>
              </div>
              <button
                onClick={() => setActiveThread(null)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {activeThread.body}
            </div>

            {/* Replies List */}
            <div className="overflow-y-auto flex-1 space-y-3 border border-slate-700/50 rounded-lg p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Balasan ({replies.length})</span>
              {replies.length === 0 ? (
                <div className="text-center text-slate-500 py-4 text-xs italic">Belum ada balasan. Jadilah yang pertama membalas!</div>
              ) : (
                replies.map((reply) => (
                  <div key={reply.id} className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/40 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-indigo-300">{reply.authorName} ({reply.authorRole})</span>
                      <span className="text-slate-500">{new Date(reply.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-slate-200">{reply.body}</p>
                    {reply.attachmentUrl && (
                      <a href={reply.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-emerald-400 underline">
                        📎 {reply.attachmentFileName || "Lampiran"}
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Reply Form */}
            {!activeThread.isLocked ? (
              <form onSubmit={handleCreateReply} className="space-y-2 text-xs pt-2 border-t border-slate-700">
                <textarea
                  rows="2"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tulis balasan... (gunakan @username untuk menyebut)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Maksimal balasan 1000 karakter</span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow"
                  >
                    {submitting ? "Kirim..." : "Kirim Balasan"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                🔒 Topik diskusi ini telah dikunci oleh pengampu. Balasan baru tidak diizinkan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Create Thread */}
      {showThreadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-100">Buat Topik Diskusi Baru</h3>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Judul Topik</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Pertanyaan Tugas Modul 3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Isi Pertanyaan / Diskusi</label>
                <textarea
                  rows="4"
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Jelaskan pertanyaan atau topik diskusi Anda..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowThreadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
                >
                  {submitting ? "Membuat..." : "Publikasikan Topik"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
