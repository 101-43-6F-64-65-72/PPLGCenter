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
    positionClass: "top-4 left-4 sm:top-2 sm:left-2 lg:top-1 lg:left-1 z-30",
    sizeClass: "w-32 h-32 sm:w-44 sm:h-44 lg:w-52 lg:h-52",
    initialRot: -5,
  },
  {
    id: "eskul-paskibra",
    src: "/images/eskul.jpeg",
    alt: "Ekstrakurikuler Paskibra",
    label: "Paskibra",
    positionClass: "top-4 right-4 sm:top-2 sm:right-2 lg:top-1 lg:right-1 z-10",
    sizeClass: "w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56",
    initialRot: 6,
  },
  {
    id: "eskul-pmr",
    src: "/images/mading.jpeg",
    alt: "Ekstrakurikuler PMR & Seni",
    label: "PMR & Seni",
    positionClass: "bottom-4 left-4 sm:bottom-2 sm:left-2 lg:bottom-1 lg:left-1 z-10",
    sizeClass: "w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56",
    initialRot: 4,
  },
  {
    id: "eskul-pramuka",
    src: "/images/fasilitas.jpeg",
    alt: "Ekstrakurikuler Pramuka",
    label: "Pramuka",
    positionClass: "bottom-4 right-4 sm:bottom-2 sm:right-2 lg:bottom-1 lg:right-1 z-30",
    sizeClass: "w-32 h-32 sm:w-44 sm:h-44 lg:w-52 lg:h-52",
    initialRot: -6,
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
  const wheelRef = useRef(null);
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

  // GSAP Biang Lala (Ferris Wheel) Orbit Reveal encircling center text + Floating Idle + Scroll Parallax
  useEffect(() => {
    if (typeof window === "undefined" || !wheelRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const els = cardRefs.current.filter(Boolean);
    if (els.length < 4) return;

    // 1. Floating Idle Effect (Awal - continuous subtle floating)
    const idleTweens = els.map((card, i) => {
      return gsap.to(card, {
        y: "-=10",
        duration: 2.5 + i * 0.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.2,
      });
    });

    // 2. Ferris Wheel (Biang Lala) Orbital Revolution & Parallax Timeline
    let mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const triggerTarget = containerRef?.current || wheelRef.current;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerTarget,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      // Ferris Wheel Pivot Container Revolution (-100deg to 0deg)
      tl.fromTo(
        wheelRef.current,
        { rotation: -100 },
        {
          rotation: 0,
          ease: "sine.inOut",
        },
        0
      );

      // Card 0 (Top-Left): Counter-rotate + tight float around text
      tl.fromTo(
        els[0],
        { rotation: 100 + DEFAULT_ITEMS[0].initialRot, scale: 0.85, x: "-10px", y: "-10px" },
        {
          rotation: DEFAULT_ITEMS[0].initialRot - 6,
          scale: 1.1,
          x: "-35px",
          y: "-25px",
          ease: "power2.inOut",
        },
        0
      );

      // Card 1 (Top-Right): Counter-rotate + tight float around text
      tl.fromTo(
        els[1],
        { rotation: 100 + DEFAULT_ITEMS[1].initialRot, scale: 0.82, x: "10px", y: "-10px" },
        {
          rotation: DEFAULT_ITEMS[1].initialRot + 6,
          scale: 0.92,
          x: "38px",
          y: "-22px",
          ease: "sine.inOut",
        },
        0
      );

      // Card 2 (Bottom-Left): Counter-rotate + tight float around text
      tl.fromTo(
        els[2],
        { rotation: 100 + DEFAULT_ITEMS[2].initialRot, scale: 0.85, x: "-10px", y: "10px" },
        {
          rotation: DEFAULT_ITEMS[2].initialRot + 5,
          scale: 0.94,
          x: "-32px",
          y: "28px",
          ease: "power2.inOut",
        },
        0
      );

      // Card 3 (Bottom-Right): Counter-rotate + tight float around text
      tl.fromTo(
        els[3],
        { rotation: 100 + DEFAULT_ITEMS[3].initialRot, scale: 0.88, x: "10px", y: "10px" },
        {
          rotation: DEFAULT_ITEMS[3].initialRot - 8,
          scale: 1.14,
          x: "35px",
          y: "26px",
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
    <div className="absolute inset-0 pointer-events-none select-none overflow-visible z-10">
      {/* Ferris Wheel (Biang Lala) Revolving Pivot Container encircling center stage */}
      <div
        ref={wheelRef}
        className="relative w-full h-full transform-gpu origin-center overflow-visible"
      >
        {items.map((img, idx) => (
          <div
            key={img.id || idx}
            ref={(el) => (cardRefs.current[idx] = el)}
            className={`absolute ${img.positionClass} ${img.sizeClass} group pointer-events-auto cursor-pointer transition-shadow duration-500 overflow-visible`}
          >
            <div
              className="relative w-full h-full rounded-[28px] overflow-hidden bg-slate-900 border-2 border-white/90 shadow-2xl shadow-slate-900/20 group-hover:shadow-blue-900/30 group-hover:border-blue-400 transition-all duration-300"
              style={{ transform: `rotate(${img.initialRot}deg)` }}
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

              {/* Glass Pill Label */}
              <div className="absolute bottom-3 left-3 z-10 pr-2">
                <span className="inline-block bg-white/95 backdrop-blur-md text-slate-900 text-xs font-extrabold px-3 py-1 rounded-xl shadow-sm border border-white/80 group-hover:bg-[#2c1ee8] group-hover:text-white group-hover:border-blue-400 transition-all duration-200 max-w-[140px] truncate">
                  {img.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
