"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReplyzMascot from "@/components/ReplyzMascot";
import quizService from "@/services/quizService";
import {
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  Globe,
  Sliders,
  Play,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Code2,
  HelpCircle,
  Cpu,
  ArrowRight,
  Layers,
  Terminal,
  Brain,
  Hash,
  Eye,
  FileCode2
} from "lucide-react";

const PRESETS = [
  {
    id: "bitdeer-deepseek",
    name: "Bitdeer AI — DeepSeek V4 Flash",
    provider: "bitdeer",
    apiUrl: "https://api-inference.bitdeer.ai/v1/chat/completions",
    model: "deepseek-ai/DeepSeek-V4-Flash",
    description: "DeepSeek V4 Flash via Bitdeer Cloud (Sangat Cepat & Cerdas).",
    badge: "DeepSeek Bitdeer"
  },
  {
    id: "bitdeer-qwen",
    name: "Bitdeer AI — Qwen 27B",
    provider: "bitdeer",
    apiUrl: "https://api-inference.bitdeer.ai/v1/chat/completions",
    model: "Qwen/Qwen3.8-27B",
    description: "Model Bitdeer AI Cloud dengan kapabilitas Chain-of-Thought.",
    badge: "Cloud Bitdeer"
  },
  {
    id: "groq-llama8b",
    name: "Groq — Llama 3.1 8B Instant",
    provider: "groq",
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant",
    description: "Pilihan terbaik: Kilat (~0.4s), murni JSON tanpa reasoning bloat.",
    badge: "Rekomendasi Utama"
  },
  {
    id: "groq-llama70b",
    name: "Groq — Llama 3.3 70B Versatile",
    provider: "groq",
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    description: "Kecerdasan tingkat tinggi untuk soal analitik kejuruan sulit.",
    badge: "Akurasi Tinggi"
  },
  {
    id: "custom-openai",
    name: "Custom OpenAI-Compatible API",
    provider: "custom",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    description: "Gunakan endpoint lain (OpenAI, OpenCode, Together AI, Ollama, dll).",
    badge: "Custom"
  }
];

