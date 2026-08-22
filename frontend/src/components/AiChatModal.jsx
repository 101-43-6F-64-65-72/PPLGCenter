"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Send, Sparkles, Bot, Zap, Key } from "lucide-react";
import BloubMascot from "@/components/BloubMascot";
import { AI_TOOLS, executeAiTool } from "@/services/aiTools";
import { generateReplyzAiResponse, getAiApiKey } from "@/services/aiService";
import { getStoredToken } from "@/lib/api";
import { profileService } from "@/services/profileService";

/**
 * Quick Suggestion Chips Configuration with Autonomous Tool Invocation
 */
const QUICK_CHIPS = [
  {
    id: "notif_spotlight",
    icon: "🔔",
    label: "Di mana tombol notifikasi?",
    query: "Di mana tombol notifikasi?",
    toolCall: { tool: AI_TOOLS.HIGHLIGHT_UI.name, parameters: { target: "notif_button" } },
  },
  {
    id: "jadwal_fetch",
    icon: "📅",
    label: "Cek jadwal pelajaran",
    query: "Cek jadwal pelajaran hari ini",
    toolCall: { tool: AI_TOOLS.FETCH_SCHEDULE.name, parameters: {} },
  },
  {
    id: "announcement_fetch",
    icon: "📢",
    label: "Pengumuman sekolah terbaru",
    query: "Ada pengumuman apa hari ini?",
    toolCall: { tool: AI_TOOLS.FETCH_ANNOUNCEMENTS.name, parameters: { limit: 3 } },
  },
  {
    id: "login_modal",
    icon: "🔐",
    label: "Bagaimana cara login siswa?",
    query: "Buka modal login siswa",
    toolCall: { tool: AI_TOOLS.OPEN_MODAL.name, parameters: { modalName: "login" } },
  },
  {
    id: "circle_nav",
    icon: "🚀",
    label: "Jelajahi Circle PPLG",
    query: "Bawa aku ke halaman komunitas",
    toolCall: { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/komunitas" } },
  },
];

const INITIAL_MESSAGE = {
  id: "welcome-msg",
  sender: "bot",
  text: "Halo! Aku Replyz, asisten virtual Student Center SMKN 2 Surakarta. Aku terhubung dengan AI Engine & Action Execution Engine untuk membantu navigasi, spotlight UI, serta membaca pengumuman & jadwal!",
  timestamp: "Baru saja",
  showChips: true,
};

export default function AiChatModal() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [triggerEmotion, setTriggerEmotion] = useState("idle");
  const [chatEmotion, setChatEmotion] = useState("idle");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Authenticated User Access Check
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      try {
        const profRes = await profileService.getProfile().catch(() => null);
        if (profRes?.data || profRes) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Check for API key status on mount
  useEffect(() => {
    const key = getAiApiKey();
    setHasApiKey(Boolean(key && key !== "your_ai_api_key_here"));
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Active trigger state logic
  const activeTriggerState = isHovered && !isOpen
    ? "happy"
    : isOpen
    ? "happy"
    : triggerEmotion;

  /**
   * Handle user message submission & AI execution
   */
  const handleSendMessage = async (textToSend = null, customReply = null, directToolCall = null) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText || isTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Append User Message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");

    // 2. Choreography: Mascot enters thinking / notification state
    setIsTyping(true);
    setChatEmotion("peek");
    setTriggerEmotion("notif");

    // 3. Process AI Response (Live AI Key or Autonomous Function Calling Engine)
    setTimeout(async () => {
      let responseText = "";
      let actionBadge = null;
      let aiEmotion = "happy";
      let suggestions = [];

      if (directToolCall) {
        const toolResult = await executeAiTool(directToolCall.tool, directToolCall.parameters, { router });
        responseText = customReply || toolResult.resultMessage;
        if (toolResult && toolResult.suggestions) suggestions = toolResult.suggestions;
        actionBadge = {
          name: toolResult.actionName || directToolCall.tool,
          tool: directToolCall.tool,
          params: directToolCall.parameters,
        };
      } else {
        const aiRes = await generateReplyzAiResponse(queryText, { router });
        responseText = customReply || aiRes.text;
        actionBadge = aiRes.actionBadge;
        if (aiRes && aiRes.suggestions) suggestions = aiRes.suggestions;
        if (aiRes && aiRes.emotion) {
          aiEmotion = aiRes.emotion;
        }
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: responseText,
        actionBadge,
        suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      // 4. Choreography: Mascot emotion driven by LLM response
      setChatEmotion(aiEmotion);
      setTriggerEmotion(aiEmotion);

      // Reset to idle after brief moment
      setTimeout(() => {
        setChatEmotion("idle");
        setTriggerEmotion("idle");
      }, 3000);
    }, 650);
  };

  /**
   * Handle Quick Suggestion Chip Click
   */
  const handleChipClick = (chip) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.showChips ? { ...msg, showChips: false } : msg))
    );
    handleSendMessage(chip.query, null, chip.toolCall);
  };

  /**
   * Clear Chat History
   */
  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setChatEmotion("happy");
    setTimeout(() => setChatEmotion("idle"), 1500);
  };

  /**
   * Input focus handler
   */
  const handleInputFocus = () => {
    setChatEmotion("idle");
  };

  // Restrict Replyz assistant widget strictly to logged-in users
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING MASCOT TRIGGER (Bottom-Right Viewport)
         ───────────────────────────────────────────────────────────── */}
      <div id="ai-chat-modal" className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
        {/* Floating Tooltip Pill */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(true)}
              className="mb-1.5 bg-blue-600 text-white shadow-md border border-blue-500/40 text-[10px] tracking-wider uppercase font-black px-2.5 py-0.5 rounded-full cursor-pointer flex items-center gap-1 select-none hover:bg-blue-700 transition-all"
            >
              <span>BETA</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot Trigger Button */}
        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="relative group p-1 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl shadow-blue-500/20 rounded-full flex items-center justify-center transition-all hover:shadow-blue-500/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          aria-label={isOpen ? "Tutup Chat Replyz AI" : "Buka Chat Replyz AI"}
        >
          <BloubMascot
            size={56}
            state={activeTriggerState}
            badge={true}
            badgeColor="#38bdf8"
            badgePulse={true}
          />
        </motion.button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CHATBOT MODAL / POPOVER UI ARCHITECTURE
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[80vh] z-50 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-2xl shadow-blue-500/10 flex flex-col overflow-hidden font-sans"
          >
            {/* ── Modal Header ── */}
            <div className="bg-gradient-to-r from-blue-50/90 via-white to-blue-50/60 border-b border-slate-100 px-4 py-3 flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <div className="relative p-0.5 bg-white rounded-full border border-blue-100 shadow-sm">
                  <BloubMascot size={38} state={chatEmotion} badge={false} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 leading-tight">
                    Replyz Assistant
                    <span className="text-[10px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      BETA
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-slate-500">
                      Online • Siap Membantu
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Bersihkan Percakapan"
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100/80 rounded-xl transition-colors focus:outline-none"
                  aria-label="Bersihkan chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Tutup Modal"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-xl transition-colors focus:outline-none"
                  aria-label="Tutup chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Chat Body (Message Thread) ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200 bg-gradient-to-b from-white via-white to-blue-50/20">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col space-y-2">
                  {/* Bubble Container */}
                  <div
                    className={`flex items-start gap-2 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Bot Icon Avatar */}
                    {msg.sender === "bot" && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[85%]">
                      <div
                        className={`p-3.5 text-sm leading-relaxed whitespace-pre-line ${
                          msg.sender === "bot"
                            ? "bg-slate-100/90 text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200/60 shadow-sm"
                            : "bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-blue-500/20 self-end"
                        }`}
                      >
                        {msg.text}
                      </div>

                      <span
                        className={`text-[10px] text-slate-400 mt-1 px-1 ${
                          msg.sender === "user" ? "self-end" : "self-start"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Action Suggestion Chips (Attached by AI Response) */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-9">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (sug.route) router.push(sug.route);
                            else if (sug.query) handleSendMessage(sug.query);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200 hover:border-blue-300 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer text-left active:scale-95 hover:shadow-md"
                        >
                          <span>{sug.icon || "📍"}</span>
                          <span>{sug.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Suggestion Chips (If attached to message) */}
                  {msg.showChips && (
                    <div className="mt-2 pt-1 flex flex-wrap gap-2 pl-9">
                      <p className="w-full text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        Rekomendasi Aksi Otomatis:
                      </p>
                      {QUICK_CHIPS.map((chip) => (
                        <button
                          key={chip.id}
                          onClick={() => handleChipClick(chip)}
                          className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-300 transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left"
                        >
                          <span>{chip.icon}</span>
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Bot Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs font-medium border border-slate-200/60 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span>Replyz sedang berpikir...</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* ── Chat Footer / Input Area ── */}
            <div className="p-3 bg-white border-t border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-inner"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Tanyakan sesuatu ke Replyz..."
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none py-1"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center flex-shrink-0"
                  aria-label="Kirim Pesan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
