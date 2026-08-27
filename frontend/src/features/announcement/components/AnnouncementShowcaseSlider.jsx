"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Calendar,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { resolveImageUrl, formatDate } from "@/lib/utils";
import { stripHtml } from "@/lib/sanitizer";
import showcaseBannerService from "@/services/showcaseBannerService";

export default function AnnouncementShowcaseSlider({
  isLoading: parentLoading = false,
  canManage = false,
  onOpenManageShowcase,
  refreshKey = 0,
}) {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const mouseStartXRef = useRef(null);

  // Load showcase banners from API
  const loadBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await showcaseBannerService.getActiveBanners();
      const items = res?.data || res?.items || res || [];
      if (Array.isArray(items)) {
        setBanners(items.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (err) {
      console.warn("Failed to load showcase banners:", err);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners, refreshKey]);

  const totalSlides = banners.length;

  const handleNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Touch Swipe Gesture for Mobile (Geser Slide)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      setIsPaused(true);
    }
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0]?.clientX || 0;
    const touchEndY = e.changedTouches[0]?.clientY || 0;
    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    // Minimum swipe threshold of 35px, prioritize horizontal over vertical scrolling
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Mouse Drag Gesture for Desktop
  const handleMouseDown = (e) => {
    mouseStartXRef.current = e.clientX;
    setIsPaused(true);
  };

  const handleMouseUp = (e) => {
    setIsPaused(false);
    if (mouseStartXRef.current === null) return;
    const deltaX = e.clientX - mouseStartXRef.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) handleNext();
      else handlePrev();
    }
    mouseStartXRef.current = null;
  };

  // Autoplay effect
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [totalSlides, isPaused, handleNext]);

  if (isLoading || parentLoading) {
    return (
      <div className="w-full h-[280px] sm:h-[340px] md:h-[380px] rounded-none bg-slate-100 border border-slate-200 animate-pulse flex items-center justify-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Memuat Sorotan Pengumuman...
        </span>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentItem = banners[currentIndex];
  const rawImage = currentItem?.imageUrl || currentItem?.image || currentItem?.coverImageUrl;
  const coverImage = resolveImageUrl(rawImage || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80");
  const formattedDate = formatDate(currentItem?.createdAt || new Date());
  const cleanSummary = stripHtml(currentItem?.summary || currentItem?.content || "");

  const ctaUrl = currentItem?.ctaUrl || currentItem?.ctaLink || currentItem?.link;
  const ctaText = currentItem?.ctaText || "Baca Informasi Selengkapnya";
  const hasLink = Boolean(ctaUrl && typeof ctaUrl === "string" && ctaUrl.trim() !== "");
  const isExternalUrl = hasLink && (ctaUrl.startsWith("http://") || ctaUrl.startsWith("https://"));

  const handleCtaClick = () => {
    if (!hasLink) return;
    if (isExternalUrl) {
      window.open(ctaUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(ctaUrl);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="relative w-full rounded-none overflow-hidden border border-slate-200 bg-slate-950 shadow-xs group select-none touch-pan-y cursor-grab active:cursor-grabbing"
    >
      {/* Background Image with Crossfade */}
      <div className="relative w-full h-[280px] sm:h-[340px] md:h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem?.id || currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
          >
            <Image
              src={coverImage}
              alt={currentItem?.title || "Showcase Banner"}
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
            />
            {/* Multi-layered Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content Box */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-5 sm:p-8 md:p-9 pointer-events-none">
          {/* Top Header Controls */}
          <div className="flex items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#2C1EE8] text-white text-[10px] font-black uppercase tracking-widest rounded-none">
                Sorotan Utama
              </span>
            </div>

            {/* Top Right: Manage Showcase Button (for Admin) & Dots */}
            <div className="flex items-center gap-2 sm:gap-3">
              {canManage && (
                <button
                  onClick={onOpenManageShowcase}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-none bg-black/60 hover:bg-black/90 text-white text-[10px] sm:text-[11px] font-bold border border-white/20 transition cursor-pointer"
                  title="Atur Slide Showcase"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden sm:inline">Kelola Showcase</span>
                  <span className="sm:hidden">Kelola</span>
                </button>
              )}

              {/* Slide Indicators Dots (Visible on both Mobile and Desktop) */}
              {totalSlides > 1 && (
                <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-none border border-white/20">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 transition-all duration-200 cursor-pointer rounded-none ${
                        idx === currentIndex ? "w-4 sm:w-5 bg-[#2C1EE8]" : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Headline & Action */}
          <div className="space-y-2 sm:space-y-3 max-w-3xl pointer-events-auto">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{formattedDate}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                ({currentIndex + 1}/{totalSlides})
              </span>
            </div>

            <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md uppercase">
              {currentItem?.title}
            </h2>

            {cleanSummary && (
              <p className="text-[11px] sm:text-sm text-slate-200 font-normal leading-relaxed line-clamp-2 max-w-2xl">
                {cleanSummary}
              </p>
            )}

            {/* Render Button ONLY if link is present */}
            {hasLink && (
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>{ctaText}</span>
                  {isExternalUrl ? (
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Arrow Controls (Overlay for Mobile and Desktop) */}
        {totalSlides > 1 && (
          <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-30 flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 sm:p-2 rounded-none bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-colors cursor-pointer"
              aria-label="Previous Banner"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 sm:p-2 rounded-none bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-colors cursor-pointer"
              aria-label="Next Banner"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
