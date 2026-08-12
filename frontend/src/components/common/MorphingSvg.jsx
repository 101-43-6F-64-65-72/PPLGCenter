"use client";

import React from "react";
import { motion } from "@/lib/motion";

// Paths for Organic Fluid Morphing Blob
const BLOB_PATHS = [
  "M220,-280C280,-230,320,-160,340,-80C360,0,360,90,320,160C280,230,200,280,120,310C40,340,-40,350,-120,320C-200,290,-280,220,-320,140C-360,60,-360,-30,-330,-110C-300,-190,-240,-260,-170,-300C-100,-340,-50,-350,20,-380C90,-410,160,-330,220,-280Z",
  "M250,-240C310,-180,330,-90,320,0C310,90,270,180,210,240C150,300,70,330,-10,340C-90,350,-180,340,-240,280C-300,220,-330,110,-330,0C-330,-110,-300,-220,-230,-280C-160,-340,-80,-350,0,-350C80,-350,190,-300,250,-240Z",
  "M200,-290C260,-250,300,-180,330,-100C360,-20,380,70,340,140C300,210,200,260,110,300C20,340,-60,370,-140,340C-220,310,-300,220,-330,130C-360,40,-340,-50,-300,-130C-260,-210,-200,-280,-130,-320C-60,-360,20,-370,100,-350C180,-330,140,-330,200,-290Z",
  "M220,-280C280,-230,320,-160,340,-80C360,0,360,90,320,160C280,230,200,280,120,310C40,340,-40,350,-120,320C-200,290,-280,220,-320,140C-360,60,-360,-30,-330,-110C-300,-190,-240,-260,-170,-300C-100,-340,-50,-350,20,-380C90,-410,160,-330,220,-280Z",
];

// Paths for Aggressive Futuristic Tech Shard
const SHARD_PATHS = [
  "M180,-220L290,-120L310,40L210,190L50,280L-120,240L-260,130L-280,-40L-190,-180L-50,-260Z",
  "M220,-180L330,-60L280,110L170,240L-10,310L-170,220L-290,80L-250,-110L-140,-220L10,-280Z",
  "M150,-250L270,-150L330,-10L240,160L90,260L-80,290L-240,180L-300,-10L-220,-150L-20,-290Z",
  "M180,-220L290,-120L310,40L210,190L50,280L-120,240L-260,130L-280,-40L-190,-180L-50,-260Z",
];

// Paths for Cybernetic Dynamic Energy Ring
const RING_PATHS = [
  "M200,-250C270,-200,320,-110,310,-10C300,90,230,200,140,260C50,320,-60,330,-160,280C-260,230,-350,120,-340,10C-330,-100,-220,-210,-120,-270C-20,-330,130,-300,200,-250Z",
  "M240,-210C300,-150,340,-50,320,50C300,150,220,250,120,290C20,330,-100,310,-200,250C-300,190,-380,90,-360,-20C-340,-130,-220,-250,-110,-300C0,-350,180,-270,240,-210Z",
  "M200,-250C270,-200,320,-110,310,-10C300,90,230,200,140,260C50,320,-60,330,-160,280C-260,230,-350,120,-340,10C-330,-100,-220,-210,-120,-270C-20,-330,130,-300,200,-250Z",
];

export default function MorphingSvg({
  preset = "blob", // 'blob' | 'shard' | 'ring'
  className = "",
  size = 500,
  duration = 10,
  gradientId = "blueGradient",
  startColor = "#2c1ee8",
  endColor = "#60a5fa",
  opacity = 0.25,
}) {
  const paths =
    preset === "shard" ? SHARD_PATHS : preset === "ring" ? RING_PATHS : BLOB_PATHS;

  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="-400 -400 800 800"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} stopOpacity={opacity} />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity={opacity * 0.75} />
            <stop offset="100%" stopColor={endColor} stopOpacity={opacity * 0.2} />
          </linearGradient>
          <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <motion.path
          d={paths[0]}
          animate={{ d: paths }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          fill={`url(#${gradientId})`}
          filter={`url(#${gradientId}-glow)`}
          stroke={startColor}
          strokeWidth="1.5"
          strokeOpacity={opacity * 1.5}
        />
      </svg>
    </div>
  );
}
