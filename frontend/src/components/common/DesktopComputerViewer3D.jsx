"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Monitor,
  Cpu,
  Keyboard,
  Info,
  Sun,
  Moon,
  Zap,
  Box,
  ChevronRight,
  Eye,
  Smartphone
} from "lucide-react";

const CAMERA_PRESETS = [
  { id: "front", label: "Depan", orbit: "0deg 75deg 105%", target: "auto auto auto" },
  { id: "iso", label: "Perspektif 3D", orbit: "45deg 65deg 105%", target: "auto auto auto" },
  { id: "monitor", label: "Monitor", orbit: "0deg 85deg 65%", target: "0m 0.2m 0m" },
  { id: "cpu", label: "CPU Tower", orbit: "65deg 80deg 75%", target: "0.2m 0m 0m" },
];

const LIGHTING_PRESETS = [
  { id: "neutral", label: "Studio Soft", exposure: "1.0", shadow: "1.2", env: "neutral" },
  { id: "bright", label: "Terang", exposure: "1.5", shadow: "0.8", env: "neutral" },
  { id: "cyber", label: "Cyberpunk", exposure: "0.9", shadow: "2.0", env: "legacy" },
  { id: "dark", label: "Dark Mode", exposure: "0.6", shadow: "2.5", env: "neutral" },
];

