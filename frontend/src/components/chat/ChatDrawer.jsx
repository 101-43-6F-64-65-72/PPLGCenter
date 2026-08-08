"use client";

import React, { useState, useEffect, useRef } from "react";
import { chatService } from "@/services/chatService";

export default function ChatDrawer({ isOpen, onClose, currentUserId }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Poll for new messages every 15 seconds
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const loadConversations = async () => {
      try {
        const res = await chatService.getConversations();
        if (isMounted && res?.data?.items) {
          setConversations(res.data.items);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    };

    loadConversations();
    const interval = setInterval(loadConversations, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    if (!activeConv) return;

    const loadMessages = async () => {
      try {
        const res = await chatService.getMessages(activeConv.id);
        if (isMounted && res?.data?.items) {
          setMessages(res.data.items);
          await chatService.markAsRead(activeConv.id);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachment) || !activeConv) return;

    setSending(true);
    try {
      const payload = {
        conversationId: activeConv.id,
        text: messageText,
        messageType: attachment ? 2 : 0,
        attachments: attachment ? [attachment] : null,
      };

      const res = await chatService.sendMessage(payload);
      if (res?.data) {
        setMessages((prev) => [...prev, res.data]);
        setMessageText("");
        setAttachment(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col font-sans">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h2 className="text-sm font-bold text-slate-100">
            {activeConv ? activeConv.title || "Percakapan" : "Pesan Langsung"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {activeConv && (
            <button
              onClick={() => setActiveConv(null)}
              className="text-xs text-indigo-400 hover:underline px-2 py-1 bg-slate-800 rounded"
            >
              ← Kembali
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-lg font-bold">
            ✕
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!activeConv ? (
        /* Conversation List */
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800 p-2">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">Belum ada percakapan aktif.</div>
          ) : (
            conversations.map((conv) => {
              const otherMember = conv.members.find((m) => m.userId !== currentUserId);
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className="p-3 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
                      {otherMember?.fullName?.[0] || "U"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">
                        {conv.title || otherMember?.fullName || "Chat Direct"}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {conv.lastMessage?.text || "[Lampiran]"}
                      </p>
                    </div>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Chat Messages Window */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] text-slate-500 mb-0.5 px-1">{msg.senderName}</span>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-800 text-slate-100 border border-slate-700/60 rounded-bl-none"
                    }`}
                  >
                    {msg.text && <p>{msg.text}</p>}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] underline font-mono text-emerald-300"
                          >
                            📎 {att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-500 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow"
              >
                Kirim
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
