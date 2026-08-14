"use client";

import { useRef } from "react";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/utils";

export default function ExtracurricularCard({ imageSrc, title, alt = "Ekstrakurikuler" }) {
  const cardRef = useRef(null);

  const resolvedSrc = resolveImageUrl(imageSrc);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.setProperty("--rotate-x", `${rotateX}deg`);
    card.style.setProperty("--rotate-y", `${rotateY}deg`);
    card.style.setProperty("--glow-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--glow-y", `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");
  };

  return (
    <div style={{ perspective: "1000px" }} className="h-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative flex h-full flex-col rounded-[28px] overflow-hidden border border-gray-200 bg-white shadow-sm transition-shadow duration-300 ease-out hover:shadow-2xl hover:shadow-blue-900/20 will-change-transform"
        style={{
          transform:
            "rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg)) translateZ(0)",
          transformStyle: "preserve-3d",
          transition: "transform 0.25s ease-out",
        }}
      >
        {/* Cursor-following light sweep */}
        <div
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(255,255,255,0.25), transparent 55%)",
          }}
        />

        <div className="relative h-72 sm:h-80 overflow-hidden">
          <Image
            src={resolvedSrc}
            alt={alt}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        </div>

        {/* Button now sits in normal flow, not absolute — always flush with card bottom */}
        <div
          className="flex flex-1 items-center justify-center px-3 py-3 z-30"
          style={{ transform: "translateZ(40px)" }}
        >
          <button
            type="button"
            className="w-full rounded-full bg-gradient-to-b from-blue-500 to-blue-700 px-6 py-4 text-base font-semibold uppercase tracking-wide text-white shadow-lg shadow-blue-900/30 transition-all duration-300 ease-out hover:from-blue-400 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-900/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            {title}
          </button>
        </div>
      </div>
    </div>
  );
}