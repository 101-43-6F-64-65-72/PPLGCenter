"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { motion } from "framer-motion";

/**
 * @typedef {'sad' | 'happy' | 'idle' | 'closed' | 'shock' | 'side' | 'peek' | 'notif' | 'wink' | 'sleepy' | 'dizzy' | 'thinking' | 'angry' | 'love'} MascotState
 */

/**
 * Expressive SVG Path & Body Motion Variants Matrix for Bloub Mascot
 */
export const mascotVariants = {
  idle: {
    path: "M -10 -12 A 10 10 0 0 1 10 -12 L 10 12 A 10 10 0 0 1 -10 12 Z",
    leftEye: { x: -24, y: 0, rotate: 0, scaleX: 1, scaleY: 1 },
    rightEye: { x: 24, y: 0, rotate: 0, scaleX: 1, scaleY: 1 },
    body: { y: 0, scaleX: 1, scaleY: 1 },
  },
  happy: {
    path: "M -13 5 C -13 -8, 13 -8, 13 5 C 8 0, -8 0, -13 5 Z",
    leftEye: { x: -24, y: -4, rotate: 0, scaleX: 1.04, scaleY: 1.04 },
    rightEye: { x: 24, y: -4, rotate: 0, scaleX: 1.04, scaleY: 1.04 },
    body: { y: -7, scaleX: 1.03, scaleY: 0.97 },
  },
  sad: {
    path: "M -9 -13 A 9 9 0 0 1 9 -13 L 7 11 A 7 7 0 0 1 -7 11 Z",
    leftEye: { x: -22, y: 6, rotate: 24, scaleX: 0.95, scaleY: 0.85 },
    rightEye: { x: 22, y: 6, rotate: -24, scaleX: 0.95, scaleY: 0.85 },
    body: { y: 8, scaleX: 1.03, scaleY: 0.94 },
  },
  closed: {
    path: "M -10 -12 A 10 10 0 0 1 10 -12 L 10 12 A 10 10 0 0 1 -10 12 Z",
    leftEye: { x: -24, y: 5, rotate: 0, scaleX: 1.15, scaleY: 0.05, opacity: 0.9 },
    rightEye: { x: 24, y: 5, rotate: 0, scaleX: 1.15, scaleY: 0.05, opacity: 0.9 },
    body: { y: 2, scaleX: 0.99, scaleY: 0.98 },
  },
  shock: {
    path: "M -14 0 A 14 14 0 1 1 14 0 A 14 14 0 1 1 -14 0 Z",
    leftEye: { x: -24, y: 2, rotate: 0, scaleX: 1.08, scaleY: 1.08 },
    rightEye: { x: 24, y: 2, rotate: 0, scaleX: 1.08, scaleY: 1.08 },
    body: { y: -3, scaleX: 0.95, scaleY: 1.04 },
  },
  side: {
    path: "M -9 -11 A 9 9 0 0 1 9 -11 L 9 11 A 9 9 0 0 1 -9 11 Z",
    leftEye: { x: -46, y: 2, rotate: -22, scaleX: 0.85, scaleY: 0.88 },
    rightEye: { x: -10, y: 4, rotate: -18, scaleX: 0.95, scaleY: 0.95 },
    body: { y: 0, scaleX: 1, scaleY: 1 },
  },
  peek: {
    path: "M -10 -12 A 10 10 0 0 1 10 -12 L 10 12 A 10 10 0 0 1 -10 12 Z",
    leftEye: { x: -48, y: -24, rotate: -16, scaleX: 0.92, scaleY: 0.92, opacity: 1 },
    rightEye: { x: -6, y: -16, rotate: -10, scaleX: 1.15, scaleY: 0.05, opacity: 0.9 },
    body: { y: -4, scaleX: 0.96, scaleY: 1.04 },
  },
  notif: {
    path: "M -9.3 -11.3 A 9.3 9.3 0 0 1 9.3 -11.3 L 9.3 11.3 A 9.3 9.3 0 0 1 -9.3 11.3 Z",
    leftEye: { x: -58.8, y: -47.2, rotate: 6, scaleX: 0.81, scaleY: 0.95 },
    rightEye: { x: -13.5, y: -36.5, rotate: 19, scaleX: 0.97, scaleY: 0.95 },
    body: { y: -6, scaleX: 0.96, scaleY: 1.04 },
  },
  wink: {
    path: "M -13 5 C -13 -8, 13 -8, 13 5 C 8 0, -8 0, -13 5 Z",
    leftEye: { x: -24, y: -4, rotate: 0, scaleX: 1.04, scaleY: 1.04 },
    rightEye: { x: 24, y: 4, rotate: -4, scaleX: 1.15, scaleY: 0.05 },
    body: { y: -5, scaleX: 1.02, scaleY: 0.98 },
  },
  sleepy: {
    path: "M -12 -5 C -12 7, 12 7, 12 -5 C 8 -1, -8 -1, -12 -5 Z",
    leftEye: { x: -22, y: 4, rotate: 0, scaleX: 1.05, scaleY: 0.9 },
    rightEye: { x: 22, y: 4, rotate: 0, scaleX: 1.05, scaleY: 0.9 },
    body: { y: 6, scaleX: 1.05, scaleY: 0.93 },
  },
  dizzy: {
    path: "M -8 -13 A 8 8 0 0 1 8 -13 L 8 13 A 8 8 0 0 1 -8 13 Z",
    leftEye: { x: -20, y: 4, rotate: 34, scaleX: 0.92, scaleY: 0.92 },
    rightEye: { x: 20, y: -3, rotate: -34, scaleX: 0.92, scaleY: 0.92 },
    body: { y: 2, scaleX: 0.96, scaleY: 1.04 },
  },
  thinking: {
    path: "M -10 -12 A 10 10 0 0 1 10 -12 L 10 12 A 10 10 0 0 1 -10 12 Z",
    leftEye: { x: -20, y: -12, rotate: -14, scaleX: 1.08, scaleY: 1.18 },
    rightEye: { x: 26, y: -4, rotate: 10, scaleX: 0.92, scaleY: 0.78 },
    body: { y: -6, scaleX: 0.96, scaleY: 1.04 },
  },
  angry: {
    path: "M -9 -14 A 9 9 0 0 1 9 -14 L 7 10 A 7 7 0 0 1 -7 10 Z",
    leftEye: { x: -22, y: 2, rotate: -16, scaleX: 1.05, scaleY: 0.9 },
    rightEye: { x: 22, y: 2, rotate: 16, scaleX: 1.05, scaleY: 0.9 },
    body: { y: 4, scaleX: 1.06, scaleY: 0.93 },
  },
  love: {
    path: "M -13 5 C -13 -8, 13 -8, 13 5 C 8 0, -8 0, -13 5 Z",
    leftEye: { x: -24, y: -5, rotate: 4, scaleX: 1.12, scaleY: 1.12 },
    rightEye: { x: 24, y: -5, rotate: -4, scaleX: 1.12, scaleY: 1.12 },
    body: { y: -9, scaleX: 1.05, scaleY: 1.05 },
  },
};

