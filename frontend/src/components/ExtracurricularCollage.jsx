"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { extracurricularService } from "@/services/extracurricularService";
import { resolveImageUrl } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_ITEMS = [
  {
    id: "eskul-olahraga",
    src: "/images/tempat/lapangansmkn2ska.jpg",
    alt: "Ekstrakurikuler Olahraga",
    label: "Olahraga",
    // Position classes encircling the center (Desktop & Mobile grid)
    positionClass: "top-0 left-0 lg:-top-6 lg:-left-8 z-30",
    sizeClass: "w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56",
    initialRot: "-6deg",
  },
  {
    id: "eskul-paskibra",
    src: "/images/eskul.jpeg",
    alt: "Ekstrakurikuler Paskibra",
    label: "Paskibra",
    positionClass: "top-0 right-0 lg:-top-4 lg:-right-8 z-10",
    sizeClass: "w-40 h-40 sm:w-52 sm:h-52 lg:w-60 lg:h-60",
    initialRot: "7deg",
  },
  {
    id: "eskul-pmr",
    src: "/images/mading.jpeg",
    alt: "Ekstrakurikuler PMR & Seni",
    label: "PMR & Seni",
    positionClass: "bottom-0 left-0 lg:-bottom-6 lg:-left-6 z-10",
    sizeClass: "w-40 h-40 sm:w-52 sm:h-52 lg:w-60 lg:h-60",
    initialRot: "5deg",
  },
  {
    id: "eskul-pramuka",
    src: "/images/fasilitas.jpeg",
    alt: "Ekstrakurikuler Pramuka",
    label: "Pramuka",
    positionClass: "bottom-0 right-0 lg:-bottom-8 lg:-right-6 z-30",
    sizeClass: "w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56",
    initialRot: "-8deg",
  },
];

const getCategoryMatchingImage = (item, index) => {
  const raw = item.imageUrl || item.image || item.logoUrl || item.bannerUrl || item.photoUrl || item.photo;
  if (raw) {
    return resolveImageUrl(raw, DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].src);
  }
  const text = `${item.category || ""} ${item.name || item.Name || ""}`.toLowerCase();
  if (text.includes("olahraga") || text.includes("basket") || text.includes("futsal") || text.includes("voli")) {
    return "/images/tempat/lapangansmkn2ska.jpg";
  }
  if (text.includes("paskibra") || text.includes("bela negara") || text.includes("baris")) {
    return "/images/eskul.jpeg";
  }
  if (text.includes("pmr") || text.includes("kemanusiaan") || text.includes("seni") || text.includes("musik")) {
    return "/images/mading.jpeg";
  }
  if (text.includes("pramuka") || text.includes("scout")) {
    return "/images/fasilitas.jpeg";
  }
  return DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].src;
};

export default function ExtracurricularCollage({ containerRef }) {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const cardRefs = useRef([]);

  // Fetch dynamic items from REST API
  useEffect(() => {
    let isMounted = true;
    async function loadExtracurriculars() {
      try {
        const response = await extracurricularService.getExtracurriculars({ pageSize: 4 });
        const rawData = response?.data ?? response;
        const apiItems = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.items)
          ? rawData.items
          : Array.isArray(rawData?.data)
          ? rawData.data
          : [];

        if (isMounted && apiItems.length > 0) {
          const mapped = apiItems.slice(0, 4).map((item, idx) => ({
            ...DEFAULT_ITEMS[idx % DEFAULT_ITEMS.length],
            id: item.id || item.Id || idx,
            src: getCategoryMatchingImage(item, idx),
            alt: item.name || item.Name || DEFAULT_ITEMS[idx % DEFAULT_ITEMS.length].alt,
            label: item.category || item.name || item.Name || DEFAULT_ITEMS[idx % DEFAULT_ITEMS.length].label,
          }));

          while (mapped.length < 4) {
            const fallbackIdx = mapped.length;
            mapped.push({
              ...DEFAULT_ITEMS[fallbackIdx],
              id: `fallback-${fallbackIdx}`,
            });
          }

          setItems(mapped);
        }
      } catch (err) {
        // Safe fallback
      }
    }

    loadExtracurriculars();
    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP Floating Idle Effect (Awal) + Scroll-Driven Parallax Timeline
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const els = cardRefs.current.filter(Boolean);
    if (els.length < 4) return;

    // 1. Floating Idle Effect (Awal - before scroll)
    const idleTweens = els.map((card, i) => {
      return gsap.to(card, {
        y: "-=14",
        duration: 2.4 + i * 0.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.2,
      });
    });

    // 2. ScrollTrigger Timeline Transformation (Scroll-driven Parallax, Scale, Rotation & Z-Index)
    let mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const triggerTarget = containerRef?.current || cardRefs.current[0];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerTarget,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // Card 0 (Top-Left): Asynchronous float outward, scale up, float in front (z-30)
      tl.to(
        els[0],
        {
          x: "-85px",
          y: "-55px",
          scale: 1.18,
          rotation: -12,
          ease: "power2.inOut",
        },
        0
      );

      // Card 1 (Top-Right): Asynchronous float outward, scale down, float in back (z-10)
      tl.to(
        els[1],
        {
          x: "90px",
          y: "-45px",
          scale: 0.86,
          rotation: 10,
          ease: "sine.inOut",
        },
        0
      );

      // Card 2 (Bottom-Left): Asynchronous float outward, scale down, float in back (z-10)
      tl.to(
        els[2],
        {
          x: "-70px",
          y: "65px",
          scale: 0.9,
          rotation: 8,
          ease: "power2.inOut",
        },
        0
      );

      // Card 3 (Bottom-Right): Asynchronous float outward, scale up, float in front (z-30)
      tl.to(
        els[3],
        {
          x: "85px",
          y: "60px",
          scale: 1.22,
          rotation: -10,
          ease: "sine.inOut",
        },
        0
      );

      return () => {
        tl.kill();
      };
    });

    return () => {
      idleTweens.forEach((t) => t.kill());
      mm.revert();
    };
  }, [items, containerRef]);

  return (
    <div className="relative w-full max-w-[540px] aspect-square mx-auto select-none p-4">
      {/* 4 Encircling Image Cards with Thick Rounded Corners (rounded-[28px]) */}
      {items.map((img, idx) => (
        <div
          key={img.id || idx}
          ref={(el) => (cardRefs.current[idx] = el)}
          className={`absolute ${img.positionClass} ${img.sizeClass} group cursor-pointer transition-shadow duration-500`}
        >
          <div
            className="relative w-full h-full rounded-[28px] overflow-hidden bg-slate-900 border-2 border-white/80 shadow-xl shadow-slate-900/15 group-hover:shadow-2xl group-hover:border-blue-400/90 transition-all duration-300"
            style={{ transform: `rotate(${img.initialRot})` }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 50vw, 260px"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized
            />
            
            {/* Dark gradient bottom overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

            {/* Glass Pill Label with Thick Rounded Styling */}
            <div className="absolute bottom-3 left-3 z-10 pr-2">
              <span className="inline-block bg-white/95 backdrop-blur-md text-slate-900 text-xs font-extrabold px-3 py-1 rounded-xl shadow-sm border border-white/80 group-hover:bg-[#2c1ee8] group-hover:text-white group-hover:border-blue-400 transition-all duration-200 max-w-[140px] truncate">
                {img.label}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
