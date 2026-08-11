"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";
import facilityService from "@/services/facilityService";

const DEFAULT_FACILITY_IMAGES = [
  {
    src: "/images/tempat/halamandepansmkn2ska.jpg",
    alt: "Halaman Utama SMKN 2 Surakarta",
    label: "Halaman Utama",
  },
  {
    src: "/images/tempat/lapangansmkn2ska.jpg",
    alt: "Lapangan SMKN 2 Surakarta",
    label: "Lapangan Olahraga",
  },
  {
    src: "/images/tempat/aulasmkn2ska.jpg",
    alt: "Aula SMKN 2 Surakarta",
    label: "Aula Serbaguna",
  },
  {
    src: "/images/tempat/labsmkn2ska.jpeg",
    alt: "Laboratorium SMKN 2 Surakarta",
    label: "Laboratorium",
  },
];

const getFacilityCategoryMatchingImage = (item, index) => {
  if (item.imageUrl || item.image || item.photo) {
    return item.imageUrl || item.image || item.photo;
  }
  const text = `${item.category || ""} ${item.name || item.Name || ""}`.toLowerCase();
  if (text.includes("halaman") || text.includes("area") || text.includes("depan") || text.includes("taman")) {
    return "/images/tempat/halamandepansmkn2ska.jpg";
  }
  if (text.includes("lapangan") || text.includes("olahraga") || text.includes("stadion")) {
    return "/images/tempat/lapangansmkn2ska.jpg";
  }
  if (text.includes("aula") || text.includes("ruang utama") || text.includes("hall") || text.includes("auditorium")) {
    return "/images/tempat/aulasmkn2ska.jpg";
  }
  if (text.includes("lab") || text.includes("komputer") || text.includes("laboratorium") || text.includes("bengkel")) {
    return "/images/tempat/labsmkn2ska.jpeg";
  }
  return DEFAULT_FACILITY_IMAGES[index % DEFAULT_FACILITY_IMAGES.length].src;
};

export default function FacilityCollage() {
  const [facilities, setFacilities] = useState(DEFAULT_FACILITY_IMAGES);

  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        const res = await facilityService.getFacilities({ pageSize: 4 });
        const rawData = res?.data ?? res;
        const items = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.items)
          ? rawData.items
          : [];

        if (isMounted && items.length > 0) {
          const mapped = items.slice(0, 4).map((item, index) => ({
            id: item.id || item.Id || index,
            src: getFacilityCategoryMatchingImage(item, index),
            alt: item.name || item.Name || "Fasilitas SMKN 2 Surakarta",
            label: item.category || item.name || item.Name || "Fasilitas",
          }));

          // Fill up to 4 items matching defaults if DB returns fewer
          while (mapped.length < 4) {
            const fallbackIdx = mapped.length;
            mapped.push({
              id: `fallback-${fallbackIdx}`,
              ...DEFAULT_FACILITY_IMAGES[fallbackIdx],
            });
          }

          setFacilities(mapped);
        }
      } catch (err) {
        // Safe fallback to default items if offline or DB empty
      }
    }

    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative w-full max-w-[500px] mx-auto select-none">
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
        {facilities.map((image, index) => (
          <motion.div
            key={image.id || index}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
              ease: "easeOut",
            }}
            className="group relative aspect-square overflow-hidden rounded-2xl shadow-xs border border-slate-200 bg-slate-100 hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 45vw, 250px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
            {/* Dark gradient bottom overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

            {/* Pill Label */}
            <div className="absolute bottom-3 left-3 z-10 pr-2">
              <span className="inline-block bg-white/95 text-slate-900 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-2xs border border-slate-200/80 group-hover:bg-[#2c1ee8] group-hover:text-white group-hover:border-[#2c1ee8] transition-colors duration-200 max-w-[150px] truncate">
                {image.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}




