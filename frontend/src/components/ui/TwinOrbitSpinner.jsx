"use client";

import React from "react";

/**
 * Reusable Twin Orbit Loading Spinner Component
 * Inspired by @loading-ui/twin-orbit style with brand blue #2c1ee8 and indigo accent.
 */
export const TwinOrbitSpinner = ({
  size = "md", // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color = "primary", // 'primary' | 'white' | 'amber'
  className = "",
  label = null,
}) => {
  const sizeMap = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const orbitSizeClass = sizeMap[size] || sizeMap.md;

  const colorMap = {
    primary: {
      outer: "border-[#2c1ee8] border-t-transparent",
      inner: "border-indigo-400 border-b-transparent",
      dotOuter: "bg-[#2c1ee8]",
      dotInner: "bg-indigo-500",
    },
    white: {
      outer: "border-white border-t-transparent",
      inner: "border-white/60 border-b-transparent",
      dotOuter: "bg-white",
      dotInner: "bg-white/80",
    },
    amber: {
      outer: "border-amber-500 border-t-transparent",
      inner: "border-amber-300 border-b-transparent",
      dotOuter: "bg-amber-500",
      dotInner: "bg-amber-300",
    },
  };

  const currentColors = colorMap[color] || colorMap.primary;

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className={`relative ${orbitSizeClass} flex items-center justify-center`}>
        {/* Outer Orbit Ring (Clockwise Rotation) */}
        <div
          className={`absolute inset-0 rounded-full border-2 ${currentColors.outer} animate-spin`}
          style={{ animationDuration: "1.2s", animationTimingFunction: "cubic-bezier(0.5, 0.1, 0.5, 0.9)" }}
        />

        {/* Inner Orbit Ring (Counter-Clockwise Rotation) */}
        <div
          className={`absolute inset-1 rounded-full border-2 ${currentColors.inner}`}
          style={{
            animation: "twin-orbit-reverse 0.9s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite",
          }}
        />

        {/* Center Glowing Core */}
        <div className={`w-1.5 h-1.5 rounded-full ${currentColors.dotOuter} animate-ping opacity-75`} />
      </div>

      {label && <span className="text-xs font-bold tracking-wide animate-pulse">{label}</span>}

      <style jsx global>{`
        @keyframes twin-orbit-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};

export default TwinOrbitSpinner;