export const eyeVariants = mascotVariants;

/**
 * Mascot Skin Preset Palette Configurations
 */
export const MASCOT_SKINS = {
  default: {
    id: "default",
    name: "Classic White",
    colors: ["#f9f9f9", "#e2e8f0"],
    bodyFill: "#f9f9f9",
    eyeFill: "#0a0a0c",
    preview: "#f9f9f9",
    stageBg: "linear-gradient(135deg, #090e17 0%, #1e293b 50%, #0f172a 100%)",
    orbColors: ["rgba(56, 189, 248, 0.35)", "rgba(99, 102, 241, 0.35)", "rgba(168, 85, 247, 0.25)"],
    accentGlow: "rgba(56, 189, 248, 0.6)",
    badgeColor: "#38bdf8",
  },
  "obsidian-void": {
    id: "obsidian-void",
    name: "Obsidian Void",
    colors: ["#27272a", "#09090b"],
    bodyFill: "url(#skin-obsidian-void)",
    eyeFill: "#00f0ff",
    preview: "linear-gradient(135deg, #27272a, #09090b)",
    stageBg: "linear-gradient(135deg, #030712 0%, #111827 50%, #09090b 100%)",
    orbColors: ["rgba(0, 240, 255, 0.4)", "rgba(14, 165, 233, 0.35)", "rgba(59, 130, 246, 0.3)"],
    accentGlow: "rgba(0, 240, 255, 0.7)",
    badgeColor: "#00f0ff",
  },
  "dark-stealth": {
    id: "dark-stealth",
    name: "Dark Stealth",
    colors: ["#334155", "#0f172a"],
    bodyFill: "url(#skin-dark-stealth)",
    eyeFill: "#38bdf8",
    preview: "linear-gradient(135deg, #334155, #0f172a)",
    stageBg: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)",
    orbColors: ["rgba(56, 189, 248, 0.35)", "rgba(2, 132, 199, 0.35)", "rgba(79, 70, 229, 0.3)"],
    accentGlow: "rgba(56, 189, 248, 0.65)",
    badgeColor: "#38bdf8",
  },
  "crimson-shadow": {
    id: "crimson-shadow",
    name: "Crimson Shadow",
    colors: ["#881337", "#450a0a"],
    bodyFill: "url(#skin-crimson-shadow)",
    eyeFill: "#fbbf24",
    preview: "linear-gradient(135deg, #881337, #450a0a)",
    stageBg: "linear-gradient(135deg, #1f0409 0%, #450a0a 50%, #881337 100%)",
    orbColors: ["rgba(244, 63, 94, 0.45)", "rgba(225, 29, 72, 0.4)", "rgba(251, 191, 36, 0.35)"],
    accentGlow: "rgba(244, 63, 94, 0.75)",
    badgeColor: "#fbbf24",
  },
  "midnight-galaxy": {
    id: "midnight-galaxy",
    name: "Midnight Galaxy",
    colors: ["#1e1b4b", "#2e1065"],
    bodyFill: "url(#skin-midnight-galaxy)",
    eyeFill: "#e0e7ff",
    preview: "linear-gradient(135deg, #1e1b4b, #2e1065)",
    stageBg: "linear-gradient(135deg, #0b0726 0%, #1e1b4b 50%, #311068 100%)",
    orbColors: ["rgba(129, 140, 248, 0.45)", "rgba(192, 132, 252, 0.4)", "rgba(99, 102, 241, 0.35)"],
    accentGlow: "rgba(168, 85, 247, 0.75)",
    badgeColor: "#c084fc",
  },
  "neon-purple": {
    id: "neon-purple",
    name: "Neon Purple",
    colors: ["#a855f7", "#6366f1"],
    bodyFill: "url(#skin-neon-purple)",
    eyeFill: "#ffffff",
    preview: "linear-gradient(135deg, #a855f7, #6366f1)",
    stageBg: "linear-gradient(135deg, #14052b 0%, #3b0764 50%, #581c87 100%)",
    orbColors: ["rgba(168, 85, 247, 0.45)", "rgba(192, 132, 252, 0.4)", "rgba(232, 121, 249, 0.35)"],
    accentGlow: "rgba(217, 70, 239, 0.75)",
    badgeColor: "#e879f9",
  },
  "cyber-emerald": {
    id: "cyber-emerald",
    name: "Cyber Emerald",
    colors: ["#34d399", "#059669"],
    bodyFill: "url(#skin-cyber-emerald)",
    eyeFill: "#ffffff",
    preview: "linear-gradient(135deg, #34d399, #059669)",
    stageBg: "linear-gradient(135deg, #022019 0%, #064e3b 50%, #047857 100%)",
    orbColors: ["rgba(52, 211, 153, 0.45)", "rgba(16, 185, 129, 0.4)", "rgba(110, 231, 183, 0.35)"],
    accentGlow: "rgba(52, 211, 153, 0.75)",
    badgeColor: "#34d399",
  },
  "sunset-amber": {
    id: "sunset-amber",
    name: "Sunset Amber",
    colors: ["#fbbf24", "#f43f5e"],
    bodyFill: "url(#skin-sunset-amber)",
    eyeFill: "#ffffff",
    preview: "linear-gradient(135deg, #fbbf24, #f43f5e)",
    stageBg: "linear-gradient(135deg, #240a08 0%, #7c2d12 50%, #9a3412 100%)",
    orbColors: ["rgba(251, 191, 36, 0.45)", "rgba(249, 115, 22, 0.4)", "rgba(244, 63, 94, 0.35)"],
    accentGlow: "rgba(251, 191, 36, 0.75)",
    badgeColor: "#fbbf24",
  },
  "sakura-pink": {
    id: "sakura-pink",
    name: "Sakura Pink",
    colors: ["#f472b6", "#db2777"],
    bodyFill: "url(#skin-sakura-pink)",
    eyeFill: "#ffffff",
    preview: "linear-gradient(135deg, #f472b6, #db2777)",
    stageBg: "linear-gradient(135deg, #240618 0%, #831843 50%, #9d174d 100%)",
    orbColors: ["rgba(244, 114, 182, 0.45)", "rgba(251, 113, 133, 0.4)", "rgba(244, 63, 94, 0.35)"],
    accentGlow: "rgba(244, 114, 182, 0.75)",
    badgeColor: "#f472b6",
  },
};

