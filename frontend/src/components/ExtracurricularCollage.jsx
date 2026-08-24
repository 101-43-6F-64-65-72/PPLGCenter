"use client";

import React from "react";

// 8 Tech Stack SVG Logos with 3D Orbit Brand Metadata
export const TECH_STACK_DATA = [
  {
    name: "React.js",
    color: "#61dafb",
    glow: "drop-shadow-[0_0_22px_rgba(97,218,251,0.9)] hover:drop-shadow-[0_0_32px_rgba(97,218,251,1)]",
    svg: (
      <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-14 h-14 sm:w-16 sm:h-16">
        <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
        <g stroke="#61dafb" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
  },
  {
    name: "Next.js",
    color: "#ffffff",
    glow: "drop-shadow-[0_0_22px_rgba(255,255,255,0.9)] hover:drop-shadow-[0_0_32px_rgba(255,255,255,1)]",
    svg: (
      <svg viewBox="0 0 180 180" className="w-14 h-14 sm:w-16 sm:h-16">
        <circle cx="90" cy="90" r="85" fill="#0f172a" stroke="#fff" strokeWidth="6" />
        <path d="M149.508 157.52L69.141 54H54v72h14.4V72.237l66.425 85.503c4.898-3.08 9.47-6.52 13.683-10.22z" fill="#fff" />
        <path d="M115.5 54h14.4v54h-14.4z" fill="#fff" />
      </svg>
    ),
  },
  {
    name: "TypeScript",
    color: "#3178c6",
    glow: "drop-shadow-[0_0_22px_rgba(49,120,198,0.9)] hover:drop-shadow-[0_0_32px_rgba(49,120,198,1)]",
    svg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 sm:w-16 sm:h-16">
        <rect width="100" height="100" rx="22" fill="#3178c6" />
        <path d="M30 38h32v9H42v35H30V38zm33 24c2.8 1.8 6.5 3 10.2 3 4.2 0 6.2-1.6 6.2-3.8 0-2.4-2.8-3.4-7.5-5.2-6.5-2.4-10.5-5.8-10.5-11.8 0-6.8 5.6-11.8 14.8-11.8 4.6 0 8.4 1 11.2 2.6l-2.8 8.4c-2.4-1.2-5.4-2.2-8.5-2.2-3.8 0-5.6 1.4-5.6 3.4 0 2.2 2.6 3 7.5 4.8 6.8 2.5 10.5 5.8 10.5 12 0 7.2-5.8 12.2-15.8 12.2-5.2 0-9.8-1.2-12.8-3.2l3.1-8.4z" fill="#fff" />
      </svg>
    ),
  },
  {
    name: "Python",
    color: "#ffd43b",
    glow: "drop-shadow-[0_0_22px_rgba(255,212,59,0.9)] hover:drop-shadow-[0_0_32px_rgba(255,212,59,1)]",
    svg: (
      <svg viewBox="0 0 110 110" className="w-14 h-14 sm:w-16 sm:h-16">
        <path d="M54.2 12c-23 0-21.6 10-21.6 10l.1 10.3h22.1v3.1H24.3C14.5 35.4 6 41 6 54.8c0 14.2 7.4 19 18.3 19h10.9v-15.3c0-12.3 10.6-13 10.6-13h21.1V33.8C66.9 19.3 54.2 12 54.2 12zm-12 6.8c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4z" fill="#3776ab" />
        <path d="M55.8 98c23 0 21.6-10 21.6-10l-.1-10.3H55.2v-3.1h30.5c9.8 0 18.3-5.6 18.3-19.4 0-14.2-7.4-19-18.3-19H74.8v15.3c0 12.3-10.6 13-10.6 13H43.1v11.7C43.1 90.7 55.8 98 55.8 98zm12-6.8c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="#ffd43b" />
      </svg>
    ),
  },
  {
    name: "Tailwind CSS",
    color: "#06b6d4",
    glow: "drop-shadow-[0_0_22px_rgba(6,182,212,0.9)] hover:drop-shadow-[0_0_32px_rgba(6,182,212,1)]",
    svg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 sm:w-16 sm:h-16">
        <path d="M25 35c4-8 10-12 18-12 13.5 0 17 9 24.5 10.5C73 34.5 78 30 83 22c-4 8-10 12-18 12-13.5 0-17-9-24.5-10.5C35 24.5 30 29 25 37zm-8 28c4-8 10-12 18-12 13.5 0 17 9 24.5 10.5C65 62.5 70 58 75 50c-4 8-10 12-18 12-13.5 0-17-9-24.5-10.5C27 52.5 22 57 17 65z" fill="#06b6d4" />
      </svg>
    ),
  },
  {
    name: "Flutter",
    color: "#45d1fd",
    glow: "drop-shadow-[0_0_22px_rgba(69,209,253,0.9)] hover:drop-shadow-[0_0_32px_rgba(69,209,253,1)]",
    svg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 sm:w-16 sm:h-16">
        <path d="M58 12L20 50l12 12L70 24H58z" fill="#45d1fd" />
        <path d="M58 50L38 70l20 20h12L50 70l20-20H58z" fill="#45d1fd" />
        <path d="M38 70l12 12h12L50 70z" fill="#09497d" />
      </svg>
    ),
  },
  {
    name: "Node.js",
    color: "#339933",
    glow: "drop-shadow-[0_0_22px_rgba(51,153,51,0.9)] hover:drop-shadow-[0_0_32px_rgba(51,153,51,1)]",
    svg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 sm:w-16 sm:h-16">
        <path d="M50 10L15 30v40l35 20 35-20V30L50 10zm0 10l25 14.5v29L50 78 25 63.5v-29L50 20z" fill="#339933" />
        <path d="M50 35a12 12 0 100 24 12 12 0 000-24z" fill="#66cc33" />
      </svg>
    ),
  },
  {
    name: "Unity / C#",
    color: "#a855f7",
    glow: "drop-shadow-[0_0_22px_rgba(168,85,247,0.9)] hover:drop-shadow-[0_0_32px_rgba(168,85,247,1)]",
    svg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 sm:w-16 sm:h-16">
        <path d="M50 15l25 15v30L50 75 25 60V30L50 15zm-15 22.5v15L47.5 60h15v-15L50 37.5H35z" fill="#ffffff" />
        <circle cx="50" cy="50" r="42" stroke="#a855f7" strokeWidth="6" fill="none" />
      </svg>
    ),
  },
];

