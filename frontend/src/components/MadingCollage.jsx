"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";
import { Newspaper, BellRing } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

const DEFAULT_MADING = [
  {
    src: "/images/tempat/aulasmkn2ska.jpg",
    alt: "Kegiatan Mading Sekolah",
    label: "Berita Utama",
  },
  {
    src: "/images/tempat/halamandepansmkn2ska.jpg",
    alt: "Pengumuman Mading",
    label: "Informasi Terkini",
  },
];

export default function MadingCollage({ articles = [] }) {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const topArticle = articles[0];
  const secondArticle = articles[1];

  const getArticleImage = (art, fallbackIdx) => {
    if (!art) return DEFAULT_MADING[fallbackIdx].src;
    const raw = art.coverImageUrl || art.imageUrl || art.image || art.photoUrl || art.photo;
    return resolveImageUrl(raw, DEFAULT_MADING[fallbackIdx].src);
  };

  const topCard = {
    src: getArticleImage(topArticle, 0),
    alt: topArticle?.title || DEFAULT_MADING[0].alt,
    label: topArticle?.category || DEFAULT_MADING[0].label,
    title: topArticle?.title || "Pengumuman Prestasi & Kegiatan Siswa",
  };

  const bottomCard = {
    src: getArticleImage(secondArticle, 1),
    alt: secondArticle?.title || DEFAULT_MADING[1].alt,
    label: secondArticle?.category || DEFAULT_MADING[1].label,
    title: secondArticle?.title || "Informasi Resmi SMKN 2 Surakarta",
  };

  // 3D Perspective Tilt interaction on mouse movement
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 12, y: -y * 12 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[440px] mx-auto lg:mx-0 select-none perspective-1000"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        animate={{
          rotateY: tilt.x,
          rotateX: tilt.y,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full space-y-4"
      >
        {/* Floating Top Featured Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-200/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-blue-300"
        >
          <Image
            src={topCard.src}
            alt={topCard.alt}
            fill
            sizes="(max-width: 768px) 100vw, 440px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Top Floating Glass Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md text-slate-900 border border-white/60 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2c1ee8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2c1ee8]"></span>
            </span>
            <Newspaper className="w-3.5 h-3.5 text-[#2c1ee8]" />
            <span className="truncate max-w-[160px]">{topCard.label}</span>
          </div>

          {/* Bottom Card Title Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
            <p className="text-sm font-bold leading-tight line-clamp-1 group-hover:text-blue-200 transition-colors">
              {topCard.title}
            </p>
          </div>
        </motion.div>

        {/* Secondary Layered Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="group relative aspect-[16/8] w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/80 shadow-md transition-all duration-300 hover:shadow-lg"
        >
          <Image
            src={bottomCard.src}
            alt={bottomCard.alt}
            fill
            sizes="(max-width: 768px) 100vw, 440px"
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-slate-900 border border-white/60 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
            <BellRing className="w-3.5 h-3.5 text-[#2c1ee8]" />
            <span className="truncate max-w-[150px]">{bottomCard.label}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
