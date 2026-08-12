"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { extracurricularService } from "@/services/extracurricularService";
import { resolveImageUrl } from "@/lib/utils";

const DEFAULT_ITEMS = [
  {
    id: "eskul-olahraga",
    src: "/images/tempat/lapangansmkn2ska.jpg",
    alt: "Ekstrakurikuler Olahraga",
    label: "Olahraga",
    positionClass: "top-4 left-4 sm:top-2 sm:left-4 lg:top-0 lg:left-0 z-30",
    sizeClass: "w-32 h-32 sm:w-44 sm:h-44 lg:w-52 lg:h-52",
  },
  {
    id: "eskul-paskibra",
    src: "/images/eskul.jpeg",
    alt: "Ekstrakurikuler Paskibra",
    label: "Paskibra",
    positionClass: "top-4 right-4 sm:top-2 sm:right-4 lg:top-0 lg:right-0 z-10",
    sizeClass: "w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56",
  },
  {
    id: "eskul-pmr",
    src: "/images/mading.jpeg",
    alt: "Ekstrakurikuler PMR & Seni",
    label: "PMR & Seni",
    positionClass: "bottom-4 left-4 sm:bottom-2 sm:left-4 lg:bottom-0 lg:left-0 z-10",
    sizeClass: "w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56",
  },
  {
    id: "eskul-pramuka",
    src: "/images/fasilitas.jpeg",
    alt: "Ekstrakurikuler Pramuka",
    label: "Pramuka",
    positionClass: "bottom-4 right-4 sm:bottom-2 sm:right-4 lg:bottom-0 lg:right-0 z-30",
    sizeClass: "w-32 h-32 sm:w-44 sm:h-44 lg:w-52 lg:h-52",
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

export default function ExtracurricularCollage({ wheelRef, cardsRef }) {
  const [items, setItems] = useState(DEFAULT_ITEMS);

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

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-visible z-10">
      {/* Ferris Wheel (Biang Lala) Revolving Pivot Container surrounding Center Stage */}
      <div
        ref={wheelRef}
        className="relative w-full h-full transform-gpu origin-center overflow-visible will-change-transform"
      >
        {items.map((img, idx) => (
          <div
            key={img.id || idx}
            ref={(el) => {
              if (cardsRef) cardsRef.current[idx] = el;
            }}
            className={`absolute ${img.positionClass} ${img.sizeClass} group pointer-events-auto cursor-pointer transition-shadow duration-500 overflow-visible transform-gpu will-change-transform`}
          >
            <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-slate-900 border-2 border-white/90 shadow-2xl shadow-slate-900/20 group-hover:shadow-blue-900/30 group-hover:border-blue-400 transition-all duration-300 transform-gpu">
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