export default function ExtracurricularCollage({ logosRef, innerRefs, isCtaHovered }) {
  return (
    <>
      {/* DESKTOP (lg:block): 3D Orbit & Explosive Burst Tech Stack Logos */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none select-none overflow-visible">
        {TECH_STACK_DATA.map((logo, idx) => (
          <div
            key={`orbit-logo-${logo.name}`}
            ref={(el) => {
              if (logosRef) logosRef.current[idx] = el;
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center transform-gpu will-change-transform opacity-0 scale-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              ref={(el) => {
                if (innerRefs) innerRefs.current[idx] = el;
              }}
              className="transform-gpu will-change-transform pointer-events-auto cursor-pointer"
            >
              <div
                className={`transition-all duration-400 ease-out ${
                  isCtaHovered ? "scale-85 opacity-60 translate-y-3" : "hover:scale-125 hover:rotate-6"
                } ${logo.glow}`}
              >
                {logo.svg}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE (lg:hidden): Clean 4-column tech badges with soft backdrop and neat layout */}
      <div className="lg:hidden grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-sm sm:max-w-md mx-auto mb-6 sm:mb-8 relative z-20 pointer-events-auto">
        {TECH_STACK_DATA.map((logo) => (
          <div
            key={`mobile-${logo.name}`}
            className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/90 shadow-2xs group hover:border-blue-300 transition-all active:scale-95"
          >
            <div className={`transition-transform duration-300 group-hover:scale-110 ${logo.glow}`}>
              {React.cloneElement(logo.svg, { className: "w-7 h-7 sm:w-9 sm:h-9" })}
            </div>
            <span className="text-[10px] font-bold text-slate-700 mt-1 truncate max-w-full text-center">
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
