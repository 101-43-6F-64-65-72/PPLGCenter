"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Eye,
  Smile,
  Frown,
  Zap,
  Check,
  RotateCcw,
  Heart,
  Moon,
  HelpCircle,
  Brain,
  Flame,
  Wand2,
  Ban,
  Crown,
  Glasses,
  Headphones,
  Sun,
  PartyPopper,
  GraduationCap,
  Shirt,
  Wind,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BloubMascot, { MASCOT_SKINS, MASCOT_ACCESSORIES } from "@/components/BloubMascot.jsx";

const EMOTION_STATES = [
  { id: "idle", label: "Idle", icon: Smile },
  { id: "happy", label: "Happy", icon: Sparkles },
  { id: "wink", label: "Wink", icon: Sparkles },
  { id: "peek", label: "Peek", icon: Eye },
  { id: "notif", label: "Notif", icon: Eye },
  { id: "thinking", label: "Thinking", icon: Brain },
  { id: "love", label: "Love", icon: Heart },
  { id: "closed", label: "Closed", icon: Eye },
  { id: "sad", label: "Sad", icon: Frown },
  { id: "shock", label: "Shock", icon: Zap },
  { id: "side", label: "Side Glance", icon: Eye },
  { id: "sleepy", label: "Sleepy", icon: Moon },
  { id: "dizzy", label: "Dizzy", icon: HelpCircle },
  { id: "angry", label: "Angry", icon: Flame },
];

const ACCESSORY_ICONS = {
  none: Ban,
  topi: GraduationCap,
  crown: Crown,
  "cat-ears": Heart,
  ribbon: Sparkles,
  necktie: Shirt,
  "propeller-hat": Wind,
  sunglasses: Glasses,
  headphones: Headphones,
  "wizard-hat": Wand2,
  "angel-halo": Sun,
  "party-hat": PartyPopper,
};

