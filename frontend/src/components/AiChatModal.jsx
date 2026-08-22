"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Send, Sparkles, Zap, Bell, Calendar, Megaphone, Lock, Rocket } from "lucide-react";
import ReplyzMascot from "@/components/ReplyzMascot";
import { AI_TOOLS, executeAiTool } from "@/services/aiTools";
import { generateReplyzAiResponse, getAiApiKey } from "@/services/aiService";
import { getStoredToken } from "@/lib/api";
import { profileService } from "@/services/profileService";

const CHIP_ICON_MAP = {
  notif_spotlight: Bell,
  jadwal_fetch: Calendar,
  announcement_fetch: Megaphone,
  login_modal: Lock,
  circle_nav: Rocket,
};

/**
 * Quick Suggestion Chips Configuration with Autonomous Tool Invocation
 */
const QUICK_CHIPS = [
  {
    id: "notif_spotlight",
    label: "Di mana tombol notifikasi?",
    query: "Di mana tombol notifikasi?",
    toolCall: { tool: AI_TOOLS.HIGHLIGHT_UI.name, parameters: { target: "notif_button" } },
  },
  {
    id: "jadwal_fetch",
    label: "Cek jadwal pelajaran",
    query: "Cek jadwal pelajaran hari ini",
    toolCall: { tool: AI_TOOLS.FETCH_SCHEDULE.name, parameters: {} },
  },
  {
    id: "announcement_fetch",
    label: "Pengumuman sekolah terbaru",
    query: "Ada pengumuman apa hari ini?",
    toolCall: { tool: AI_TOOLS.FETCH_ANNOUNCEMENTS.name, parameters: { limit: 3 } },
  },
  {
    id: "login_modal",
    label: "Bagaimana cara login siswa?",
    query: "Buka modal login siswa",
    toolCall: { tool: AI_TOOLS.OPEN_MODAL.name, parameters: { modalName: "login" } },
  },
  {
    id: "circle_nav",
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Easter Egg 4-Second Hold & Flying Mascot Transition
  const [holdProgress, setHoldProgress] = useState(0);
  const [isFlyingToScreen, setIsFlyingToScreen] = useState(false);
  const holdIntervalRef = useRef(null);
  const holdStartRef = useRef(null);

  const startHold = () => {
    if (isOpen || isFlyingToScreen) return;
    holdStartRef.current = Date.now();
    setHoldProgress(0);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min((elapsed / 4000) * 100, 100);
      setHoldProgress(progress);

      if (elapsed >= 4000) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setHoldProgress(0);
        triggerEasterEgg();
      }
    }, 35);
  };

  const cancelHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  const triggerEasterEgg = () => {
    setIsFlyingToScreen(true);
    setTimeout(() => {
      router.push("/mascot");
      setTimeout(() => {
        setIsFlyingToScreen(false);
      }, 500);
    }, 1100);
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const chatThreadRef = useRef(null);
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

  const [hasCompletedGuide, setHasCompletedGuide] = useState(false);

  useEffect(() => {
    const checkGuideState = () => {
      if (typeof window !== "undefined") {
        const completed = localStorage.getItem("sc_has_completed_manual_guide");
        setHasCompletedGuide(Boolean(completed));
      }
    };
    checkGuideState();

    const handleResetGuide = () => setHasCompletedGuide(false);
    if (typeof window !== "undefined") {
      window.addEventListener("app:reset-manual-guide-cache", handleResetGuide);
      window.addEventListener("app:start-manual-guide", checkGuideState);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("app:reset-manual-guide-cache", handleResetGuide);
        window.removeEventListener("app:start-manual-guide", checkGuideState);
      }
    };
  }, []);

  // Escape key listener to close modal smoothly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Auto scroll to bottom smoothly within chat thread container
  useEffect(() => {
    if (isOpen && chatThreadRef.current) {
      chatThreadRef.current.scrollTo({
        top: chatThreadRef.current.scrollHeight,
        behavior: "smooth",
      });
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

    // 2. Choreography: Mascot enters thinking state
    setIsTyping(true);
    setChatEmotion("thinking");
    setTriggerEmotion("thinking");

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
    setTimeout(() => {
      setChatEmotion("idle");
      inputRef.current?.focus();
    }, 1200);
  };

  /**
   * Input focus handler
   */
  const handleInputFocus = () => {
    setChatEmotion("idle");
  };

  // Restrict Replyz assistant widget strictly to logged-in users after mounting
  if (!mounted || !isLoggedIn) {
    return null;
  }

  return createPortal(
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING MASCOT TRIGGER BUTTON (Bottom-Right Viewport)
         ───────────────────────────────────────────────────────────── */}
      <div
        id="ai-chat-modal"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          left: "auto",
          top: "auto",
          zIndex: 99999,
        }}
        className="flex flex-col items-end pointer-events-auto select-none"
      >
        {/* Floating Tooltip Pills */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-1.5 flex items-center gap-1.5"
            >
              {!hasCompletedGuide && (
                <div
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md border border-blue-500/40 text-[10px] tracking-wider uppercase font-black px-2.5 py-0.5 rounded-full cursor-pointer flex items-center gap-1.5 select-none transition-all"
                  title="Panduan Manual Replyz"
                >
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("app:start-manual-guide"));
                      }
                    }}
                    className="hover:underline"
                  >
                    Panduan manual
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof window !== "undefined") {
                        localStorage.setItem("sc_has_completed_manual_guide", "true");
                        setHasCompletedGuide(true);
                      }
                    }}
                    className="hover:bg-blue-800/80 p-0.5 rounded-full text-blue-100 hover:text-white transition-colors cursor-pointer"
                    title="Hapus Panduan Manual"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 text-white shadow-md border border-blue-500/40 text-[10px] tracking-wider uppercase font-black px-2 py-0.5 rounded-full cursor-pointer flex items-center gap-1 select-none hover:bg-blue-700 transition-all"
              >
                <span>BETA</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot Trigger Button (Supports 4-Second Easter Egg Hold) */}
        <motion.button
          onClick={() => {
            if (holdProgress < 30) setIsOpen((prev) => !prev);
          }}
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={() => {
            setIsHovered(false);
            cancelHold();
          }}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          onMouseEnter={() => setIsHovered(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="relative group p-1 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 shadow-2xl shadow-blue-600/35 rounded-full flex items-center justify-center transition-all hover:shadow-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/30 select-none cursor-pointer"
          aria-label={isOpen ? "Tutup Chat Replyz AI" : "Buka Chat Replyz AI"}
          title={isOpen ? "Tutup Chat Replyz AI" : "Replyz AI Assistant"}
        >
          {/* Circular SVG Hold Progress Ring */}
          {holdProgress > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20 overflow-visible">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeDasharray="260"
                strokeDashoffset={260 - (260 * holdProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>
          )}

          <ReplyzMascot
            size={56}
            state={holdProgress > 0 ? "shock" : activeTriggerState}
            badge={holdProgress <= 0}
            badgeColor="#38bdf8"
            badgePulse={true}
          />
        </motion.button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CHATBOT POPOVER MODAL WINDOW (Fixed Bottom-24 Right-6)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            style={{
              position: "fixed",
              bottom: "5.5rem",
              right: "1.5rem",
              left: "auto",
              top: "auto",
              height: "min(520px, calc(100vh - 7rem))",
              maxHeight: "calc(100vh - 7rem)",
              zIndex: 99999,
            }}
            className="w-[390px] max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl shadow-blue-600/20 rounded-[32px] flex flex-col overflow-hidden font-sans relative text-slate-900 pointer-events-auto select-none"
          >
            {/* Ambient Liquid Glass Gradient Orbs */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute top-1/2 -right-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:1s]" />
            <div className="absolute -bottom-24 -left-12 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:2s]" />

            {/* Modal Header */}
            <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between select-none relative z-10 shrink-0 w-full">
              <div className="flex items-center gap-2.5">
                <div className="relative p-0.5 bg-slate-900/90 rounded-full border border-slate-700/80 shadow-xs">
                  <ReplyzMascot size={38} state={chatEmotion} badge={false} />
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
                    <span className="text-[11px] font-medium text-slate-600">
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
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none cursor-pointer"
                  aria-label="Bersihkan chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Tutup Modal (Esc)"
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none cursor-pointer"
                  aria-label="Tutup chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Thread Container: Guarantees full flex fill without empty white gap */}
            <div
              ref={chatThreadRef}
              className="flex-1 h-full min-h-0 w-full overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-300/60 relative z-10 bg-slate-50/50 flex flex-col justify-start"
            >
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col space-y-2 w-full">
                  {/* Bubble Container */}
                  <div
                    className={`flex items-start gap-2 w-full ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex flex-col max-w-[85%]">
                      <div
                        className={`p-3.5 text-sm leading-relaxed whitespace-pre-line ${
                          msg.sender === "bot"
                            ? "bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200/90 shadow-xs font-normal"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-blue-500/20 self-end font-medium"
                        }`}
                      >
                        {msg.text}
                      </div>

                      <span
                        className={`text-[10px] text-slate-400 font-medium mt-1 px-1 ${
                          msg.sender === "user" ? "self-end" : "self-start"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Action Suggestion Chips (Attached by AI Response) */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-1">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (sug.route) router.push(sug.route);
                            else if (sug.query) handleSendMessage(sug.query);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-left active:scale-95 hover:shadow-md"
                        >
                          <span>{sug.icon || "📍"}</span>
                          <span>{sug.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Suggestion Chips (Attached to welcome message) */}
                  {msg.showChips && (
                    <div className="mt-2 pt-1 flex flex-wrap gap-2 pl-1">
                      <p className="w-full text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        Rekomendasi Aksi Otomatis:
                      </p>
                      {QUICK_CHIPS.map((chip) => {
                        const ChipIcon = CHIP_ICON_MAP[chip.id] || Sparkles;
                        return (
                          <button
                            key={chip.id}
                            onClick={() => handleChipClick(chip)}
                            className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200/90 transition-all shadow-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left"
                          >
                            <ChipIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{chip.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Bot Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="bg-white text-slate-600 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs font-medium border border-slate-200/90 flex items-center gap-1.5 shadow-xs">
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
            </div>

            {/* Chat Footer / Input Area: Pinned to bottom, shrink-0 mt-auto */}
            <div className="mt-auto shrink-0 w-full p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 relative z-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="bg-slate-100/90 border border-slate-200/90 rounded-full px-3.5 py-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-white transition-all shadow-xs"
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
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-xs"
                  aria-label="Kirim Pesan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. EASTER EGG FLYING MASCOT TRANSITION OVERLAY
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFlyingToScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-[#071329]/95 backdrop-blur-2xl flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none"
          >
            {/* Ambient Flying Portal Orbs */}
            <motion.div
              animate={{ scale: [1, 3, 6], opacity: [0.3, 0.8, 0] }}
              transition={{ duration: 1.1, ease: "easeIn" }}
              className="absolute w-96 h-96 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full blur-3xl"
            />

            {/* Mascot Flying Toward Screen Animation */}
            <motion.div
              initial={{ scale: 0.3, y: 160, rotate: -10, opacity: 0.8 }}
              animate={{
                scale: [0.3, 2.2, 35],
                y: [160, -20, -120],
                rotate: [-10, 5, 0],
                opacity: [0.8, 1, 0.9, 0],
              }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col items-center justify-center"
            >
              <ReplyzMascot size={240} state="happy" badge={false} />
            </motion.div>

            {/* Secret Easter Egg Hint Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="absolute bottom-16 text-center space-y-1 z-20"
            >
              <p className="text-sm font-black text-amber-300 tracking-widest uppercase flex items-center gap-1.5 justify-center">
                <span>🤫</span> STTT...
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Terbang ke rahasia PPLG Center
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}

