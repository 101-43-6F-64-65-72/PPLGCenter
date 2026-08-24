"use client";

import React, { useState, useEffect, useCallback } from "react";
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

  // Auto-play timer
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6500);
    return () => clearInterval(timer);
  }, [totalSlides, isPaused, handleNext]);

  // Keep index valid when items count change
  useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, totalSlides]);

  if (isLoading || parentLoading) {
    return (
      <div className="w-full h-72 sm:h-80 md:h-96 rounded-3xl bg-slate-200 border border-slate-200 animate-pulse" />
    );
  }

  if (totalSlides === 0) {
    if (!canManage) return null;
    return (
      <div className="w-full p-8 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-3">
        <SlidersHorizontal className="w-6 h-6 text-[#2C1EE8] mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">Showcase Banner Belum Dibuat</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Sebagai admin, Anda dapat membuat banner mandiri (tanpa masuk pengumuman) atau menambahkan pengumuman ke slider.
        </p>
        <button
          onClick={onOpenManageShowcase}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C1EE8] text-white text-xs font-bold shadow-xs hover:bg-[#2013ce] cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Kelola Showcase Sekarang</span>
        </button>
      </div>
    );
  }

  const currentItem = banners[currentIndex];
  const coverImage = resolveImageUrl(
    currentItem?.imageUrl || "/images/tempat/halamandepansmkn2ska.jpg"
  );
  const cleanSummary = stripHtml(currentItem?.description || "");
  const formattedDate = formatDate(currentItem?.createdAt);

  const hasLink = Boolean(currentItem?.linkUrl && currentItem.linkUrl.trim().length > 0);
  const ctaUrl = currentItem?.linkUrl?.trim() || "";
  const ctaText = currentItem?.buttonText || "Lihat Selengkapnya";
  const isExternalUrl = ctaUrl.startsWith("http://") || ctaUrl.startsWith("https://");

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
      className="relative w-full rounded-3xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-sm group select-none"
    >
      {/* Background Image with Crossfade */}
      <div className="relative w-full h-[320px] sm:h-[360px] md:h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem?.id || currentIndex}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
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
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-8 md:p-10">
          {/* Top Header Controls */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Optional indicator badge */}
            </div>

            {/* Top Right: Manage Showcase Button (for Admin) & Dots */}
            <div className="flex items-center gap-3">
              {canManage && (
                <button
                  onClick={onOpenManageShowcase}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 hover:border-white/40 transition cursor-pointer"
                  title="Atur Slide Showcase"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-300" />
                  <span>Kelola Showcase</span>
                </button>
              )}

              {/* Slide Indicators Dots */}
              {totalSlides > 1 && (
                <div className="hidden sm:flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentIndex ? "w-6 bg-[#2C1EE8]" : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Headline & Action */}
          <div className="space-y-3 sm:space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
              {currentItem?.title}
            </h2>

            {cleanSummary && (
              <p className="text-xs sm:text-sm text-slate-200/90 font-normal leading-relaxed line-clamp-2 max-w-2xl drop-shadow">
                {cleanSummary}
              </p>
            )}

            {/* Render Button ONLY if link is present */}
            {hasLink && (
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1EE8] hover:bg-[#2013ce] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <span>{ctaText}</span>
                  {isExternalUrl ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Arrow Controls (Overlay) */}
        {totalSlides > 1 && (
          <div className="absolute right-6 bottom-6 z-30 hidden sm:flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Previous Banner"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Next Banner"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
