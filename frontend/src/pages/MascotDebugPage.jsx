"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Eye,
  Smile,
  Frown,
  Zap,
  ShieldAlert,
  Copy,
  Check,
  Sliders,
  RotateCcw,
  Code,
  Activity,
  Maximize2,
  Layers,
  Play,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BloubMascot, { mascotVariants } from "@/components/BloubMascot.jsx";
import ErrorFallback from "@/components/ErrorFallback";

const EMOTION_STATES = [
  {
    id: "idle",
    label: "Idle",
    badge: "Default",
    icon: Smile,
    color: "bg-slate-800 text-white shadow-slate-800/20",
    accentBorder: "border-slate-300 bg-slate-50/50",
    description: "Neutral eye slits aligned horizontally with cursor gaze tracking.",
  },
  {
    id: "sad",
    label: "Sad",
    badge: "Fallback",
    icon: Frown,
    color: "bg-indigo-600 text-white shadow-indigo-500/25",
    accentBorder: "border-indigo-500/30 bg-indigo-50/50",
    description: "Drooping downward tilted slits (-15°) with compressed y-height.",
  },
  {
    id: "happy",
    label: "Happy",
    badge: "Interactive",
    icon: Sparkles,
    color: "bg-emerald-600 text-white shadow-emerald-500/25",
    accentBorder: "border-emerald-500/30 bg-emerald-50/50",
    description: "Upward crescent arcs with cheerful slight upward y-offset (-6px).",
  },
  {
    id: "closed",
    label: "Closed / Blink",
    badge: "Relaxed",
    icon: Eye,
    color: "bg-blue-600 text-white shadow-blue-500/25",
    accentBorder: "border-blue-500/30 bg-blue-50/50",
    description: "Flattened horizontal eye slits (scaleY: 0.05) simulating closed eyelids.",
  },
  {
    id: "shock",
    label: "Shock",
    badge: "Alert",
    icon: Zap,
    color: "bg-amber-600 text-white shadow-amber-500/25",
    accentBorder: "border-amber-500/30 bg-amber-50/50",
    description: "Wide open eyes with subtle jitter and body shrink.",
  },
  {
    id: "side",
    label: "Side Glance",
    badge: "Curious",
    icon: Eye,
    color: "bg-purple-600 text-white shadow-purple-500/25",
    accentBorder: "border-purple-500/30 bg-purple-50/50",
    description: "Slanted gaze looking off-center to the right side.",
  },
  {
    id: "peek",
    label: "Peek & Wink",
    badge: "Playful",
    icon: Eye,
    color: "bg-teal-600 text-white shadow-teal-500/25",
    accentBorder: "border-teal-500/30 bg-teal-50/50",
    description: "Curious peeking gaze angled up-right directly into typed password field with left eye wink (-).",
  },
  {
    id: "notif",
    label: "Notif Glance",
    badge: "Alert",
    icon: Eye,
    color: "bg-[#ef4444] text-white shadow-red-500/25",
    accentBorder: "border-red-500/30 bg-red-50/50",
    description: "Excited gaze shifted up-right looking directly at the satellite notification badge.",
  },
];