function SyntaxHighlightedJson({ jsonString }) {
  let formatted = jsonString;
  try {
    const parsed = JSON.parse(jsonString);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    formatted = jsonString || "{}";
  }

  const lines = formatted.split("\n");

  return (
    <div className="font-mono text-[11px] leading-relaxed select-text overflow-x-auto p-4 bg-[#070d19] text-slate-300 border border-slate-800 shadow-inner">
      <div className="table w-full">
        {lines.map((line, lineIdx) => {
          // Highlight keys, strings, numbers, booleans, null
          const highlighted = line.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
              let cls = "text-amber-300"; // number
              if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                  cls = "text-sky-300 font-bold"; // key
                } else {
                  cls = "text-emerald-300"; // string
                }
              } else if (/true|false/.test(match)) {
                cls = "text-purple-300 font-bold"; // boolean
              } else if (/null/.test(match)) {
                cls = "text-rose-300 italic"; // null
              }
              return `<span class="${cls}">${match}</span>`;
            }
          );

          return (
            <div key={lineIdx} className="table-row hover:bg-slate-800/40">
              <span className="table-cell pr-4 text-slate-600 select-none text-right font-mono text-[10px] w-8 border-r border-slate-800/80 mr-3">
                {lineIdx + 1}
              </span>
              <span
                className="table-cell pl-3 whitespace-pre"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AiTestDevPage() {
  const [selectedPreset, setSelectedPreset] = useState("bitdeer-deepseek");
  const [provider, setProvider] = useState("bitdeer");
  const [apiUrl, setApiUrl] = useState("https://api-inference.bitdeer.ai/v1/chat/completions");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-ai/DeepSeek-V4-Flash");
  const [testMode, setTestMode] = useState("single_question"); // "ping" | "single_question"
  const [topic, setTopic] = useState("Clean Code & Refactoring Best Practices");
  const [showApiKey, setShowApiKey] = useState(false);

  // Inspector Output Tab: "json" | "preview" | "reasoning" | "telemetry"
  const [outputTab, setOutputTab] = useState("json");

  // Execution & Results State
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  // Mascot Emotion
  const [mascotState, setMascotState] = useState("idle");

  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setProvider(preset.provider);
    setApiUrl(preset.apiUrl);
    setModel(preset.model);
  };

  const handleRunTest = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setMascotState("thinking");

    try {
      const res = await quizService.testAiConnection({
        provider,
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        model: model.trim(),
        testMode,
        topic: topic.trim()
      });

      const data = res?.data || res;
      setResult(data);

      if (data?.success) {
        setMascotState("happy");
      } else {
        setMascotState("sad");
        setErrorMsg(data?.error || `HTTP ${data?.statusCode || "Error"}`);
      }
    } catch (err) {
      console.error("Test AI Failed:", err);
      setMascotState("sad");
      setErrorMsg(err?.response?.data?.message || err?.message || "Koneksi ke backend gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRaw = () => {
    if (!result?.rawResponse) return;
    try {
      const parsed = JSON.parse(result.rawResponse);
      navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
    } catch {
      navigator.clipboard.writeText(result.rawResponse);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper parsers for response introspection
  let parsedQuestion = null;
  let reasoningContent = null;
  let tokenUsage = null;
  let finishReason = null;

  if (result?.rawResponse) {
    try {
      const parsedJson = JSON.parse(result.rawResponse);
      const choice = parsedJson?.choices?.[0];
      const content = choice?.message?.content;
      reasoningContent = choice?.message?.reasoning_content || null;
      finishReason = choice?.finish_reason || null;
      tokenUsage = parsedJson?.usage || null;

      if (content) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const qDoc = JSON.parse(match[0]);
          if (qDoc?.questions && qDoc.questions.length > 0) {
            parsedQuestion = qDoc.questions[0];
          } else if (qDoc?.question) {
            parsedQuestion = qDoc;
          }
        }
      }
    } catch {
      // Ignored
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#2C1EE8] selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-6">
        {/* Header Breadcrumb & Title */}
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Link href="/admin" className="hover:text-[#2C1EE8] transition-colors">
              Admin & Dev
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-black">Diagnostik AI Engine</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase">
                AI Output & Token Tester
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Uji endpoint Bitdeer / DeepSeek / Groq, periksa output JSON terformat rapi (*beautiful syntax*), dan lacak efisiensi token.
              </p>
            </div>

            {/* Mascot Status */}
            <div className="flex items-center gap-3 self-end sm:self-auto bg-white border border-slate-200 px-3.5 py-1.5 shadow-xs">
              <div className="pointer-events-none select-none">
                <ReplyzMascot state={mascotState} size={42} />
              </div>
              <div className="text-left text-xs">
                <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider">Status Maskot</span>
                <span className="font-black text-black capitalize">
                  {isLoading ? "Menguji Koneksi..." : result?.success ? "Online & Valid" : errorMsg ? "Gagal / Offline" : "Siap Uji"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Form Left, Inspector Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* LEFT: Configuration Panel (6 Cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* 1. Provider Presets */}
            <div className="bg-white border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#2C1EE8]" />
                  <span>Pilih Model & Provider AI</span>
                </label>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Preset</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESETS.map((p) => {
                  const isSelected = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`p-3 text-left border transition-all cursor-pointer rounded-none flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? "border-[#2C1EE8] bg-blue-50/50 ring-1 ring-[#2C1EE8]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-black leading-tight">{p.name}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 shrink-0 ${
                          isSelected ? "bg-[#2C1EE8] text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Custom Parameters Form */}
            <form onSubmit={handleRunTest} className="bg-white border border-slate-200 p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-black uppercase tracking-wider block">
                  API Endpoint URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    required
                    className="w-full bg-white text-black font-mono text-xs pl-9 pr-3.5 py-2.5 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2C1EE8] transition-all"
                    placeholder="https://api-inference.bitdeer.ai/v1/chat/completions"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-black uppercase tracking-wider block">
                    Nama Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                    className="w-full bg-white text-black font-mono text-xs px-3.5 py-2.5 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2C1EE8] transition-all"
                    placeholder="deepseek-ai/DeepSeek-V4-Flash"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-black uppercase tracking-wider block">
                      API Key
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[10px] text-slate-500 hover:text-black font-bold uppercase cursor-pointer"
                    >
                      {showApiKey ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Kosongkan untuk pakai server .env"
                      className="w-full bg-white text-black font-mono text-xs pl-9 pr-3.5 py-2.5 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2C1EE8] transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Token Mode Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-black uppercase tracking-wider block">
                  Mode Pengujian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTestMode("single_question")}
                    className={`py-2.5 px-3 border text-left cursor-pointer rounded-none transition-all ${
                      testMode === "single_question"
                        ? "border-[#2C1EE8] bg-blue-50/60 font-black text-[#2C1EE8]"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs uppercase">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>1 Soal AI (~120 Tkn)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal pt-0.5">Uji schema JSON & materi kejuruan</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestMode("ping")}
                    className={`py-2.5 px-3 border text-left cursor-pointer rounded-none transition-all ${
                      testMode === "ping"
                        ? "border-[#2C1EE8] bg-blue-50/60 font-black text-[#2C1EE8]"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs uppercase">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Ping (~15 Tkn)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal pt-0.5">Uji handshake & auth tercepat</p>
                  </button>
                </div>
              </div>

              {testMode === "single_question" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-black text-black uppercase tracking-wider block">
                    Topik Materi Uji
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-white text-black text-xs font-semibold px-3.5 py-2.5 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2C1EE8] transition-all"
                    placeholder="Contoh: Clean Code & Refactoring Best Practices"
                  />
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#2C1EE8] hover:bg-[#2317BE] active:bg-[#1D129F] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Menghubungi AI Engine ({testMode === "ping" ? "Ping..." : "Generate 1 Soal..."})</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Jalankan Pengujian AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Realtime Telemetry & Beautiful JSON Inspector (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Telemetry Status Bar */}
            <div className="bg-white border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2C1EE8]" />
                  <h3 className="text-xs font-black text-black uppercase tracking-wider">
                    Telemetri Eksekusi
                  </h3>
                </div>
                {result && (
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                    result.success
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}>
                    {result.success ? "200 OK" : `HTTP ${result.statusCode || "FAILED"}`}
                  </span>
                )}
              </div>

              {/* Metric Badges */}
              <div className="grid grid-cols-3 gap-2 text-left">
                <div className="p-2.5 bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Latency</span>
                  <p className="text-base font-mono font-black text-black">
                    {result?.latencyMs !== undefined ? `${result.latencyMs} ms` : "—"}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Total Token</span>
                  <p className="text-base font-mono font-black text-[#2C1EE8]">
                    {tokenUsage?.total_tokens !== undefined ? `${tokenUsage.total_tokens} Tkn` : testMode === "ping" ? "~15 Tkn" : "~120 Tkn"}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Finish Reason</span>
                  <p className={`text-xs font-mono font-bold truncate ${
                    finishReason === "length" ? "text-amber-600" : "text-emerald-700"
                  }`}>
                    {finishReason || (result?.success ? "stop" : "—")}
                  </p>
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Terjadi Kesalahan:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed break-words">{errorMsg}</p>
                </div>
              )}
            </div>

            {/* BEAUTIFUL INSPECTOR TABS & VIEWER */}
            {result?.rawResponse ? (
              <div className="bg-white border border-slate-200 shadow-xs text-left">
                {/* Tab Navigation Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-3 pt-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setOutputTab("json")}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border-t-2 transition-all ${
                        outputTab === "json"
                          ? "bg-[#070d19] text-white border-[#2C1EE8]"
                          : "text-slate-600 border-transparent hover:text-black"
                      }`}
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Beautiful JSON</span>
                    </button>

                    {parsedQuestion && (
                      <button
                        type="button"
                        onClick={() => setOutputTab("preview")}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border-t-2 transition-all ${
                          outputTab === "preview"
                            ? "bg-white text-black border-[#2C1EE8] font-black"
                            : "text-slate-600 border-transparent hover:text-black"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Preview Soal</span>
                      </button>
                    )}

                    {reasoningContent && (
                      <button
                        type="button"
                        onClick={() => setOutputTab("reasoning")}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border-t-2 transition-all ${
                          outputTab === "reasoning"
                            ? "bg-white text-black border-[#2C1EE8] font-black"
                            : "text-slate-600 border-transparent hover:text-black"
                        }`}
                      >
                        <Brain className="w-3.5 h-3.5 text-purple-600" />
                        <span>Proses Berpikir (CoT)</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyRaw}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-black text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer border border-slate-300 mb-1.5"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Tersalin" : "Salin JSON"}</span>
                  </button>
                </div>

                {/* Tab 1: Beautiful JSON Viewer */}
                {outputTab === "json" && (
                  <div className="relative">
                    <SyntaxHighlightedJson jsonString={result.rawResponse} />
                  </div>
                )}

                {/* Tab 2: Live Question Preview */}
                {outputTab === "preview" && parsedQuestion && (
                  <div className="p-5 space-y-3 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-black uppercase tracking-wider">
                        Soal AI Terverifikasi
                      </span>
                      <span className="text-[10px] font-bold bg-blue-50 text-[#2C1EE8] px-2 py-0.5">
                        {parsedQuestion.difficulty || "Easy"}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {parsedQuestion.question}
                    </p>

                    {/* Options List */}
                    <div className="space-y-1.5 pt-1">
                      {parsedQuestion.options?.map((opt, idx) => {
                        const isCorrect = idx === parsedQuestion.correct_answer_index;
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 text-xs flex items-center justify-between gap-2 border ${
                              isCorrect
                                ? "bg-emerald-50 border-emerald-400 font-bold text-emerald-950"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-none bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isCorrect && (
                              <span className="text-[10px] font-black uppercase text-emerald-700 shrink-0">
                                Kunci Benar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {parsedQuestion.explanation && (
                      <div className="pt-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 border border-slate-200">
                        <span className="font-bold text-black block mb-0.5">Pembahasan:</span>
                        {parsedQuestion.explanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Reasoning Content */}
                {outputTab === "reasoning" && reasoningContent && (
                  <div className="p-4 bg-purple-50/50 border-t border-purple-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-purple-950 uppercase tracking-wider">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span>Internal Reasoning Trace (Chain-of-Thought)</span>
                    </div>
                    <pre className="p-3 bg-white text-slate-800 font-mono text-[10.5px] whitespace-pre-wrap leading-relaxed border border-purple-200 max-h-80 overflow-y-auto">
                      {reasoningContent}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              !isLoading && (
                <div className="bg-white border border-slate-200 py-12 text-center text-slate-400 space-y-2">
                  <Terminal className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-medium">
                    Jalankan tes untuk melihat <b>Beautiful Syntax Highlighted JSON</b>, telemetri token, dan preview soal.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