export default function MascotDebugPage() {
  const [currentState, setCurrentState] = useState("happy");
  const [interactiveGaze, setInteractiveGaze] = useState(true);

  // Mascot Customization State (Skins & Accessories)
  const [selectedSkin, setSelectedSkin] = useState("default");
  const [selectedAccessory, setSelectedAccessory] = useState("none");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [skinAnimKey, setSkinAnimKey] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("sc_mascot_skin") || "default";
      const a = localStorage.getItem("sc_mascot_accessory") || "none";
      setSelectedSkin(s);
      setSelectedAccessory(a);
    }
  }, []);

  const handleSelectSkin = (skinId) => {
    if (skinId !== selectedSkin) {
      setSelectedSkin(skinId);
      setSkinAnimKey((prev) => prev + 1);
    }
  };

  const handleSaveCustomization = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sc_mascot_skin", selectedSkin);
      localStorage.setItem("sc_mascot_accessory", selectedAccessory);
      window.dispatchEvent(new CustomEvent("app:mascot-customization-updated"));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const currentSkinConfig = MASCOT_SKINS[selectedSkin] || MASCOT_SKINS.default;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white overflow-x-hidden w-full">
      <Navbar />

      <main className="flex-1 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        {/* ─── Hero Easter Egg Header ───────────────────────────────────── */}
        <div className="relative text-center space-y-3 pt-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#2C1EE8] text-xs font-black tracking-wider uppercase shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: "4s" }} />
            <span>STTT... • Rahasia PPLG Center</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Studio Kustomisasi <span className="text-[#2C1EE8]">Replyz Kamu</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Selamat! Kamu menemukan halaman rahasia Easter Egg Replyz. Pilih warna skin gradient dan aksesori favoritmu, lalu simpan agar Replyz tampil sesuai gayamu di seluruh website!
          </p>
        </div>

        {/* ─── Main Interactive Studio Workspace ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Live Mascot Preview Stage */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-slate-950/5 relative overflow-hidden backdrop-blur-xl flex flex-col items-center justify-between min-h-[540px]">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-gradient(#2C1EE8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

            {/* Stage Header Info */}
            <div className="w-full flex items-center justify-between z-10 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse transition-colors duration-500"
                  style={{ backgroundColor: currentSkinConfig.badgeColor || "#10b981" }}
                />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tampilan Live • {currentSkinConfig.name} + {MASCOT_ACCESSORIES[selectedAccessory]?.name}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setInteractiveGaze(!interactiveGaze)}
                className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1 rounded-full border border-slate-200 font-bold transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#2C1EE8]" />
                <span>Kursor Mouse: {interactiveGaze ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Stage Mascot Rendering with Animated Adaptive Background Stage */}
            <motion.div
              key={`stage-canvas-${selectedSkin}`}
              initial={{ opacity: 0.85, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ background: currentSkinConfig.stageBg }}
              className="my-4 w-full min-h-[340px] rounded-3xl border border-slate-800/90 shadow-2xl relative overflow-hidden flex items-center justify-center p-6 select-none transition-all duration-700"
            >
              {/* Shockwave Energy Ripple Ring Animation on Color Change */}
              <AnimatePresence mode="wait">
                {skinAnimKey > 0 && (
                  <motion.div
                    key={`ripple-${selectedSkin}-${skinAnimKey}`}
                    initial={{ scale: 0.1, opacity: 0.9 }}
                    animate={{ scale: 3.2, opacity: 0 }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      background: `radial-gradient(circle, ${currentSkinConfig.accentGlow} 0%, transparent 70%)`,
                    }}
                    className="absolute w-64 h-64 rounded-full pointer-events-none z-0"
                  />
                )}
              </AnimatePresence>

              {/* Ambient Floating Bokeh Orbs Adaptive to Selected Skin */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.55, 0.9, 0.55],
                }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: currentSkinConfig.orbColors[0] }}
                className="absolute -top-16 -left-16 w-60 h-60 rounded-full blur-3xl pointer-events-none z-0 transition-colors duration-700"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.85, 0.5],
                }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{ background: currentSkinConfig.orbColors[1] }}
                className="absolute top-1/2 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none z-0 transition-colors duration-700"
              />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                style={{ background: currentSkinConfig.orbColors[2] }}
                className="absolute -bottom-16 left-1/3 w-64 h-64 rounded-full blur-3xl pointer-events-none z-0 transition-colors duration-700"
              />

              {/* Radial Grid Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none z-0" />

              {/* Animated Sparkle Particles Burst on Color Change */}
              <AnimatePresence>
                {skinAnimKey > 0 && (
                  <motion.div
                    key={`particles-${selectedSkin}-${skinAnimKey}`}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.9 }}
                    className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
                  >
                    {[...Array(8)].map((_, i) => {
                      const angle = (i * 45 * Math.PI) / 180;
                      const distance = 130;
                      const x = Math.cos(angle) * distance;
                      const y = Math.sin(angle) * distance;
                      return (
                        <motion.div
                          key={i}
                          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                          animate={{ x, y, scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
                          transition={{ duration: 0.75, ease: "easeOut", delay: i * 0.02 }}
                          className="absolute w-3.5 h-3.5 rounded-full shadow-lg"
                          style={{
                            backgroundColor: currentSkinConfig.badgeColor || "#38bdf8",
                            boxShadow: `0 0 14px ${currentSkinConfig.accentGlow}`,
                          }}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mascot Rendering with Energetic Reaction Bounce on Color Change */}
              <div className="relative z-10 flex items-center justify-center">
                <motion.div
                  key={`mascot-bounce-${selectedSkin}-${skinAnimKey}`}
                  initial={{ scale: 0.85, rotate: -6 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 14 }}
                >
                  <BloubMascot
                    state={currentState}
                    size={260}
                    skin={selectedSkin}
                    accessory={selectedAccessory}
                    interactiveGaze={interactiveGaze}
                    enableAutoBlink={true}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Interactive Emotion Tester Pills */}
            <div className="w-full z-10 pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block text-center">
                Uji Ekspresi Emosi Replyz:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {EMOTION_STATES.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentState === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentState(item.id)}
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? "bg-[#2C1EE8] text-white shadow-md shadow-blue-500/20 scale-105"
                          : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Customization Controls Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-slate-950/5 space-y-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-[#2C1EE8]">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Pengaturan Tampilan
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Kustomisasi skin dan aksesori maskot
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSelectSkin("default");
                  setSelectedAccessory("none");
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Reset Kustomisasi ke Default"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Skin Theme Selector */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Warna Skin Gradient ({Object.keys(MASCOT_SKINS).length} Pilihan)</span>
                <span className="text-[10px] text-[#2C1EE8] font-bold">Latar Otomatis</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(MASCOT_SKINS).map((skinItem) => {
                  const isSelected = selectedSkin === skinItem.id;
                  return (
                    <motion.button
                      key={skinItem.id}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectSkin(skinItem.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "border-[#2C1EE8] bg-blue-50/90 text-[#2C1EE8] ring-2 ring-blue-500/40 shadow-md scale-[1.02]"
                          : "border-slate-200/80 bg-slate-50/60 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {/* Active Indicator Glow Ring */}
                      {isSelected && (
                        <motion.div
                          layoutId="activeSkinGlow"
                          className="absolute inset-0 bg-blue-500/10 pointer-events-none rounded-2xl"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                      
                      <div
                        className="w-7 h-7 rounded-full border border-slate-300/90 shadow-sm relative flex items-center justify-center shrink-0"
                        style={{ background: skinItem.preview }}
                      >
                        {isSelected && (
                          <Check className={`w-3.5 h-3.5 ${skinItem.id === "default" ? "text-slate-900" : "text-white"}`} />
                        )}
                      </div>
                      <span className="text-[11px] text-center truncate w-full font-extrabold relative z-10">
                        {skinItem.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 2. Accessories Selector */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Aksesori Vektor ({Object.keys(MASCOT_ACCESSORIES).length} Pilihan)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(MASCOT_ACCESSORIES).map((accItem) => {
                  const isSelected = selectedAccessory === accItem.id;
                  const AccIcon = ACCESSORY_ICONS[accItem.id] || Ban;
                  return (
                    <motion.button
                      key={accItem.id}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedAccessory(accItem.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/40 shadow-sm font-extrabold"
                          : "border-slate-200/80 bg-slate-50/60 hover:bg-slate-100 text-slate-700 font-medium"
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl shrink-0 ${isSelected ? "bg-amber-400 text-amber-950" : "bg-slate-200/70 text-slate-600"}`}>
                        <AccIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs truncate font-bold">{accItem.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 3. Save Customization Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveCustomization}
                className="w-full py-3.5 rounded-2xl bg-[#2C1EE8] hover:bg-blue-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4.5 h-4.5 text-amber-300" />
                <span>Simpan Tampilan Maskot Saya</span>
              </button>

              {saveSuccess && (
                <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold text-center flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tampilan Maskot Berhasil Disimpan & Aktif di Seluruh Web!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
