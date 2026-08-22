"use client";

import React, { useEffect, useRef, useId } from "react";
import { gsap } from "gsap";

// ─── Geometry ─────────────────────────────────────────────────────────────
// viewBox: -125..125  (250×250 units)
// Outer "face" boundary — near-perfect circle from reference SVG
const FACE_PATH =
  "M99.53 -0.57C99.53 2.71 99.37 6 99.05 9.27C98.73 12.54 98.25 15.8 97.61 19.02C96.97 22.24 96.18 25.44 95.23 28.58C94.28 31.72 93.17 34.83 91.92 37.86C90.67 40.89 89.27 43.87 87.73 46.77C86.19 49.66 84.5 52.49 82.68 55.22C80.87 57.95 78.91 60.6 76.83 63.13C74.76 65.67 72.55 68.12 70.24 70.44C67.93 72.76 65.5 74.97 62.97 77.05C60.45 79.14 57.81 81.1 55.09 82.93C52.37 84.75 49.55 86.44 46.67 87.99C43.79 89.54 40.82 90.95 37.8 92.21C34.78 93.46 31.69 94.57 28.56 95.53C25.44 96.48 22.25 97.28 19.04 97.92C15.84 98.56 12.59 99.04 9.33 99.37C6.08 99.69 2.8 99.85 -0.47 99.85C-3.73 99.85 -7.02 99.69 -10.27 99.37C-13.52 99.04 -16.77 98.56 -19.98 97.92C-23.18 97.28 -26.37 96.48 -29.5 95.53C-32.62 94.57 -35.72 93.46 -38.74 92.21C-41.75 90.95 -44.72 89.54 -47.61 87.99C-50.49 86.44 -53.31 84.75 -56.02 82.93C-58.74 81.1 -61.38 79.14 -63.91 77.05C-66.43 74.97 -68.87 72.76 -71.18 70.44C-73.49 68.12 -75.7 65.67 -77.77 63.13C-79.84 60.6 -81.8 57.95 -83.61 55.22C-85.43 52.49 -87.12 49.66 -88.66 46.77C-90.2 43.87 -91.6 40.89 -92.85 37.86C-94.11 34.83 -95.21 31.72 -96.16 28.58C-97.11 25.44 -97.91 22.24 -98.55 19.02C-99.18 15.8 -99.66 12.54 -99.99 9.27C-100.31 6 -100.47 2.71 -100.47 -0.57C-100.47 -3.85 -100.31 -7.15 -99.99 -10.42C-99.66 -13.68 -99.18 -16.95 -98.55 -20.16C-97.91 -23.38 -97.11 -26.58 -96.16 -29.72C-95.21 -32.86 -94.11 -35.97 -92.85 -39C-91.6 -42.03 -90.2 -45.02 -88.66 -47.91C-87.12 -50.81 -85.43 -53.64 -83.61 -56.36C-81.8 -59.09 -79.84 -61.74 -77.77 -64.28C-75.7 -66.82 -73.49 -69.26 -71.18 -71.58C-68.87 -73.9 -66.43 -76.12 -63.91 -78.2C-61.38 -80.28 -58.74 -82.25 -56.02 -84.07C-53.31 -85.89 -50.49 -87.59 -47.61 -89.14C-44.72 -90.68 -41.75 -92.1 -38.74 -93.35C-35.72 -94.61 -32.62 -95.72 -29.5 -96.67C-26.37 -97.62 -23.18 -98.43 -19.98 -99.07C-16.77 -99.71 -13.52 -100.19 -10.27 -100.51C-7.02 -100.83 -3.73 -101 -0.47 -101C2.8 -101 6.08 -100.83 9.33 -100.51C12.59 -100.19 15.84 -99.71 19.04 -99.07C22.25 -98.43 25.44 -97.62 28.56 -96.67C31.69 -95.72 34.78 -94.61 37.8 -93.35C40.82 -92.1 43.79 -90.68 46.67 -89.14C49.55 -87.59 52.37 -85.89 55.09 -84.07C57.81 -82.25 60.45 -80.28 62.97 -78.2C65.5 -76.12 67.93 -73.9 70.24 -71.58C72.55 -69.26 74.76 -66.82 76.83 -64.28C78.91 -61.74 80.87 -59.09 82.68 -56.36C84.5 -53.64 86.19 -50.81 87.73 -47.91C89.27 -45.02 90.67 -42.03 91.92 -39C93.17 -35.97 94.28 -32.86 95.23 -29.72C96.18 -26.58 96.97 -23.38 97.61 -20.16C98.25 -16.95 98.73 -13.68 99.05 -10.42C99.37 -7.15 99.53 -3.85 99.53 -0.57Z";

