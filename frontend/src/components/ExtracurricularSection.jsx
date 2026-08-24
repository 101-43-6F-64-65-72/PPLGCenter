"use client";

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ExtracurricularCollage, { TECH_STACK_DATA } from "./ExtracurricularCollage";
import PrimaryButton from "./PrimaryButton";
import { Users2, Sparkles, Code2, Globe } from "lucide-react";
import MorphingBlob from "@/components/common/MorphingBlob";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ExtracurricularSection() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const textContentRef = useRef(null);
  
  // Interactive CTA Leap-Over State
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  // Refs for Tech Logos Outer (position/orbit) and Inner (idle bobbing)
  const logosRef = useRef([]);
  const innerRefs = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined" || !sectionRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const logoEls = logosRef.current.filter(Boolean);
    const floatEls = innerRefs.current.filter(Boolean);
    const totalLogos = TECH_STACK_DATA.length;

    // Wide Orbit Parameters — icons orbit well outside the 600px avatar
    const Rx = 500;
    const Ry = 200;

    // Custom Safe Perimeter Angles (radians) ensuring ZERO collision with CTA button at rest
    // 0: React.js (Top-Left), 1: Next.js (Top-Right), 2: TypeScript (Mid-Left), 3: Python (Mid-Right)
    // 4: Tailwind CSS (Bottom-Left Flank), 5: Flutter (Bottom-Right Flank), 6: Node.js (Top-Center), 7: Unity (Bottom-Low)
    const BASE_ANGLES = [
      (225 * Math.PI) / 180, // React.js (-368, -177)
      (315 * Math.PI) / 180, // Next.js (368, -177)
      (180 * Math.PI) / 180, // TypeScript (-520, 0)
      (0 * Math.PI) / 180,   // Python (520, 0)
      (145 * Math.PI) / 180, // Tailwind CSS (-425, 143) -> Wide Left of CTA
      (35 * Math.PI) / 180,  // Flutter (425, 143) -> Wide Right of CTA
      (270 * Math.PI) / 180, // Node.js (0, -250) -> High above kicker
      (90 * Math.PI) / 180,  // Unity (0, 310) -> Below CTA button
    ];

    // Calculate 3D Depth & Scale Properties for any angle theta (radians)
    const getOrbitProps = (theta, idx) => {
      // For Unity (idx 7), extend Ry to 310px to sit cleanly below CTA button
      const customRy = idx === 7 ? 310 : Ry;
      const x = Rx * Math.cos(theta);
      const y = customRy * Math.sin(theta);
      // Normalized depth ratio: 0 at top/back (y < 0), 1 at bottom/front (y > 0)
      const depthRatio = (Math.sin(theta) + 1) / 2;
      const scale = 0.75 + depthRatio * 0.40;  // 0.75 (back) to 1.15 (front)
      const opacity = 0.50 + depthRatio * 0.50; // 0.50 (back) to 1.00 (front)
      // Overlap z-index: avatar = z-20, text = z-30
      // Back icons (y<0) → z-10  (pass BEHIND avatar)
      // Front icons (y>0) → z-40 (pass IN FRONT of avatar)
      const zIndex = y > 0 ? 40 : 10;
      return { x, y, scale, opacity, zIndex };
    };

    // Reduced motion accessibility fallback
    if (prefersReducedMotion) {
      logoEls.forEach((el, idx) => {
        const baseAngle = BASE_ANGLES[idx] || 0;
        const props = getOrbitProps(baseAngle, idx);
        if (el) {
          gsap.set(el, {
            x: props.x,
            y: props.y,
            scale: props.scale,
            opacity: props.opacity,
            zIndex: props.zIndex,
            rotation: 0,
          });
        }
      });
      return;
    }

    let mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      // 1. Initial State: Collapse all logos at dead center (0, 0)
      logoEls.forEach((el) => {
        gsap.set(el, {
          x: 0,
          y: 0,
          scale: 0,
          opacity: 0,
          rotation: -720,
          zIndex: 20,
        });
      });

      // 2. Smooth Pinning GSAP ScrollTrigger Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: pinRef.current || true,
          start: "top top",
          end: "+=1600",
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true,
        },
      });

      // --- PHASE 1: Explosion Burst to Wide Perimeter (Scrub 0.00 -> 0.30) ---
      logoEls.forEach((el, idx) => {
        const baseAngle = BASE_ANGLES[idx] || 0;
        const startProps = getOrbitProps(baseAngle, idx);
        const delay = idx * 0.02;

        tl.fromTo(
          el,
          { x: 0, y: 0, scale: 0, opacity: 0, rotation: -720 },
          {
            x: startProps.x,
            y: startProps.y,
            scale: startProps.scale,
            opacity: startProps.opacity,
            zIndex: startProps.zIndex,
            rotation: 0,
            duration: 0.30,
            ease: "back.out(1.7)", // Elastic overshoot explosion
            force3D: true,
          },
          0.0 + delay
        );
      });
      // --- PHASE 1.5: Soft Settle Transition (Burst → Orbit) ---
      // Adds a subtle bounce and scale tweak to smooth the hand‑off into the orbit sweep.
      tl.to(logoEls, {
        scale: "+=0.07",
        rotation: "+=30",
        duration: 0.12,
        ease: "back.out(2)", // smoother elastic settle into orbit
      }, ">");

      // --- PHASE 2: 3D Elliptical Orbit Sweep (Scrub 0.30 -> 0.85) ---
      const orbitObj = { phi: 0 };
      tl.to(
        orbitObj,
        {
          phi: Math.PI * 2, // Full 360 degree orbit sweep along wide perimeter
          ease: "none",
          duration: 0.55,
          onUpdate: () => {
            logoEls.forEach((el, idx) => {
              const baseAngle = BASE_ANGLES[idx] || 0;
              const currentAngle = baseAngle + orbitObj.phi;
              const props = getOrbitProps(currentAngle, idx);
              if (el) {
                gsap.set(el, {
                  x: props.x,
                  y: props.y,
                  scale: props.scale,
                  opacity: props.opacity,
                  zIndex: props.zIndex,
                  force3D: true,
                });
              }
            });
          },
        },
        0.30
      );

      // --- PHASE 3: Continuous Idle Bobbing Physics ---
      floatEls.forEach((floatInner, idx) => {
        gsap.to(floatInner, {
          y: idx % 2 === 0 ? -6 : 6,
          rotation: idx % 2 === 0 ? 4 : -4,
          duration: 3.2 + (idx % 3) * 0.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      // Centered Text Reveal
      if (textContentRef.current) {
        tl.fromTo(
          textContentRef.current,
          { scale: 0.96, y: 15, opacity: 0.5 },
          { scale: 1, y: 0, opacity: 1, ease: "power1.out" },
          0
        );
      }

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);

      return () => {
        tl.kill();
      };
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="komunitas"
      className="w-full bg-slate-50/70 border-t border-slate-200/80 relative overflow-visible bg-dots-pattern select-none z-10 py-16 sm:py-24 lg:py-32"
    >
      <div ref={pinRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0 min-h-[auto] lg:min-h-[640px] flex items-center justify-center relative overflow-visible">
        
        {/* BloubAvatar — 600px watermark, z-0 (behind everything) */}
        <MorphingBlob
          size={600}
          variant="watermark"
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:block"
        />
        {/* Mobile: smaller 280px version */}
        <MorphingBlob
          size={280}
          variant="watermark"
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 lg:hidden opacity-30"
        />

        <div className="relative max-w-7xl mx-auto min-h-[auto] lg:min-h-[600px] w-full flex items-center justify-center overflow-visible rounded-3xl">
          
          {/* Desktop & Mobile Tech Stack Logos with Wide 3D Orbit Choreography */}
          <ExtracurricularCollage
            logosRef={logosRef}
            innerRefs={innerRefs}
            isCtaHovered={isCtaHovered}
          />

          {/* Centered Main Text Content (z-30) */}
          <div
            ref={textContentRef}
            className="flex flex-col items-center text-center max-w-2xl mx-auto relative z-30 pointer-events-auto px-2 sm:px-4"
          >
            {/* Section Kicker */}
            <div className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2c1ee8] text-[10px] sm:text-[11px] font-mono tracking-widest uppercase mb-4 sm:mb-5 shadow-2xs select-none max-w-full">
              <Users2 className="w-3.5 h-3.5 text-[#2c1ee8] shrink-0" />
              <span className="font-semibold truncate">EKOSISTEM KOMUNITAS & GUILD PPLG</span>
            </div>

            {/* Centered Main Heading */}
            <h2 className="text-2xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.16] sm:leading-[1.12] mb-4 sm:mb-6 drop-shadow-2xs">
              Komunitas Developer & <br />
              <span className="text-[#2c1ee8]">Circle Teknologi PPLG</span>
            </h2>

            {/* Centered Description */}
            <p className="text-sm sm:text-base lg:text-lg text-[#475569] leading-relaxed mb-6 sm:mb-8 max-w-xl font-normal">
              Wadah kolaborasi, belajar bersama (peer learning), dan ruang berkarya bagi siswa PPLG SMKN 2 Surakarta. Dari Web Development, Mobile Apps, Game Dev, hingga Cyber Security.
            </p>

            {/* Quick Highlight Badges Row */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-9">
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-800 shadow-2xs">
                <Globe className="w-3.5 h-3.5 text-[#2c1ee8] shrink-0" /> 6+ Circle & Guild Active
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-800 shadow-2xs">
                <Code2 className="w-3.5 h-3.5 text-[#2c1ee8] shrink-0" /> Peer-to-Peer Learning
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-800 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#2c1ee8] shrink-0" /> Project Collaboration
              </span>
            </div>

            {/* Primary CTA with Interactive "Pop-Forward" Hover Reaction (z-20 default -> z-50 hover) */}
            <div
              onMouseEnter={() => setIsCtaHovered(true)}
              onMouseLeave={() => setIsCtaHovered(false)}
              className={`w-full sm:w-auto flex justify-center transform-gpu transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isCtaHovered
                  ? "relative z-50 scale-106 -translate-y-1.5 drop-shadow-[0_20px_35px_rgba(44,30,232,0.45)]"
                  : "relative z-20 scale-100"
              }`}
            >
              <PrimaryButton
                href="/ekstrakurikuler"
                text="Jelajahi Komunitas"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
