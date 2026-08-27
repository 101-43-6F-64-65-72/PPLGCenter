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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col font-sans text-slate-900 text-left">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-slate-900">
            {activeConv ? activeConv.title || "Percakapan" : "Pesan Langsung"}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {activeConv && (
            <button
              onClick={() => setActiveConv(null)}
              className="text-xs font-bold uppercase tracking-wider text-[#2C1EE8] hover:bg-blue-50 px-2 py-1 border border-blue-200 rounded-none cursor-pointer"
            >
              ← Kembali
            </button>
          )}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer">
            ✕
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!activeConv ? (
        /* Conversation List */
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">Belum ada percakapan aktif.</div>
          ) : (
            conversations.map((conv) => {
              const otherMember = conv.members.find((m) => m.userId !== currentUserId);
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className="p-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-none transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-none bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-[#2C1EE8] text-xs">
                      {otherMember?.fullName?.[0] || "U"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-900">
                        {conv.title || otherMember?.fullName || "Chat Direct"}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 font-normal">
                        {conv.lastMessage?.text || "[Lampiran]"}
                      </p>
                    </div>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-none bg-[#2C1EE8] text-white text-[9px] font-bold font-mono flex items-center justify-center shrink-0">
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
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/50">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] font-bold font-mono uppercase text-slate-400 mb-0.5 px-1">{msg.senderName}</span>
                  <div
                    className={`max-w-[85%] p-3 rounded-none text-xs break-words overflow-hidden ${
                      isMe
                        ? "bg-[#2C1EE8] text-white border border-[#2C1EE8]"
                        : "bg-white text-slate-900 border border-slate-200 shadow-xs"
                    }`}
                  >
                    {msg.text && <p className="leading-relaxed font-normal break-words">{msg.text}</p>}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/40 space-y-1">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] underline font-mono text-blue-200"
                          >
                            📎 {att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white text-xs space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:bg-white font-medium"
              />
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] text-white font-bold uppercase tracking-wider text-xs rounded-none transition-colors shadow-xs cursor-pointer disabled:opacity-50"
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
