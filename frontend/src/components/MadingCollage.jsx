"use client";

import React from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";
import { Newspaper, BellRing } from "lucide-react";

const DEFAULT_MADING = [
  {
    src: "/images/tempat/aulasmkn2ska.jpg",
    alt: "Kegiatan Mading Sekolah",
    label: "Berita Sekolah",
  },
  {
    src: "/images/tempat/halamandepansmkn2ska.jpg",
    alt: "Pengumuman Mading",
    label: "Informasi Terkini",
  },
];

export default function MadingCollage({ articles = [] }) {
  const topArticle = articles[0];
  const secondArticle = articles[1];

  const topCard = {
    src:
      topArticle?.image ||
      topArticle?.imageUrl ||
      DEFAULT_MADING[0].src,
    alt: topArticle?.title || DEFAULT_MADING[0].alt,
    label: topArticle?.category || DEFAULT_MADING[0].label,
  };

  const bottomCard = {
    src:
      secondArticle?.image ||
      secondArticle?.imageUrl ||
      DEFAULT_MADING[1].src,
    alt: secondArticle?.title || DEFAULT_MADING[1].alt,
    label: secondArticle?.category || DEFAULT_MADING[1].label,
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto lg:mx-0 select-none">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-slate-50/80 backdrop-blur-md rounded-2xl p-3 shadow-sm border border-slate-200/90 space-y-3"
      >
        {/* Top Preview Card */}
        <div className="group relative h-[140px] sm:h-[150px] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-200/80">
          <Image
            src={topCard.src}
            alt={topCard.alt}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-slate-900 border border-white/60 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xs max-w-[200px] truncate">
            <Newspaper className="w-3.5 h-3.5 shrink-0 text-blue-600" />
            <span className="truncate">{topCard.label}</span>
          </div>
        </div>

        {/* Bottom Preview Card */}
        <div className="group relative h-[140px] sm:h-[150px] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-200/80">
          <Image
            src={bottomCard.src}
            alt={bottomCard.alt}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-slate-900 border border-white/60 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xs max-w-[200px] truncate">
            <BellRing className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="truncate">{bottomCard.label}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



