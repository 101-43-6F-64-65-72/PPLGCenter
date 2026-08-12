"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";
import { extracurricularService } from "@/services/extracurricularService";
import { resolveImageUrl } from "@/lib/utils";

const DEFAULT_ITEMS = [
  {
    src: "/images/tempat/lapangansmkn2ska.jpg",
    alt: "Ekstrakurikuler Olahraga Basketball",
    label: "Olahraga",
  },
  {
    src: "/images/eskul.jpeg",
    alt: "Ekstrakurikuler Paskibra",
    label: "Paskibra",
  },
  {
    src: "/images/mading.jpeg",
    alt: "Ekstrakurikuler PMR",
    label: "PMR & Seni",
  },
  {
    src: "/images/fasilitas.jpeg",
    alt: "Ekstrakurikuler Pramuka",
    label: "Pramuka",
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

export default function ExtracurricularCollage() {
  const [items, setItems] = useState(DEFAULT_ITEMS);

  useEffect(() => {
    let isMounted = true;
    async function loadExtracurriculars() {
      try {
        const response = await extracurricularService.getExtracurriculars({
          pageSize: 4,
        });

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
            id: item.id || item.Id || idx,
            src: getCategoryMatchingImage(item, idx),
            alt: item.name || item.Name || "Ekstrakurikuler SMKN 2 Surakarta",
            label: item.category || item.name || item.Name || "Ekstrakurikuler",
          }));

          // Fill up to 4 items matching defaults if DB returns fewer
          while (mapped.length < 4) {
            const fallbackIdx = mapped.length;
            mapped.push({
              id: `fallback-${fallbackIdx}`,
              ...DEFAULT_ITEMS[fallbackIdx],
            });
          }

          setItems(mapped);
        }
      } catch (err) {
        // Safe fallback to default items if offline or DB empty
      }
    }

    loadExtracurriculars();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative w-full max-w-[500px] mx-auto lg:mx-0 select-none">
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
        {items.map((img, idx) => (
          <motion.div
            key={img.id || idx}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.4,
              delay: idx * 0.08,
              ease: "easeOut",
            }}
            className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/90 shadow-md hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 cursor-pointer"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 50vw, 250px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
            {/* Dark gradient bottom overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

            {/* Glass Pill Label */}
            <div className="absolute bottom-3 left-3 z-10 pr-2">
              <span className="inline-block bg-white/90 backdrop-blur-md text-slate-900 text-xs font-semibold px-3 py-1 rounded-lg shadow-xs border border-white/60 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800 transition-all duration-200 max-w-[150px] truncate">
                {img.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}