export const MASCOT_ACCESSORIES = {
  none: { id: "none", name: "Tanpa Aksesori" },
  topi: { id: "topi", name: "Topi Style" },
  crown: { id: "crown", name: "Mahkota Emas" },
  "cat-ears": { id: "cat-ears", name: "Telinga Kucing" },
  ribbon: { id: "ribbon", name: "Pita Cantik" },
  necktie: { id: "necktie", name: "Dasi Formal" },
  "propeller-hat": { id: "propeller-hat", name: "Topi Baling-Baling" },
  sunglasses: { id: "sunglasses", name: "Kacamata Hitam" },
  headphones: { id: "headphones", name: "Headphone Gamer" },
  "wizard-hat": { id: "wizard-hat", name: "Topi Penyihir" },
  "angel-halo": { id: "angel-halo", name: "Halo Cahaya" },
  "party-hat": { id: "party-hat", name: "Topi Pesta" },
};

const FACE_PATH =
  "M99.9 -0.48C99.9 2.78 99.74 6.05 99.42 9.29C99.1 12.53 98.62 15.77 97.98 18.96C97.34 22.15 96.54 25.33 95.59 28.44C94.65 31.55 93.54 34.64 92.29 37.64C91.04 40.65 89.63 43.61 88.09 46.48C86.55 49.35 84.86 52.16 83.05 54.87C81.23 57.57 79.27 60.2 77.2 62.72C75.13 65.24 72.92 67.66 70.61 69.96C68.3 72.26 65.87 74.46 63.34 76.53C60.81 78.59 58.17 80.54 55.46 82.35C52.74 84.16 49.92 85.84 47.04 87.38C44.16 88.91 41.19 90.31 38.17 91.56C35.15 92.8 32.06 93.91 28.93 94.85C25.8 95.8 22.61 96.59 19.41 97.23C16.2 97.86 12.95 98.34 9.7 98.66C6.45 98.98 3.17 99.14 -0.1 99.14C-3.37 99.14 -6.65 98.98 -9.9 98.66C-13.15 98.34 -16.4 97.86 -19.61 97.23C-22.81 96.59 -26 95.8 -29.13 94.85C-32.25 93.91 -35.35 92.8 -38.37 91.56C-41.39 90.31 -44.36 88.91 -47.24 87.38C-50.12 85.84 -52.94 84.16 -55.66 82.35C-58.37 80.54 -61.01 78.59 -63.54 76.53C-66.06 74.46 -68.5 72.26 -70.81 69.96C-73.12 67.66 -75.33 65.24 -77.4 62.72C-79.47 60.2 -81.43 57.57 -83.25 54.87C-85.06 52.16 -86.75 49.35 -88.29 46.48C-89.83 43.61 -91.24 40.65 -92.49 37.64C-93.74 34.64 -94.85 31.55 -95.79 28.44C-96.74 25.33 -97.54 22.15 -98.18 18.96C-98.82 15.77 -99.3 12.53 -99.62 9.29C-99.94 6.05 -100.1 2.78 -100.1 -0.48C-100.1 -3.73 -99.94 -7 -99.62 -10.24C-99.3 -13.48 -98.82 -16.72 -98.18 -19.91C-97.54 -23.1 -96.74 -26.28 -95.79 -29.39C-94.85 -32.51 -93.74 -35.59 -92.49 -38.6C-91.24 -41.61 -89.83 -44.57 -88.29 -47.44C-86.75 -50.31 -85.06 -53.11 -83.25 -55.82C-81.43 -58.53 -79.47 -61.16 -77.4 -63.67C-75.33 -66.19 -73.12 -68.62 -70.81 -70.92C-68.5 -73.22 -66.06 -75.42 -63.54 -77.48C-61.01 -79.55 -58.37 -81.5 -55.66 -83.31C-52.94 -85.11 -50.12 -86.8 -47.24 -88.33C-44.36 -89.87 -41.39 -91.27 -38.37 -92.51C-35.35 -93.76 -32.25 -94.86 -29.13 -95.8C-26 -96.75 -22.81 -97.54 -19.61 -98.18C-16.4 -98.81 -13.15 -99.3 -9.9 -99.61C-6.65 -99.93 -3.37 -100.09 -0.1 -100.09C3.17 -100.09 6.45 -99.93 9.7 -99.61C12.95 -99.3 16.2 -98.81 19.41 -98.18C22.61 -97.54 25.8 -96.75 28.93 -95.8C32.06 -94.86 35.15 -93.76 38.17 -92.51C41.19 -91.27 44.16 -89.87 47.04 -88.33C49.92 -86.8 52.74 -85.11 55.46 -83.31C58.17 -81.5 60.81 -79.55 63.34 -77.48C65.87 -75.42 68.3 -73.22 70.61 -70.92C72.92 -68.62 75.13 -66.19 77.2 -63.67C79.27 -61.16 81.23 -58.53 83.05 -55.82C84.86 -53.11 86.55 -50.31 88.09 -47.44C89.63 -44.57 91.04 -41.61 92.29 -38.6C93.54 -35.59 94.65 -32.51 95.59 -29.39C96.54 -26.28 97.34 -23.1 97.98 -19.91C98.62 -16.72 99.1 -13.48 99.42 -10.24C99.74 -7 99.9 -3.73 99.9 -0.48Z";

