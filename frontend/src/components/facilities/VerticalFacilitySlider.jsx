"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  MapPin,
  Users,
  Clock,
  UserCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Box,
  AlertCircle,
} from "lucide-react";
import { resolve3DModelUrl } from "@/config/storage3dModels";

/**
 * Embedded 3D Canvas Viewport Component
 * Clean, balanced 3D canvas viewport without excessive empty horizontal space.
 */
function Model3DViewport({ modelUrl, title }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (customElements.get("model-viewer")) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
    script.type = "module";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      const fallbackScript = document.createElement("script");
      fallbackScript.src =
        "https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js";
      fallbackScript.type = "module";
      fallbackScript.onload = () => setScriptLoaded(true);
      fallbackScript.onerror = () => setHasError(true);
      document.body.appendChild(fallbackScript);
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setHasError(true);

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, [modelUrl, scriptLoaded]);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
          <AlertCircle className="w-5 h-5 text-amber-500" />
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Gagal Memuat Model 3D
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none bg-transparent">
      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-transparent space-y-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-2 border-[#2c1ee8] border-t-transparent animate-spin" />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Memuat 3D...
          </span>
        </div>
      )}

      {/* Clean 3D Canvas with natural camera framing */}
      {scriptLoaded ? (
        <model-viewer
          ref={viewerRef}
          src={modelUrl}
          alt={title || "3D Model Viewport"}
          auto-rotate=""
          auto-rotate-delay="300"
          rotation-per-second="10deg"
          camera-controls=""
          touch-action="pan-y"
          shadow-intensity="1.0"
          shadow-softness="0.7"
          exposure="1.05"
          environment-image="neutral"
          camera-orbit="35deg 75deg 90%"
          field-of-view="auto"
          className="w-full h-full cursor-grab active:cursor-grabbing outline-hidden bg-transparent"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            "--poster-color": "transparent",
          }}
        />
      ) : (
        <div className="text-slate-400 text-xs">Inisialisasi 3D...</div>
      )}
    </div>
  );
}

/**
 * Clean Neutral Placeholder UI when no 3D model is configured.
 */
