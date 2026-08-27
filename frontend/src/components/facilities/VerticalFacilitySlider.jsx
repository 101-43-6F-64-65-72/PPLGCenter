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
        <div className="w-10 h-10 rounded-none bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
          <AlertCircle className="w-5 h-5 text-amber-500" />
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Gagal Memuat Model 3D
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-none z-10 space-y-3">
          <div className="w-6 h-6 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Merender Canvas 3D...
          </span>
        </div>
      )}

      <model-viewer
        ref={viewerRef}
        src={modelUrl}
        alt={`Pratinjau 3D ${title || "Fasilitas"}`}
        auto-rotate
        camera-controls
        shadow-intensity="1.2"
        shadow-softness="0.8"
        exposure="1.0"
        interaction-prompt="none"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          outline: "none",
        }}
      />
    </div>
  );
}

/**
 * Visual Placeholder when 3D model is unavailable
 */
function Empty3DPlaceholder({ item }) {
  const displayTitle = item?.title || item?.name || "Fasilitas";
  const displayImage =
    item?.imageSrc ||
    item?.imageUrl ||
    item?.image ||
    "/images/tempat/lapangansmkn2ska.jpg";

  return (
    <div className="relative w-full h-full rounded-none overflow-hidden border border-slate-200 bg-slate-900 shadow-xs group">
      <img
        src={displayImage}
        alt={displayTitle}
        className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2C1EE8] text-white px-2 py-0.5 rounded-none inline-block mb-1">
          {item?.category || "Fasilitas"}
        </span>
        <h4 className="text-sm font-bold text-white truncate drop-shadow-sm uppercase">
          {displayTitle}
        </h4>
      </div>
    </div>
  );
}

export default function VerticalFacilitySlider({
  items = [],
  isLoading = false,
  onBookFacility,
  className = "",
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const touchStartY = useRef(null);

  const totalItems = items.length;
  const activeItem = items[activeIndex] || items[0] || null;

  const goToNext = useCallback(() => {
    if (totalItems <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setActiveIndex((prev) => (prev + 1) % totalItems);
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 280);
  }, [totalItems]);

  const goToPrev = useCallback(() => {
    if (totalItems <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 280);
  }, [totalItems]);

  const handleWheel = (e) => {
    if (totalItems <= 1 || isAnimatingRef.current) return;
    if (Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0) goToNext();
    else goToPrev();
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    touchStartY.current = null;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-none border border-slate-200 p-6 sm:p-7 shadow-xs animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="w-24 h-5 bg-slate-100 rounded-none" />
            <div className="w-3/4 h-7 bg-slate-200 rounded-none" />
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-none" />
              <div className="w-5/6 h-3 bg-slate-100 rounded-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="h-12 bg-slate-50 border border-slate-100 rounded-none" />
              <div className="h-12 bg-slate-50 border border-slate-100 rounded-none" />
            </div>
          </div>
          <div className="lg:col-span-5 relative h-[300px] w-full bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center">
            <div className="w-12 h-12 rounded-none bg-slate-200/60" />
          </div>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return null;
  }

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
      className={`w-full bg-white border border-slate-200 rounded-none p-5 sm:p-7 shadow-xs focus:outline-none transition-all select-none ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        
        {/* LEFT COLUMN: Details Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Category Tag & Availability Status */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-none bg-[#2C1EE8] text-white text-[10px] font-black uppercase tracking-widest">
                  {displayCategory}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-none ${
                      isAvailable ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span>{isAvailable ? "TERSEDIA" : "NONAKTIF"}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight uppercase">
                {displayTitle}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 font-normal">
                {displayDesc}
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* 1. Lokasi */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-none bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-none bg-white border border-slate-200 text-[#2C1EE8] flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Lokasi</span>
                    <span className="block text-xs font-bold text-slate-800 truncate">{displayLocation}</span>
                  </div>
                </div>

                {/* 2. Kapasitas */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-none bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-none bg-white border border-slate-200 text-[#2C1EE8] flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Kapasitas / Stok</span>
                    <span className="block text-xs font-bold text-slate-800 truncate">
                      {displayCapacity > 0 ? `${displayCapacity} ${isUnitItem ? "Unit" : "Orang"}` : "Tersedia"}
                    </span>
                  </div>
                </div>

                {/* 3. Pengurus */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-none bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-none bg-white border border-slate-200 text-[#2C1EE8] flex items-center justify-center shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Pengurus</span>
                    <span className="block text-xs font-bold text-slate-800 truncate">{displayManager}</span>
                  </div>
                </div>

                {/* 4. Jam Layanan */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-none bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-none bg-white border border-slate-200 text-[#2C1EE8] flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Jam Layanan</span>
                    <span className="block text-xs font-bold text-slate-800 truncate">{displayTime}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onBookFacility && onBookFacility(activeItem)}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-none font-bold text-xs uppercase tracking-wider transition-colors ${
                isAvailable
                  ? "bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white cursor-pointer shadow-xs"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
            >
              <span>{isAvailable ? "Ajukan Peminjaman" : "Fasilitas Nonaktif"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Stepper Navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPrev}
                aria-label="Previous Facility"
                className="w-8 h-8 rounded-none bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                aria-label="Next Facility"
                className="w-8 h-8 rounded-none bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 3D Canvas / Photo Showcase */}
        <div className="hidden lg:flex lg:col-span-5 relative h-[340px] w-full bg-transparent items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`3d-${activeIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
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

        {/* MOBILE (lg:hidden): Lightweight Crisp Image Showcase */}
        <div className="lg:hidden relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-none overflow-hidden bg-slate-900 border border-slate-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={`mobile-img-${activeIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full relative"
            >
              <img
                src={activeItem?.imageSrc || activeItem?.imageUrl || "/images/tempat/lapangansmkn2ska.jpg"}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider bg-white text-slate-900 px-1.5 py-0.5 rounded-none inline-block mb-1">
                    {displayCategory}
                  </span>
                  <p className="text-xs sm:text-sm font-bold truncate text-white uppercase">
                    {displayTitle}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-blue-200 bg-slate-900/70 px-2 py-1 rounded-none border border-white/20">
                  <MapPin className="w-3 h-3 text-blue-300" />
                  <span className="truncate max-w-[100px]">{displayLocation}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