const MAX_GAZE_OFFSET = 7;

export function BloubMascot({
  state = "sad",
  size = 250,
  className = "",
  interactiveGaze = true,
  enableAutoBlink = true,
  badge = false,
  badgeColor = "#38bdf8",
  badgePulse = true,
  skin = null,
  accessory = null,
  onClick,
}) {
  const rawId = useId();
  const safeUid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `bot-mask-${safeUid}`;

  const containerRef = useRef(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Dynamic user customization state synced with localStorage
  const [customSkin, setCustomSkin] = useState("default");
  const [customAccessory, setCustomAccessory] = useState("none");

  useEffect(() => {
    const loadCustomization = () => {
      if (typeof window !== "undefined") {
        const s = localStorage.getItem("sc_mascot_skin") || "default";
        const a = localStorage.getItem("sc_mascot_accessory") || "none";
        setCustomSkin(s);
        setCustomAccessory(a);
      }
    };

    loadCustomization();

    const handleUpdate = () => loadCustomization();
    if (typeof window !== "undefined") {
      window.addEventListener("app:mascot-customization-updated", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("app:mascot-customization-updated", handleUpdate);
      }
    };
  }, []);

  const activeSkinKey = skin || customSkin;
  const activeAccessoryKey = accessory || customAccessory;

  const currentSkinConfig = MASCOT_SKINS[activeSkinKey] || MASCOT_SKINS.default;

  // ─── Natural Periodic Auto-Blinking Effect ─────────────────────────────
  useEffect(() => {
    if (state === "closed" || !enableAutoBlink) return;

    let timeoutId;
    let blinkEndTimeoutId;

    const scheduleBlink = () => {
      const delay = Math.random() * 2500 + 3500;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        blinkEndTimeoutId = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };

    scheduleBlink();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(blinkEndTimeoutId);
    };
  }, [state, enableAutoBlink]);

  const activeState = state;
  const currentVariant = mascotVariants[activeState] || mascotVariants.sad;

  const isClosedState = state === "closed";
  const isEyeBlinking = isBlinking || isClosedState;
  const isWink = activeState === "wink";
  const happyGazeFactor = (activeState === "happy" || isWink) ? 0.45 : 1;

  const leftEyeAnim = {
    x: currentVariant.leftEye.x + gaze.x * happyGazeFactor,
    y: currentVariant.leftEye.y + gaze.y * happyGazeFactor + (isBlinking ? 2 : 0),
    rotate: currentVariant.leftEye.rotate,
    scaleX: isBlinking ? (currentVariant.leftEye.scaleX || 1) * 1.12 : currentVariant.leftEye.scaleX,
    scaleY: isBlinking ? 0.05 : currentVariant.leftEye.scaleY,
  };

  const rightEyeAnim = {
    x: currentVariant.rightEye.x + gaze.x * 0.88 * happyGazeFactor,
    y: currentVariant.rightEye.y + gaze.y * 0.88 * happyGazeFactor + (isBlinking ? 2 : 0),
    rotate: currentVariant.rightEye.rotate,
    scaleX: isBlinking ? (currentVariant.rightEye.scaleX || 1) * 1.12 : currentVariant.rightEye.scaleX,
    scaleY: isBlinking ? 0.05 : currentVariant.rightEye.scaleY,
  };

  // ─── Mouse Gaze Tracking ────────────────────────────────────────────────
  useEffect(() => {
    if (!interactiveGaze || typeof window === "undefined") return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxDistance = 300;
      const factor = Math.min(dist / maxDistance, 1);

      setGaze({
        x: (dx / dist) * factor * MAX_GAZE_OFFSET,
        y: (dy / dist) * factor * MAX_GAZE_OFFSET,
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactiveGaze]);

  const springTransition = {
    type: "spring",
    stiffness: 280,
    damping: 24,
    mass: 0.8,
  };

  const activeTransition = isEyeBlinking
    ? { duration: 0.12, ease: "easeInOut" }
    : springTransition;

  return (
    <motion.div
      ref={containerRef}
      onClick={onClick}
      animate={{
        y: currentVariant.body.y,
        scaleX: currentVariant.body.scaleX,
        scaleY: currentVariant.body.scaleY,
      }}
      transition={springTransition}
      className={`relative select-none flex items-center justify-center ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Animated bloub avatar (${activeState})`}
    >
      {/* Inner Breathing Float Loop Container */}
      <motion.div
        animate={{
          y: activeState === "happy" ? [-4, 4, -4] : activeState === "sleepy" ? [2, 6, 2] : activeState === "thinking" ? [-4, 2, -4] : activeState === "angry" ? [3, 5, 3] : activeState === "shock" ? [-2, -5, -2] : activeState === "dizzy" ? [1, -3, 1] : [-2, 2, -2],
          scaleX: activeState === "happy" ? [1, 1.03, 1] : activeState === "angry" ? [1.03, 1.05, 1.03] : [1, 1.01, 1],
          scaleY: activeState === "happy" ? [1, 1.03, 1] : activeState === "angry" ? [0.95, 0.93, 0.95] : [1, 1.015, 1],
          rotate: activeState === "happy" ? [-1.5, 1.5, -1.5] : isWink ? [-2, 1, -2] : activeState === "thinking" ? [-3, 3, -3] : activeState === "dizzy" ? [-3, 3, -3] : activeState === "angry" ? [-1, 1, -1] : [0, 0, 0],
        }}
        transition={{
          duration: activeState === "happy" ? 2.4 : activeState === "sleepy" ? 4.2 : activeState === "thinking" ? 2.8 : activeState === "angry" ? 1.5 : activeState === "dizzy" ? 2.2 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-full h-full flex items-center justify-center"
      >
        <svg
          width={size}
          height={size}
          viewBox="-125 -125 250 250"
          role="img"
          aria-label="Animated bloub avatar"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Dynamic Customization Gradient Definitions */}
            <linearGradient id="skin-obsidian-void" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id="skin-dark-stealth" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="skin-crimson-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#881337" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
            <linearGradient id="skin-midnight-galaxy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>
            <linearGradient id="skin-neon-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="skin-cyber-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="skin-sunset-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="skin-sakura-pink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>

            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="-158"
              y="-158"
              width="316"
              height="316"
            >
              {/* White base mask for avatar body shape */}
              <path d={FACE_PATH} fill="#fff" />
              
              {/* Left Eye Cutout inside Mask */}
              <motion.g
                animate={leftEyeAnim}
                transition={activeTransition}
                style={{ transformBox: "fill-box", transformOrigin: "center center" }}
              >
                <motion.g
                  animate={
                    activeState === "thinking"
                      ? { scale: [1.28, 0.72, 1.28], x: [-3, 4, -3], y: [-2, 1, -2] }
                      : activeState === "dizzy"
                      ? { x: [-2, 3, -2], y: [2, -2, 2] }
                      : activeState === "shock"
                      ? { scale: [1, 1.08, 1] }
                      : activeState === "sleepy"
                      ? { scaleY: [1, 0.45, 1], y: [0, 2, 0] }
                      : { x: 0, y: 0, scale: 1, scaleY: 1 }
                  }
                  transition={
                    activeState === "thinking"
                      ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                      : activeState === "dizzy"
                      ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                      : activeState === "shock"
                      ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                      : activeState === "sleepy"
                      ? { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
                      : springTransition
                  }
                  style={{ transformBox: "fill-box", transformOrigin: "center center" }}
                >
                  <motion.path
                    d={currentVariant.path}
                    fill="#000"
                    animate={{ d: currentVariant.path }}
                    transition={springTransition}
                  />
                </motion.g>
              </motion.g>

              {/* Right Eye Cutout inside Mask */}
              <motion.g
                animate={rightEyeAnim}
                transition={activeTransition}
                style={{ transformBox: "fill-box", transformOrigin: "center center" }}
              >
                <motion.g
                  animate={
                    activeState === "thinking"
                      ? { scale: [0.72, 1.28, 0.72], x: [3, -4, 3], y: [1, -2, 1] }
                      : activeState === "dizzy"
                      ? { x: [3, -2, 3], y: [-2, 2, -2] }
                      : activeState === "shock"
                      ? { scale: [1, 1.08, 1] }
                      : activeState === "sleepy"
                      ? { scaleY: [1, 0.45, 1], y: [0, 2, 0] }
                      : activeState === "wink"
                      ? { scaleY: [0.05, 0.35, 0.05] }
                      : { x: 0, y: 0, scale: 1, scaleY: 1 }
                  }
                  transition={
                    activeState === "thinking"
                      ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                      : activeState === "dizzy"
                      ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                      : activeState === "shock"
                      ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                      : activeState === "sleepy"
                      ? { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
                      : activeState === "wink"
                      ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                      : springTransition
                  }
                  style={{ transformBox: "fill-box", transformOrigin: "center center" }}
                >
                  <motion.path
                    d={currentVariant.path}
                    fill="#000"
                    animate={{ d: currentVariant.path }}
                    transition={springTransition}
                  />
                </motion.g>
              </motion.g>
            </mask>
          </defs>

          <g opacity="1">
            {/* Base Mascot Body Fill & Crisp Outline */}
            <path
              d={FACE_PATH}
              fill={currentSkinConfig.bodyFill}
              stroke={activeSkinKey === "default" ? "#cbd5e1" : "rgba(255,255,255,0.25)"}
              strokeWidth="2.5"
            />
            
            {/* Masked Inner Eye Cutout */}
            <g mask={`url(#${maskId})`}>
              <rect x="-158" y="-158" width="316" height="316" fill={currentSkinConfig.eyeFill} />
            </g>
          </g>

          {/* ─── Rosy Blush Cheeks ─── */}
          <motion.g
            initial={false}
            animate={{
              opacity: (activeState === "happy" || isWink) ? 0.75 : 0,
              scale: (activeState === "happy" || isWink) ? 1 : 0.6,
              y: (activeState === "happy" || isWink) ? 0 : 4,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            style={{ transformBox: "fill-box", transformOrigin: "center center" }}
          >
            <ellipse cx="-40" cy="14" rx="11" ry="6" fill="#f43f5e" opacity="0.85" />
            <ellipse cx="40" cy="14" rx="11" ry="6" fill="#f43f5e" opacity="0.85" />
          </motion.g>

          {/* ─── Mascot Vector Accessories Overlay ─── */}
          {/* ─── Approved Mascot Vector Accessories ─── */}
          {activeAccessoryKey === "topi" && (
            <g className="accessory-topi" transform="translate(0, -84) scale(0.9)">
              <path d="M -55 10 C -55 -40, 55 -40, 55 10 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2.5" />
              <path d="M -30 10 C -30 -30, 30 -30, 30 10 Z" fill="#3b82f6" />
              <path d="M -65 10 C -40 22, 40 22, 65 10 C 45 2, -45 2, -65 10 Z" fill="#1e40af" stroke="#172554" strokeWidth="2" />
              <circle cx="0" cy="-35" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {activeAccessoryKey === "crown" && (
            <g className="accessory-crown" transform="translate(0, -94) scale(0.88)">
              <path d="M -50 15 L -60 -25 L -22 -5 L 0 -38 L 22 -5 L 60 -25 L 50 15 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="3" />
              <path d="M -50 15 L -22 -5 L 0 -38 L 22 -5 L 50 15 Z" fill="#fef08a" opacity="0.4" />
              <circle cx="-60" cy="-25" r="5.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
              <circle cx="0" cy="-38" r="6.5" fill="#3b82f6" stroke="#1e40af" strokeWidth="1.5" />
              <circle cx="60" cy="-25" r="5.5" fill="#10b981" stroke="#065f46" strokeWidth="1.5" />
              <rect x="-48" y="10" width="96" height="8" rx="3" fill="#d97706" />
            </g>
          )}

          {activeAccessoryKey === "cat-ears" && (
            <g className="accessory-cat-ears" transform="translate(0, -84) scale(0.9)">
              <path d="M -75 12 C -80 -25, -55 -45, -25 2" fill="#f43f5e" stroke="#ffffff" strokeWidth="3" />
              <path d="M -68 8 C -70 -18, -52 -32, -32 4" fill="#fda4af" />
              <path d="M 75 12 C 80 -25, 55 -45, 25 2" fill="#f43f5e" stroke="#ffffff" strokeWidth="3" />
              <path d="M 68 8 C 70 -18, 52 -32, 32 4" fill="#fda4af" />
            </g>
          )}

          {activeAccessoryKey === "ribbon" && (
            <g className="accessory-ribbon" transform="translate(-40, -82) rotate(-15) scale(0.85)">
              <path d="M 0 0 C -35 -25, -45 15, 0 0 Z" fill="#ec4899" stroke="#9d174d" strokeWidth="2.5" />
              <path d="M 0 0 C 35 -25, 45 15, 0 0 Z" fill="#ec4899" stroke="#9d174d" strokeWidth="2.5" />
              <path d="M -5 0 L -25 35 L -10 32 L 0 0 Z" fill="#db2777" />
              <path d="M 5 0 L 25 35 L 10 32 L 0 0 Z" fill="#db2777" />
              <circle cx="0" cy="0" r="8" fill="#f472b6" stroke="#9d174d" strokeWidth="2" />
            </g>
          )}

          {activeAccessoryKey === "necktie" && (
            <g className="accessory-necktie" transform="translate(0, 80) scale(0.9)">
              <path d="M -22 -12 L 0 -4 L 22 -12 L 18 -18 L 0 -12 L -18 -18 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
              <polygon points="-10,-12 10,-12 7,-2 -7,-2" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
              <polygon points="-7,-2 7,-2 13,38 0,48 -13,38" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              <line x1="-5" y1="8" x2="8" y2="14" stroke="#ef4444" strokeWidth="3" />
              <line x1="-7" y1="20" x2="10" y2="26" stroke="#ef4444" strokeWidth="3" />
            </g>
          )}

          {activeAccessoryKey === "propeller-hat" && (
            <g className="accessory-propeller-hat" transform="translate(0, -84) scale(0.88)">
              <path d="M -55 10 C -55 -38, 0 -45, 0 10 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
              <path d="M 0 10 C 0 -45, 55 -38, 55 10 Z" fill="#3b82f6" stroke="#2563eb" strokeWidth="2" />
              <path d="M -25 10 C -25 -42, 25 -42, 25 10 Z" fill="#eab308" />
              <path d="M -62 10 C -38 20, 38 20, 62 10 C 42 3, -42 3, -62 10 Z" fill="#10b981" stroke="#059669" strokeWidth="2" />
              
              <rect x="-3.5" y="-46" width="7" height="12" fill="#64748b" rx="2" />
              <circle cx="0" cy="-46" r="4.5" fill="#f59e0b" />

              <motion.g
                style={{ transformBox: "fill-box", transformOrigin: "center center" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              >
                <ellipse cx="-22" cy="-46" rx="20" ry="5.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
                <ellipse cx="22" cy="-46" rx="20" ry="5.5" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                <circle cx="0" cy="-46" r="5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
              </motion.g>
            </g>
          )}

          {activeAccessoryKey === "sunglasses" && (
            <g className="accessory-sunglasses" transform="translate(0, -6) scale(0.92)">
              <path d="M -58 -18 L -3 -18 C 0 -18, 0 -8, -3 -8 L -58 -8 Z" fill="#0f172a" />
              <path d="M -56 -14 L -8 -14 C -6 -14, -6 20, -18 20 L -46 20 C -56 20, -56 -14, -56 -14 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2.5" />
              <path d="M 8 -14 L 56 -14 C 56 -14, 56 20, 46 20 L 18 20 C 6 20, 6 -14, 8 -14 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2.5" />
              <rect x="-8" y="-12" width="16" height="4" fill="#334155" rx="2" />
              <polygon points="-48,-10 -28,-10 -40,16 -50,16" fill="#ffffff" opacity="0.3" />
              <polygon points="16,-10 36,-10 24,16 14,16" fill="#ffffff" opacity="0.3" />
            </g>
          )}

          {activeAccessoryKey === "headphones" && (
            <g className="accessory-headphones" transform="translate(0, -10) scale(0.92)">
              <path d="M -82 -10 C -82 -95, 82 -95, 82 -10" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
              <path d="M -75 -15 C -75 -88, 75 -88, 75 -15" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
              <rect x="-94" y="-35" width="22" height="52" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <rect x="-88" y="-27" width="10" height="36" rx="5" fill="#38bdf8" opacity="0.85" />
              <rect x="72" y="-35" width="22" height="52" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <rect x="78" y="-27" width="10" height="36" rx="5" fill="#38bdf8" opacity="0.85" />
            </g>
          )}

          {activeAccessoryKey === "wizard-hat" && (
            <g className="accessory-wizard-hat" transform="translate(0, -88) scale(0.88)">
              <ellipse cx="0" cy="18" rx="68" ry="16" fill="#3b0764" stroke="#581c87" strokeWidth="2.5" />
              <path d="M -48 14 C -20 -30, -10 -90, -2 -105 C 10 -85, 30 -20, 48 14 Z" fill="#581c87" stroke="#6b21a8" strokeWidth="2" />
              <path d="M -44 10 C -20 18, 20 18, 44 10 L 41 18 C 20 25, -20 25, -41 18 Z" fill="#eab308" />
              <rect x="-8" y="9" width="16" height="12" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
              <polygon points="-12,-35 -8,-25 -18,-28 -9,-20 -15,-10 -5,-16 0,-6 2,-16 12,-12 5,-20 12,-26 2,-25" fill="#facc15" opacity="0.9" />
              <circle cx="-2" cy="-105" r="5" fill="#facc15" />
            </g>
          )}

          {activeAccessoryKey === "angel-halo" && (
            <g className="accessory-angel-halo" transform="translate(0, -102) scale(0.88)">
              <ellipse cx="0" cy="0" rx="55" ry="14" fill="none" stroke="#fef08a" strokeWidth="9" opacity="0.4" />
              <ellipse cx="0" cy="0" rx="55" ry="14" fill="none" stroke="#facc15" strokeWidth="5" />
              <ellipse cx="0" cy="0" rx="55" ry="14" fill="none" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {activeAccessoryKey === "party-hat" && (
            <g className="accessory-party-hat" transform="translate(10, -90) rotate(12) scale(0.85)">
              <polygon points="-40,20 40,20 0,-70" fill="#f43f5e" stroke="#be123c" strokeWidth="2.5" />
              <circle cx="-10" cy="-20" r="6" fill="#facc15" />
              <circle cx="12" cy="-35" r="5" fill="#38bdf8" />
              <circle cx="-18" cy="4" r="7" fill="#34d399" />
              <circle cx="15" cy="2" r="6.5" fill="#a855f7" />
              <circle cx="0" cy="-50" r="4.5" fill="#ffffff" />
              <circle cx="0" cy="-70" r="10" fill="#facc15" stroke="#eab308" strokeWidth="2" />
              <circle cx="0" cy="-70" r="6" fill="#ffffff" />
            </g>
          )}

          {/* ─── Satellite Badge / Indicator ─── */}
          {badge !== undefined && badge !== false && badge !== null && (
            <g className="satellite-badge-group">
              {badgePulse && (
                <motion.circle
                  cx="68"
                  cy="-68"
                  r={typeof badge === "number" || typeof badge === "string" ? 22 : 14}
                  fill={badgeColor}
                  opacity={0.35}
                  animate={{ scale: [1, 1.45, 1], opacity: [0.35, 0, 0.35] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              <circle
                cx="68"
                cy="-68"
                r={
                  typeof badge === "number"
                    ? badge > 9
                      ? 20
                      : 16
                    : typeof badge === "string"
                    ? 20
                    : 12
                }
                fill={badgeColor}
                stroke="#ffffff"
                strokeWidth="3.5"
              />

              {(typeof badge === "number" || typeof badge === "string") && (
                <text
                  x="68"
                  y="-62"
                  textAnchor="middle"
                  fontSize={
                    typeof badge === "number"
                      ? badge > 99
                        ? "13"
                        : badge > 9
                        ? "15"
                        : "17"
                      : "14"
                  }
                  fontWeight="900"
                  fill="#ffffff"
                  className="select-none pointer-events-none font-sans"
                >
                  {typeof badge === "number" ? (badge > 99 ? "99+" : badge) : badge}
                </text>
              )}
            </g>
          )}
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default BloubMascot;
