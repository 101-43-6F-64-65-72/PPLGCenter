"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Path 1: Base 4-Pointed Star (Initial Reveal State)
const STAR_BASE_PATH =
  "M0,-240 C30,-80 80,-30 240,0 C80,30 30,80 0,240 C-30,80 -80,30 -240,0 C-80,-30 -30,-80 0,-240 Z";

// Path 2: Multi-Pointed Star (Target 12-Pointed Star State - Morph SVG Target)
const STAR_MULTI_PATH =
  "M0,-250 L35,-110 L125,-216 L110,-35 L216,-125 L110,35 L250,0 L110,-35 L216,125 L110,35 L125,216 L35,110 L0,250 L-35,110 L-125,216 L-110,35 L-216,125 L-110,-35 L-250,0 L-110,35 L-216,-125 L-110,-35 L-125,-216 L-35,-110 Z";

// Organic Blob & Shard Fallback Presets
const BLOB_PATHS = [
  "M220,-280C280,-230,320,-160,340,-80C360,0,360,90,320,160C280,230,200,280,120,310C40,340,-40,350,-120,320C-200,290,-280,220,-320,140C-360,60,-360,-30,-330,-110C-300,-190,-240,-260,-170,-300C-100,-340,-50,-350,20,-380C90,-410,160,-330,220,-280Z",
  "M250,-240C310,-180,330,-90,320,0C310,90,270,180,210,240C150,300,70,330,-10,340C-90,350,-180,340,-240,280C-300,220,-330,110,-330,0C-330,-110,-300,-220,-230,-280C-160,-340,-80,-350,0,-350C80,-350,190,-300,250,-240Z",
  "M200,-290C260,-250,300,-180,330,-100C360,-20,380,70,340,140C300,210,200,260,110,300C20,340,-60,370,-140,340C-220,310,-300,220,-330,130C-360,40,-340,-50,-300,-130C-260,-210,-200,-280,-130,-320C-60,-360,20,-370,100,-350C180,-330,140,-330,200,-290Z",
];

export default function MorphingSvg({
  preset = "star", // 'star' | 'blob' | 'shard' | 'ring'
  className = "",
  size = 520,
  duration = 2,
  gradientId = "starGrad",
  startColor = "#2c1ee8",
  endColor = "#60a5fa",
  opacity = 0.28,
  triggerRef = null,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);

  // GSAP 2-Second Entrance Reveal Morphing + ScrollTrigger 360 Rotation Scrub
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const sectionTrigger = triggerRef?.current || containerRef.current;

    // 1. Scroll-Driven 360-Degree Continuous Rotation (scrub: 1)
    const rotationTween = gsap.to(svgRef.current, {
      rotation: 360,
      ease: "none",
      scrollTrigger: {
        trigger: sectionTrigger,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    // 2. Entrance Morphing Reveal Animation (2-second morphing on viewport enter)
    let morphTween;
    if (preset === "star" && pathRef.current) {
      ScrollTrigger.create({
        trigger: sectionTrigger,
        start: "top 85%",
        once: true,
        onEnter: () => {
          morphTween = gsap.to(pathRef.current, {
            attr: { d: STAR_MULTI_PATH },
            duration: 2,
            ease: "power2.out",
          });
        },
      });
    }

    return () => {
      rotationTween?.scrollTrigger?.kill();
      rotationTween?.kill();
      morphTween?.kill();
    };
  }, [preset, triggerRef]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        ref={svgRef}
        viewBox="-350 -350 700 700"
        className="w-full h-full overflow-visible transform-gpu origin-center"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} stopOpacity={opacity} />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity={opacity * 0.8} />
            <stop offset="100%" stopColor={endColor} stopOpacity={opacity * 0.25} />
          </linearGradient>
          <filter id={`${gradientId}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="24" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {preset === "star" ? (
          <path
            ref={pathRef}
            d={STAR_BASE_PATH}
            fill={`url(#${gradientId})`}
            filter={`url(#${gradientId}-glow)`}
            stroke={startColor}
            strokeWidth="1.75"
            strokeOpacity={opacity * 1.6}
          />
        ) : (
          <motion.path
            d={BLOB_PATHS[0]}
            animate={{ d: BLOB_PATHS }}
            transition={{
              duration: 10,
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
        )}
      </svg>
    </div>
  );
}
