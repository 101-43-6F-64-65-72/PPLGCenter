"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ChevronLeft, ChevronRight, Play, Info } from "@/components/common/Icons";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import { stripHtml } from "@/lib/sanitizer";

let motionImport = null;
let animatePresenceImport = null;

try {
  const m = require("motion/react");
  motionImport = m.motion;
  animatePresenceImport = m.AnimatePresence;
} catch (e) {
  try {
    const f = require("framer-motion");
    motionImport = f.motion;
    animatePresenceImport = f.AnimatePresence;
  } catch (e2) {}
}

const FallbackDiv = React.forwardRef(({ children, className, style, onClick }, ref) => (
  <div ref={ref} className={className} style={style} onClick={onClick}>
    {children}
  </div>
));
FallbackDiv.displayName = "FallbackDiv";

const MotionDiv = motionImport?.div || FallbackDiv;
const AnimatePresenceComponent = animatePresenceImport || (({ children }) => <>{children}</>);

export const AnnouncementHeroCarousel = ({ items = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const slides = Array.isArray(items) && items.length > 0 ? items : [];

  // Parallax Scroll Effect Handler
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset slide when items prop changes
  const [prevItems, setPrevItems] = useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    setCurrentSlide(0);
  }

  const changeSlide = useCallback(
    (newIndex) => {
      if (newIndex === currentSlide || slides.length === 0) return;
      setCurrentSlide(newIndex);
    },
    [currentSlide, slides.length]
  );

  const handleNext = useCallback(() => {
    if (slides.length === 0) return;
    const nextIdx = (currentSlide + 1) % slides.length;
    changeSlide(nextIdx);
  }, [currentSlide, slides.length, changeSlide]);

  const handlePrev = useCallback(() => {
    if (slides.length === 0) return;
    const prevIdx = (currentSlide - 1 + slides.length) % slides.length;
    changeSlide(prevIdx);
  }, [currentSlide, slides.length, changeSlide]);

  // Auto-slide every 7 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 7000);
    return () => clearInterval(interval);
  }, [handleNext, slides.length]);

  const scrollToCatalog = () => {
    const catalogElement = document.getElementById("mading-catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const parallaxOffsetY = scrollY * 0.35;

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-full flex-1 bg-[#071329] text-white flex flex-col justify-between select-none overflow-hidden shadow-xl">
        <div
          className="absolute inset-0 z-0 w-full h-[120%] pointer-events-none"
          style={{
            transform: `translate3d(0, ${parallaxOffsetY}px, 0)`,
          }}
        >
          <Image
            src="/images/hero-building.png"
            alt="SMK Negeri 2 Surakarta"
            fill
            sizes="100vw"
            className="object-cover object-center brightness-75 scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071329] via-[#071329]/90 to-[#071329]/40" />
        </div>

        <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-6 sm:px-12 lg:px-20 h-full pt-20 lg:pt-24">
          <div className="lg:col-span-8 flex flex-col items-start text-left my-auto py-6">
            <div className="inline-flex items-center gap-2 bg-blue-600/90 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold px-3.5 py-1 rounded-full mb-4 shadow-sm border border-blue-400/30 uppercase tracking-wider">
              <span>Mading Digital SMKN 2 Surakarta</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4 drop-shadow-xl">
              Portal Informasi & Publikasi Siswa
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-blue-100/90 leading-relaxed max-w-xl mb-8 font-normal drop-shadow">
              Wadahi prestasi, berita kegiatan ekstrakurikuler, inovasi sains teknologi, dan pengumuman resmi warga sekolah dalam satu platform digital terpadu.
            </p>

            <button
              onClick={scrollToCatalog}
              className="inline-flex items-center justify-center gap-2.5 bg-white text-[#071329] hover:bg-blue-50 font-bold text-sm sm:text-base px-6 py-3 rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Jelajahi Katalog Berita</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="relative w-full h-full flex-1 bg-[#071329] text-white flex flex-col justify-between select-none overflow-hidden shadow-xl">
      {/* Background Image with Motion Transition */}
      <AnimatePresenceComponent mode="wait">
        <MotionDiv
          key={slide.id || currentSlide}
          initial={{ opacity: 0.4, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0.4, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 z-0 w-full h-[125%] overflow-hidden pointer-events-none"
          style={{
            transform: `translate3d(0, ${parallaxOffsetY}px, 0)`,
          }}
        >
          <Image
            src={resolveImageUrl(slide.coverImageUrl || slide.imageUrl || slide.image)}
            alt={slide.title}
            fill
            sizes="100vw"
            className="object-cover object-center brightness-105"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#071329] via-[#071329]/85 via-50% to-transparent hidden lg:block pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071329] via-[#071329]/60 to-transparent lg:hidden pointer-events-none" />
        </MotionDiv>
      </AnimatePresenceComponent>

      {/* Main Content Overlay with Motion Transition */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-6 sm:px-12 lg:px-20 h-full pt-20 lg:pt-24">
        <div className="hidden lg:block lg:col-span-5" />

        <div className="lg:col-span-7 flex flex-col items-start text-left pl-0 lg:pl-10 my-auto py-6">
          <AnimatePresenceComponent mode="wait">
            <MotionDiv
              key={slide.id || currentSlide}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-1.5 bg-blue-600/95 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-sm tracking-wider uppercase">
                <span>Unggulan Terbaru</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3 drop-shadow-lg">
                {slide.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-blue-100 font-medium mb-3.5 drop-shadow">
                <span className="border border-blue-400/50 px-2 py-0.5 rounded text-[11px] font-semibold text-white bg-blue-900/60 backdrop-blur-md">
                  {slide.category || "Berita Utama"}
                </span>
                <span className="w-1 h-1 rounded-full bg-blue-200" />
                <span className="text-gray-200">Oleh: {slide.author || "Redaksi Sekolah"}</span>

                {(slide.reactionCount || slide.ReactionCount || slide.reactionsCount || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                    <ThumbsUp className="w-3 h-3 text-blue-200" />
                    <span>{slide.reactionCount ?? slide.ReactionCount ?? slide.reactionsCount}</span>
                  </span>
                )}

                {(slide.commentCount || slide.CommentCount || slide.commentsCount || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                    <MessageSquare className="w-3 h-3 text-blue-200" />
                    <span>{slide.commentCount ?? slide.CommentCount ?? slide.commentsCount}</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm lg:text-base text-gray-100 leading-relaxed max-w-lg mb-5 drop-shadow-lg font-normal line-clamp-3 text-justify">
                {stripHtml(slide.summary || slide.content)}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/mading/${slide.id}`}
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#071329] hover:bg-blue-50 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Baca Selengkapnya</span>
                </Link>

                <button
                  onClick={scrollToCatalog}
                  className="inline-flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 text-white font-semibold text-xs sm:text-sm px-4.5 py-2.5 rounded-xl backdrop-blur-md border border-white/30 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                  <span>Jelajahi Katalog</span>
                </button>
              </div>
            </MotionDiv>
          </AnimatePresenceComponent>
        </div>
      </div>


      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md p-3 sm:p-3.5 rounded-full shadow-2xl transition-all border border-white/20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md p-3 sm:p-3.5 rounded-full shadow-2xl transition-all border border-white/20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 sm:px-12 lg:px-20 pb-6 pt-0">
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => changeSlide(idx)}
              className={`text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                currentSlide === idx
                  ? "bg-white text-[#071329] shadow-md font-bold"
                  : "bg-black/60 text-gray-200 hover:bg-black/90"
              }`}
            >
              0{idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementHeroCarousel;