function Empty3DPlaceholder({ item }) {
  const displayTitle = item?.title || item?.name || "Sarana Prasarana";
  const displayCategory = item?.category || "Fasilitas";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center select-none bg-transparent">
      <div className="flex flex-col items-center max-w-sm space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          <Box className="w-7 h-7 stroke-[1.5]" />
        </div>

        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            {displayCategory}
          </span>
          <h4 className="text-sm font-bold text-slate-800">
            Pratinjau 3D Belum Tersedia
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Model 3D interaktif untuk &quot;{displayTitle}&quot; belum tersedia. Peminjaman tetap dapat diajukan.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Vertical Synchronized Facility Slider (VerticalFacilitySlider)
 * Balanced horizontal layout (7/5 grid split) with comfortable breathing room.
 */
export default function VerticalFacilitySlider({
  items = [],
  isLoading = false,
  onBookFacility,
  className = "",
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const touchStartY = useRef(null);
  const lastScrollTime = useRef(0);

  const validItems = Array.isArray(items) ? items : [];
  const totalItems = validItems.length;

  useEffect(() => {
    if (activeIndex >= totalItems && totalItems > 0) {
      setActiveIndex(0);
    }
  }, [totalItems, activeIndex]);

  const activeItem = validItems[activeIndex] || null;

  const goToNext = useCallback(() => {
    if (totalItems <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goToPrev = useCallback(() => {
    if (totalItems <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const handleWheel = useCallback(
    (e) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 550) return;

      if (Math.abs(e.deltaY) > 35) {
        if (e.deltaY > 0) {
          goToNext();
        } else {
          goToPrev();
        }
        lastScrollTime.current = now;
      }
    },
    [goToNext, goToPrev]
  );

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const now = Date.now();

    if (Math.abs(diff) > 40 && now - lastScrollTime.current > 500) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      lastScrollTime.current = now;
    }
    touchStartY.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowUp" && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        goToPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-slate-100 rounded-full" />
              <div className="w-20 h-6 bg-slate-100 rounded-full" />
            </div>
            <div className="w-3/4 h-8 bg-slate-200 rounded-xl" />
            <div className="space-y-1.5">
              <div className="w-full h-3.5 bg-slate-100 rounded-md" />
              <div className="w-5/6 h-3.5 bg-slate-100 rounded-md" />
            </div>
            {/* 2x2 Specs Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="h-14 bg-slate-50 border border-slate-100 rounded-2xl" />
              <div className="h-14 bg-slate-50 border border-slate-100 rounded-2xl" />
              <div className="h-14 bg-slate-50 border border-slate-100 rounded-2xl" />
              <div className="h-14 bg-slate-50 border border-slate-100 rounded-2xl" />
            </div>
            {/* CTA & Stepper Skeleton */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="w-40 h-11 bg-slate-200 rounded-xl" />
              <div className="flex items-center gap-1.5">
                <div className="w-9 h-9 bg-slate-100 rounded-xl border border-slate-200" />
                <div className="w-9 h-9 bg-slate-100 rounded-xl border border-slate-200" />
              </div>
            </div>
          </div>

          {/* Right Column 3D Canvas Skeleton */}
          <div className="lg:col-span-5 relative h-[320px] sm:h-[360px] w-full bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-200/60" />
          </div>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return null;
  }

  // Resolve 3D model URL strictly from real data
  const raw3d =
    activeItem?.model3dUrl ||
    activeItem?.model_url ||
    activeItem?.glb_path ||
    activeItem?.model3DUrl ||
    activeItem?.Model3DUrl;

  const resolvedModelUrl = resolve3DModelUrl({
    model3dUrl: raw3d,
    title: activeItem?.title || activeItem?.name,
    category: activeItem?.category,
    location: activeItem?.location,
  }) || (raw3d && typeof raw3d === "string" && raw3d.toLowerCase().includes(".glb") ? raw3d : null);

  const isAvailable =
    activeItem?.isActive &&
    (activeItem?.status || "").toLowerCase() === "tersedia";

  const displayTitle = (activeItem?.title || activeItem?.name || "Fasilitas").replace(/^\[SEED\]\s*/i, "").trim();
  const displayCategory = activeItem?.category || "Sarana";
  const displayLocation = activeItem?.location || "SMKN 2 Surakarta";
  const displayCapacity = activeItem?.capacity || 0;
  const displayTime = activeItem?.time || "07.00 s.d 17.00 WIB";
  const displayManager = activeItem?.managerTeacherName || "Tim Sarpras Sekolah";
  const displayDesc = activeItem?.description || "Fasilitas dan sarana prasarana resmi SMK Negeri 2 Surakarta.";

  const isUnitItem = /barang|peralatan|alat|proyektor|printer|kamera|laptop|pc|cctv|sound|speaker|micro|headset|vr|ps5|gpu/i.test(
    `${displayCategory} ${displayTitle}`
  );

  return (
    <section
      ref={containerRef}
      tabIndex={0}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Sorotan Sarana & Pratinjau 3D"
      className={`w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs focus:outline-hidden transition-all select-none ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Details Panel (7/12 column width)            */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-3.5"
            >
              {/* Top Bar: Clean Category Tag & Availability Status */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2c1ee8] text-xs font-bold uppercase tracking-wider">
                  {displayCategory}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                      : "bg-rose-50 text-rose-700 border-rose-200/80"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAvailable ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span>{isAvailable ? "TERSEDIA" : "NONAKTIF"}</span>
                </span>
              </div>

              {/* Facility Title */}
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {displayTitle}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 font-normal">
                {displayDesc}
              </p>

              {/* Specs & Metadata 2x2 Grid (Balanced Comfort) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Lokasi */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#2c1ee8] flex items-center justify-center shrink-0 shadow-2xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Lokasi</span>
                    <span className="block text-xs font-bold text-slate-800 truncate">{displayLocation}</span>
                  </div>
                </div>

                {/* 2. Kapasitas / Unit */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#2c1ee8] flex items-center justify-center shrink-0 shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Kapasitas / Stok</span>
                    <span className="block text-xs font-bold text-slate-800 truncate">
                      {displayCapacity > 0 ? `${displayCapacity} ${isUnitItem ? "Unit" : "Orang"}` : "Tersedia"}
                    </span>
                  </div>
                </div>

                {/* 3. Pengurus */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#2c1ee8] flex items-center justify-center shrink-0 shadow-2xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Pengurus</span>
                    <span className="block text-xs font-bold text-slate-800 truncate">{displayManager}</span>
                  </div>
                </div>

                {/* 4. Jam Layanan */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#2c1ee8] flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Jam Layanan</span>
                    <span className="block text-xs font-bold text-slate-800 truncate">{displayTime}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Actions: CTA Button + Navigation Stepper */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onBookFacility && onBookFacility(activeItem)}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all duration-200 active:scale-[0.98] ${
                isAvailable
                  ? "bg-[#2c1ee8] hover:bg-[#2013ce] text-white hover:shadow-md hover:shadow-[#2c1ee8]/20 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
            >
              <span>{isAvailable ? "Ajukan Peminjaman" : "Fasilitas Nonaktif"}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Stepper Navigation Buttons (Icons Only) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={goToPrev}
                aria-label="Previous Facility"
                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                aria-label="Next Facility"
                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Clean Pure 3D Canvas (5/12 column width)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 relative h-[320px] sm:h-[360px] lg:h-[380px] w-full bg-transparent flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="w-full h-full flex items-center justify-center relative bg-transparent"
            >
              {resolvedModelUrl ? (
                <Model3DViewport
                  modelUrl={resolvedModelUrl}
                  title={displayTitle}
                />
              ) : (
                <Empty3DPlaceholder item={activeItem} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