// Eye pill (rx=22.5) from user spec
const EYE_PILL =
  "M-22.5 -1A22.5 22.5 0 0 1 0 -23.5L0 -23.5A22.5 22.5 0 0 1 22.5 -1L22.5 1A22.5 22.5 0 0 1 0 23.5L0 23.5A22.5 22.5 0 0 1 -22.5 1Z";

// Eye base matrices from reference spec
const EYE1_BASE = { a: 0.97, b: 0,     c: 0.01, d: 1, tx: -25.84, ty: 3.98  };
const EYE2_BASE = { a: 0.92, b: -0.03, c: 0.01, d: 1, tx:  39.1,  ty: 3.23  };

const MAX_GAZE = 9;

const mat = ({ a, b, c, d, tx, ty }) =>
  `matrix(${a},${b},${c},${d},${tx},${ty})`;

const eyeMatrix = (base, gx = 0, gy = 0, blinkD = 1) =>
  mat({ ...base, d: base.d * blinkD, tx: base.tx + gx, ty: base.ty + gy });

const IDLE_KF = [0, -5, -1, 4, 0];

export default function BloubAvatar({
  size = 600,
  variant = "watermark",
  className = "",
}) {
  const uid = useId().replace(/:/g, "");
  const maskId     = `bloub-mask-${uid}`;
  const gradId     = `bloub-grad-${uid}`;
  const borderGrad = `bloub-border-${uid}`;

  const containerRef  = useRef(null);
  const circleWrapRef = useRef(null);
  const eye1Ref       = useRef(null);
  const eye2Ref       = useRef(null);

  const gazeRef  = useRef({ x: 0, y: 0 });
  const blinkRef = useRef(1);

  const flushEyes = () => {
    if (eye1Ref.current) {
      eye1Ref.current.setAttribute(
        "transform",
        eyeMatrix(EYE1_BASE, gazeRef.current.x, gazeRef.current.y, blinkRef.current)
      );
    }
    if (eye2Ref.current) {
      eye2Ref.current.setAttribute(
        "transform",
        eyeMatrix(EYE2_BASE, gazeRef.current.x * 0.82, gazeRef.current.y * 0.82, blinkRef.current)
      );
    }
  };

  // ─── Idle Float ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!circleWrapRef.current) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tl = gsap.timeline({ repeat: -1 });
    IDLE_KF.forEach((y, i) => {
      tl.to(circleWrapRef.current, { y, duration: 2 + i * 0.2, ease: "sine.inOut" });
    });
    return () => tl.kill();
  }, []);

  // ─── Cursor Gaze ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onMove = (e) => {
      if (!containerRef.current) return;
      const rect   = containerRef.current.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = e.clientX - cx;
      const dy     = e.clientY - cy;
      const dist   = Math.hypot(dx, dy) || 1;
      const factor = Math.min(dist / 150, 1);

      gsap.to(gazeRef.current, {
        x: (dx / dist) * factor * MAX_GAZE,
        y: (dy / dist) * factor * MAX_GAZE,
        duration: 0.55,
        ease: "power2.out",
        overwrite: true,
        onUpdate: flushEyes,
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Random Blink ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    let tid;

    const doBlink = () => {
      gsap.to(blinkRef, {
        current: 0.05,
        duration: 0.07,
        ease: "power3.in",
        onUpdate: flushEyes,
      });
      setTimeout(() => {
        gsap.to(blinkRef, {
          current: 1,
          duration: 0.14,
          ease: "power2.out",
          onUpdate: flushEyes,
        });
      }, 80);
      tid = setTimeout(doBlink, 2500 + Math.random() * 3000);
    };

    tid = setTimeout(doBlink, 1000 + Math.random() * 1500);
    return () => clearTimeout(tid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Variant styles ──────────────────────────────────────────────────────
  // "watermark" = subtle background ambient (body opacity 0.10, eyes 0.35)
  // "glass"     = visible glassmorphism circle
  // "dark"      = solid dark accent
  const isWatermark = variant === "watermark";

  const palette = {
    watermark: {
      bodyOpacity: 0.10,
      eyeOpacity:  0.35,
      outerFill:   "#e0e7ff",               // indigo-100 base (peeks through eyes)
      overlayFill: "#1e1b4b",               // deep indigo face
      borderColor: "rgba(99,102,241,0.12)",
      glowBg:      "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)",
    },
    glass: {
      bodyOpacity: 1,
      eyeOpacity:  1,
      outerFill:   "#f9f9f9",
      overlayFill: "rgba(20,18,56,0.88)",
      borderColor: "rgba(99,102,241,0.18)",
      glowBg:      "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 68%)",
    },
    dark: {
      bodyOpacity: 1,
      eyeOpacity:  1,
      outerFill:   "#1e1b4b",
      overlayFill: "#0a0a0c",
      borderColor: "rgba(99,102,241,0.25)",
      glowBg:      "radial-gradient(circle, rgba(44,30,232,0.18) 0%, transparent 65%)",
    },
  };
  const p = palette[variant] ?? palette.watermark;

  return (
    <div
      ref={containerRef}
      className={`absolute select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Soft ambient glow halo */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -40,
          borderRadius: "9999px",
          background: p.glowBg,
          filter: "blur(24px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Circle container ─────────────────────────────────────────── */}
      <div
        ref={circleWrapRef}
        style={{
          width: size,
          height: size,
          borderRadius: "9999px",
          overflow: "hidden",
          position: "relative",
          willChange: "transform",
          border: `1.5px solid ${p.borderColor}`,
        }}
      >
        <svg
          viewBox="-125 -125 250 250"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Bloub avatar"
        >
          <defs>
            {/* Soft gradient fill for the base (shows through eye holes) */}
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>

            {/* Mask: white face boundary + black eye holes */}
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="-158" y="-158" width="316" height="316"
            >
              <path d={FACE_PATH} fill="#fff" />
              <path
                ref={eye1Ref}
                d={EYE_PILL}
                transform={mat(EYE1_BASE)}
                opacity="1"
                fill="#000"
              />
              <path
                ref={eye2Ref}
                d={EYE_PILL}
                transform={mat(EYE2_BASE)}
                opacity="1"
                fill="#000"
              />
            </mask>
          </defs>

          {/* Layer 1: base colour — shows through eye holes */}
          <path
            d={FACE_PATH}
            fill={`url(#${gradId})`}
            opacity={isWatermark ? p.eyeOpacity : 1}
          />

          {/* Layer 2: face overlay — masked (eyes punched out) */}
          <g
            mask={`url(#${maskId})`}
            opacity={isWatermark ? p.bodyOpacity : p.bodyOpacity}
          >
            <rect
              x="-158" y="-158" width="316" height="316"
              fill={p.overlayFill}
            />
          </g>

          {/* Layer 3 (watermark only): faint circular border ring */}
          {isWatermark && (
            <circle
              cx="-0.47"
              cy="-0.57"
              r="99"
              fill="none"
              stroke="rgba(99,102,241,0.08)"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