export default function DesktopComputerViewer3D({
  glbPath = "/desktop_computer.glb",
  title = "Spesifikasi Lab Komputer PPLG",
  subtitle = "Model 3D Interaktif Perangkat Desktop Computer SMKN 2 Surakarta",
  compact = false,
  className = "",
  customOrbit = null,
  hideToolbar = false,
}) {
  const modelViewerRef = useRef(null);
  const containerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(!customOrbit);
  const [activePreset, setActivePreset] = useState("iso");
  const [activeLighting, setActiveLighting] = useState("neutral");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (customOrbit && modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = customOrbit;
    }
  }, [customOrbit]);

  // Dynamically load Google Model-Viewer Web Component script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (customElements.get("model-viewer")) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
    script.type = "module";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      // Fallback mirror if primary CDN fails
      const fallbackScript = document.createElement("script");
      fallbackScript.src = "https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js";
      fallbackScript.type = "module";
      fallbackScript.onload = () => setScriptLoaded(true);
      document.body.appendChild(fallbackScript);
    };
    document.body.appendChild(script);
  }, []);

  // Set up model load & progress listeners
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleProgress = (event) => {
      const progress = Math.round(event.detail.totalProgress * 100);
      setLoadProgress(progress);
    };

    const handleLoad = () => {
      setIsLoaded(true);
      setLoadProgress(100);
    };

    viewer.addEventListener("progress", handleProgress);
    viewer.addEventListener("load", handleLoad);

    return () => {
      viewer.removeEventListener("progress", handleProgress);
      viewer.removeEventListener("load", handleLoad);
    };
  }, [scriptLoaded]);

  // Handle Camera Presets
  const applyCameraPreset = (preset) => {
    setActivePreset(preset.id);
    const viewer = modelViewerRef.current;
    if (viewer) {
      viewer.cameraOrbit = preset.orbit;
      if (preset.target) viewer.cameraTarget = preset.target;
    }
  };

  // Reset View
  const handleResetView = () => {
    const viewer = modelViewerRef.current;
    if (viewer) {
      viewer.cameraOrbit = "45deg 65deg 105%";
      viewer.cameraTarget = "auto auto auto";
      viewer.fieldOfView = "auto";
      setActivePreset("iso");
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const currentLighting = LIGHTING_PRESETS.find((l) => l.id === activeLighting) || LIGHTING_PRESETS[0];

  if (!isMounted) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-2xl transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-[9999] rounded-none border-none" : ""
      } ${className}`}
    >
      {/* Dynamic Background Ambient Shimmer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)]" />
      </div>

      {/* Top Floating Overlay Toolbar */}
      {!hideToolbar && (
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Box className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">{title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-mono font-bold tracking-wider uppercase">
                  3D GLB Model
                </span>
              </div>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          {/* Right Quick Controls */}
          <div className="flex items-center gap-2">
            {/* Auto-Rotate Button */}
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                autoRotate
                  ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
              title="Toggle Putar Otomatis 360°"
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{autoRotate ? "Putar 360° On" : "Putar 360° Off"}</span>
            </button>

            {/* Reset Camera Button */}
            <button
              type="button"
              onClick={handleResetView}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
              title="Reset Sudut Pandang"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
              title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* 3D Model Rendering Area */}
      <div className={`relative w-full ${compact ? "h-[360px]" : "h-[450px] sm:h-[540px]"} bg-slate-950 flex items-center justify-center`}>
        {/* Loading Progress Bar Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Box className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white">Memuat Model 3D Desktop Computer...</p>
              <p className="text-xs text-slate-400 font-mono">{loadProgress}% terunduh</p>
            </div>
            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Custom 3D Model Web Component */}
        {scriptLoaded ? (
          <model-viewer
            ref={modelViewerRef}
            src={glbPath}
            alt="3D Desktop Computer PPLG SMKN 2 Surakarta"
            camera-controls
            auto-rotate={autoRotate ? "" : undefined}
            auto-rotate-delay="1000"
            rotation-per-second="15deg"
            touch-action="pan-y"
            shadow-intensity={currentLighting.shadow}
            shadow-softness="0.8"
            exposure={currentLighting.exposure}
            environment-image={currentLighting.env}
            camera-orbit="45deg 65deg 105%"
            field-of-view="auto"
            min-camera-orbit="auto 0deg auto"
            max-camera-orbit="auto 180deg auto"
            ar
            ar-modes="webxr scene-viewer quick-look"
            className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
            style={{ width: "100%", height: "100%", "--poster-color": "transparent" }}
          >
            {/* Interactive Hotspot 1: Monitor Display */}
            <button
              type="button"
              slot="hotspot-monitor"
              data-position="0m 0.25m 0.05m"
              data-normal="0m 0m 1m"
              onClick={() => setActiveHotspot(activeHotspot === "monitor" ? null : "monitor")}
              className="group relative px-3 py-1.5 rounded-full bg-blue-600/90 text-white text-xs font-bold shadow-lg shadow-blue-600/50 backdrop-blur-md border border-blue-400/50 hover:scale-110 transition cursor-pointer flex items-center gap-1.5"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-200" />
              <span>Monitor IPS 144Hz</span>
            </button>

            {/* Interactive Hotspot 2: CPU Tower */}
            <button
              type="button"
              slot="hotspot-cpu"
              data-position="0.25m -0.05m 0m"
              data-normal="1m 0m 0m"
              onClick={() => setActiveHotspot(activeHotspot === "cpu" ? null : "cpu")}
              className="group relative px-3 py-1.5 rounded-full bg-indigo-600/90 text-white text-xs font-bold shadow-lg shadow-indigo-600/50 backdrop-blur-md border border-indigo-400/50 hover:scale-110 transition cursor-pointer flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-200" />
              <span>Intel Core i9 / RTX</span>
            </button>

            {/* Interactive Hotspot 3: Keyboard & Mouse */}
            <button
              type="button"
              slot="hotspot-peripherals"
              data-position="0m -0.2m 0.2m"
              data-normal="0m 1m 0m"
              onClick={() => setActiveHotspot(activeHotspot === "peripherals" ? null : "peripherals")}
              className="group relative px-3 py-1.5 rounded-full bg-purple-600/90 text-white text-xs font-bold shadow-lg shadow-purple-600/50 backdrop-blur-md border border-purple-400/50 hover:scale-110 transition cursor-pointer flex items-center gap-1.5"
            >
              <Keyboard className="w-3.5 h-3.5 text-purple-200" />
              <span>Peripherals RGB</span>
            </button>
          </model-viewer>
        ) : (
          <div className="text-slate-500 text-sm font-medium">Inisialisasi Renderer 3D...</div>
        )}

        {/* Floating Interactive Specs Detail Popup */}
        {activeHotspot && (
          <div className="absolute bottom-20 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 z-30 bg-slate-900/95 border border-blue-500/30 p-4 rounded-2xl backdrop-blur-xl shadow-2xl space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>
                  {activeHotspot === "monitor" && "Display Monitor Layar Utama"}
                  {activeHotspot === "cpu" && "Central Processing Unit (CPU)"}
                  {activeHotspot === "peripherals" && "Keyboard & Gaming Mouse"}
                </span>
              </div>
              <button
                onClick={() => setActiveHotspot(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeHotspot === "monitor" &&
                "Layar Monitor Resolusi Full HD IPS 144Hz sRGB 99% dengan sudut pandang luas & perlindungan Anti-Blue Light untuk kenyamanan koding dalam waktu lama."}
              {activeHotspot === "cpu" &&
                "Dapur pacu performa tinggi dengan Processor Intel Core i9 Gen-13, RAM 32GB DDR5 Dual Channel, SSD NVMe Gen4 1TB, dan GPU RTX Series untuk kompilasi software & rendering 3D."}
              {activeHotspot === "peripherals" &&
                "Set Keyboard Mekanikal Tactile Switches dengan Full RGB Backlight dan Precision Optical Ergonomic Mouse untuk produktivitas pengerjaan project siswa PPLG."}
            </p>
          </div>
        )}

        {/* Corner Instruction Badge */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/60 text-slate-300 text-[11px] font-medium">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Klik & Geser mouse untuk memutar 3D Model</span>
        </div>
      </div>

      {/* Bottom Interactive Control Panel Bar */}
      <div className="relative z-20 p-4 sm:p-5 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Presets Angle Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <CameraIcon className="w-3.5 h-3.5 text-blue-400" />
            Angle:
          </span>
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyCameraPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                activePreset === preset.id
                  ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Lighting & Environment Modes */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Lighting:
          </span>
          {LIGHTING_PRESETS.map((light) => (
            <button
              key={light.id}
              type="button"
              onClick={() => setActiveLighting(light.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                activeLighting === light.id
                  ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {light.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CameraIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
