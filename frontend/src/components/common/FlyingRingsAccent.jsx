"use client";

import React from "react";

export default function FlyingRingsAccent({ ringsRef }) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-visible z-0">
      {/* Ring 1 - Top Left Orbit Bubble */}
      <div
        ref={(el) => {
          if (ringsRef) ringsRef.current[0] = el;
        }}
        className="absolute top-10 left-12 w-32 h-32 rounded-full border border-blue-500/30 bg-blue-500/10 transform-gpu will-change-transform flex items-center justify-center"
      >
        <div className="w-16 h-16 rounded-full border border-indigo-400/40 bg-indigo-500/10" />
      </div>

      {/* Ring 2 - Top Right Orbit Bubble */}
      <div
        ref={(el) => {
          if (ringsRef) ringsRef.current[1] = el;
        }}
        className="absolute top-14 right-16 w-44 h-44 rounded-full border border-[#2c1ee8]/30 bg-blue-600/10 transform-gpu will-change-transform flex items-center justify-center"
      >
        <div className="w-24 h-24 rounded-full border border-blue-400/40" />
      </div>

      {/* Ring 3 - Bottom Left Orbit Bubble */}
      <div
        ref={(el) => {
          if (ringsRef) ringsRef.current[2] = el;
        }}
        className="absolute bottom-16 left-16 w-40 h-40 rounded-full border border-sky-400/30 bg-sky-400/10 transform-gpu will-change-transform flex items-center justify-center"
      >
        <div className="w-20 h-20 rounded-full border border-blue-500/30" />
      </div>

      {/* Ring 4 - Bottom Right Orbit Bubble */}
      <div
        ref={(el) => {
          if (ringsRef) ringsRef.current[3] = el;
        }}
        className="absolute bottom-12 right-14 w-36 h-36 rounded-full border border-indigo-500/35 bg-indigo-500/10 transform-gpu will-change-transform flex items-center justify-center"
      >
        <div className="w-14 h-14 rounded-full border border-blue-400/40" />
      </div>
    </div>
  );
}