export default function MascotDebugPage() {
  const [currentState, setCurrentState] = useState("idle");
  const [mascotSize, setMascotSize] = useState(260);
  const [interactiveGaze, setInteractiveGaze] = useState(true);
  const [enableAutoBlink, setEnableAutoBlink] = useState(true);
  const [badgeValue, setBadgeValue] = useState(3);
  const [badgeColor, setBadgeColor] = useState("#ef4444");
  const [badgePulse, setBadgePulse] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [fallbackPreviewCode, setFallbackPreviewCode] = useState(404);

  const activeExp = EMOTION_STATES.find((e) => e.id === currentState) || EMOTION_STATES[0];
  const activeMetrics = mascotVariants[currentState] || mascotVariants.idle;

  const codeSnippet = `<BloubMascot 
  state="${currentState}" 
  size={${mascotSize}} 
  badge={${typeof badgeValue === "string" ? `"${badgeValue}"` : badgeValue}}
  badgeColor="${badgeColor}"
  badgePulse={${badgePulse}}
  interactiveGaze={${interactiveGaze}} 
  enableAutoBlink={${enableAutoBlink}} 
/>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTriggerBlink = () => {
    setCurrentState("closed");
    setTimeout(() => {
      setCurrentState("idle");
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden w-full">
      <Navbar />

      <main className="flex-1 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
        {/* ─── Hero Header ─────────────────────────────────────────────── */}
        <div className="relative text-center space-y-4 pt-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold tracking-wide uppercase">
            <Activity className="w-3.5 h-3.5" />
            <span>Bloub Vector Avatar • Motion & Satellite Badge Studio</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Modular Satellite <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Badge & Motion Combo</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Combine top-right dynamic satellite badges (<code className="text-blue-300 font-mono bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/30">badge, badgeColor, badgePulse</code>) with any emotion state.
          </p>
        </div>

        {/* ─── Main Interactive Mascot Stage ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Live Mascot Stage Card */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col items-center justify-between min-h-[540px]">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

            {/* Stage Header Info */}
            <div className="w-full flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Live Stage • {currentState} + Satellite Badge ({String(badgeValue)})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Gaze: {interactiveGaze ? "ON" : "OFF"}</span>
              </div>
            </div>

            {/* Stage Mascot Rendering */}
            <div className="my-8 relative z-10 flex items-center justify-center min-h-[300px] w-full">
              <BloubMascot
                state={currentState}
                size={mascotSize}
                interactiveGaze={interactiveGaze}
                enableAutoBlink={enableAutoBlink}
                badge={badgeValue}
                badgeColor={badgeColor}
                badgePulse={badgePulse}
              />
            </div>

            {/* Quick Emotion Selector Buttons */}
            <div className="w-full z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2">
              {EMOTION_STATES.map((item) => {
                const Icon = item.icon;
                const isActive = currentState === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentState(item.id)}
                    type="button"
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? `${item.color} shadow-lg ring-2 ring-blue-400/50 scale-105`
                        : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Fine-Tuning & Live Matrix Inspector */}
          <div className="lg:col-span-5 space-y-6">
            {/* Control Panel Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Satellite Badge & Controls</h2>
                </div>
                <button
                  onClick={() => {
                    setCurrentState("idle");
                    setMascotSize(260);
                    setInteractiveGaze(true);
                    setEnableAutoBlink(true);
                    setBadgeValue(3);
                    setBadgeColor("#ef4444");
                    setBadgePulse(true);
                  }}
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Reset Stage Defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Satellite Badge Config Controls */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Satellite Badge Combo</span>
                  <span className="text-[11px] font-mono text-purple-400 font-bold">
                    {String(badgeValue)}
                  </span>
                </div>

                {/* Badge Mode Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "Off", val: false },
                    { label: "Dot", val: true },
                    { label: "3", val: 3 },
                    { label: "99+", val: "99+" },
                  ].map((b) => (
                    <button
                      key={String(b.label)}
                      type="button"
                      onClick={() => setBadgeValue(b.val)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        badgeValue === b.val
                          ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                {/* Badge Colors */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-slate-400">Badge Color:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { name: "Cyan", color: "#38bdf8" },
                      { name: "Red", color: "#ef4444" },
                      { name: "Green", color: "#22c55e" },
                      { name: "Amber", color: "#f59e0b" },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setBadgeColor(c.color)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer border-2 ${
                          badgeColor === c.color ? "scale-125 border-white shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Pulse Animation Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300">Continuous Pulse Aura</span>
                  <button
                    type="button"
                    onClick={() => setBadgePulse(!badgePulse)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      badgePulse
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    Pulse: {badgePulse ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleTriggerBlink}
                  type="button"
                  className="px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Trigger Blink Snap</span>
                </button>
                <button
                  onClick={() => setEnableAutoBlink(!enableAutoBlink)}
                  type="button"
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    enableAutoBlink
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Auto-Blink: {enableAutoBlink ? "ON" : "OFF"}</span>
                </button>
              </div>

              {/* Gaze Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200 block">Cursor Gaze Tracking</span>
                  <span className="text-[11px] text-slate-400 block">Eye pupil follows mouse position</span>
                </div>
                <button
                  onClick={() => setInteractiveGaze(!interactiveGaze)}
                  type="button"
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                    interactiveGaze ? "bg-blue-600" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      interactiveGaze ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mascot Viewport Size</span>
                  </span>
                  <span className="font-mono text-blue-400 font-bold">{mascotSize}px</span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="380"
                  value={mascotSize}
                  onChange={(e) => setMascotSize(Number(e.target.value))}
                  className="w-full accent-blue-500 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Live SVG Vector Metrics Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Live Motion Vector Inspector</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Left Eye Transform</span>
                  <span className="text-blue-300 font-bold block">
                    rot: {activeMetrics.leftEye.rotate}°
                  </span>
                  <span className="text-slate-400 text-[11px] block">
                    scaleY: {activeMetrics.leftEye.scaleY} | scaleX: {activeMetrics.leftEye.scaleX}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Right Eye Transform</span>
                  <span className="text-blue-300 font-bold block">
                    rot: {activeMetrics.rightEye.rotate}°
                  </span>
                  <span className="text-slate-400 text-[11px] block">
                    scaleY: {activeMetrics.rightEye.scaleY} | scaleX: {activeMetrics.rightEye.scaleX}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1">
                <span className="text-[10px] text-purple-400 block uppercase font-semibold">Spring Physics & Body Squash/Stretch</span>
                <span className="text-slate-300 block">stiffness: 300 | damping: 22</span>
                <span className="text-slate-400 text-[11px] block">
                  Body: Happy (y: -12, scaleY: 1.06) | Sad (y: +8, scaleY: 0.94) | Idle (3.5s float loop)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Emotion Gallery Cards Grid ─────────────────────────────── */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-t border-slate-800 pt-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Emotion State Reference Matrix
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Click any emotion card to test state switching with liquid spring motion.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {EMOTION_STATES.map((exp) => {
              const Icon = exp.icon;
              const isSelected = currentState === exp.id;
              return (
                <div
                  key={exp.id}
                  onClick={() => setCurrentState(exp.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? "bg-slate-900 border-blue-500/60 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/30"
                      : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-2xl ${exp.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {exp.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <span>{exp.label}</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-3">
                      {exp.description}
                    </p>
                  </div>

                  <span className="text-[11px] text-blue-400 font-mono block">
                    state="{exp.id}"
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Universal Error Fallback Integration Preview ───────────── */}
        <div className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800 pt-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/20">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Error System Integration</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Universal ErrorFallback & Mascot Integration
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Test how <code className="text-blue-300 font-mono">{"<ErrorFallback />"}</code> automatically maps status codes to mascot expressions.
              </p>
            </div>

            {/* Status Code Switcher */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              {[
                { code: 404, label: "404 (Sad)", state: "sad" },
                { code: "ERR_EMPTY", label: "ERR_EMPTY (Closed)", state: "closed" },
                { code: 401, label: "401 (Sad)", state: "sad" },
                { code: 403, label: "403 (Shock)", state: "shock" },
                { code: 500, label: "500 (Sad)", state: "sad" },
              ].map((item) => (
                <button
                  key={String(item.code)}
                  onClick={() => {
                    setFallbackPreviewCode(item.code);
                    setCurrentState(item.state);
                  }}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    fallbackPreviewCode === item.code
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Embedded ErrorFallback Component Test Sandbox */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-10 flex items-center justify-center shadow-2xl relative overflow-hidden min-h-[460px]">
            <ErrorFallback
              statusCode={fallbackPreviewCode}
              fullPage={false}
              className="my-2 shadow-2xl shadow-blue-950/50"
            />
          </div>
        </div>

        {/* ─── Developer Code Copy Box ──────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Component Usage Code</h3>
            </div>
            <button
              onClick={handleCopyCode}
              type="button"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy React JSX</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-blue-300 font-mono text-xs sm:text-sm overflow-x-auto">
            {codeSnippet}
          </pre>
        </div>
      </main>

      <Footer />
    </div>
  );
}
