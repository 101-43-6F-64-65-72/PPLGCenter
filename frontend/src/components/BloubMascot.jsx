"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { motion } from "framer-motion";

/**
 * @typedef {'sad' | 'happy' | 'idle' | 'closed' | 'shock' | 'side' | 'peek' | 'notif'} MascotState
 */

/**
 * Expressive SVG Path & Body Motion Variants Matrix for Bloub Mascot
 */
export const mascotVariants = {
  idle: {
    path: "M -10 -12 A 10 10 0 0 1 10 -12 L 10 12 A 10 10 0 0 1 -10 12 Z",
    leftEye: { x: -24, y: 0, rotate: 0, scaleX: 1, scaleY: 1 },
    rightEye: { x: 24, y: 0, rotate: 0, scaleX: 1, scaleY: 1 },
    body: { y: 0, scaleX: 1, scaleY: 1 },
  },
  happy: {
    // Joyful crescents (⌒ ⌒) arched upward with rounded tapered ends
    path: "M -16 6 C -14 -8, 14 -8, 16 6 C 10 0, -10 0, -16 6 Z",
    leftEye: { x: -24, y: -6, rotate: 6, scaleX: 1.1, scaleY: 1.1 },
    rightEye: { x: 24, y: -6, rotate: -6, scaleX: 1.1, scaleY: 1.1 },
    body: { y: -12, scaleX: 0.96, scaleY: 1.06 },
  },
  sad: {
    // Soft drooping inverted teardrop capsules (\ /)
    path: "M -9 -14 A 9 9 0 0 1 9 -14 L 7 10 A 7 7 0 0 1 -7 10 Z",
    leftEye: { x: -22, y: 6, rotate: -16, scaleX: 0.95, scaleY: 0.85 },
    rightEye: { x: 22, y: 6, rotate: 16, scaleX: 0.95, scaleY: 0.85 },
    body: { y: 8, scaleX: 1.03, scaleY: 0.94 },
  },
  closed: {
    // Memejamkan mata (flattened horizontal slits)
    path: "M -10 -12 A 10 10 0 0 1 10 -12 L 10 12 A 10 10 0 0 1 -10 12 Z",
    leftEye: { x: -24, y: 5, rotate: 0, scaleX: 1.15, scaleY: 0.05, opacity: 0.9 },
    rightEye: { x: 24, y: 5, rotate: 0, scaleX: 1.15, scaleY: 0.05, opacity: 0.9 },
    body: { y: 2, scaleX: 0.99, scaleY: 0.98 },
  },
  shock: {
    // Wide circular open eyes
    path: "M -14 0 A 14 14 0 1 1 14 0 A 14 14 0 1 1 -14 0 Z",
    leftEye: { x: -24, y: 2, rotate: 0, scaleX: 1.08, scaleY: 1.08 },
    rightEye: { x: 24, y: 2, rotate: 0, scaleX: 1.08, scaleY: 1.08 },
    body: { y: -3, scaleX: 0.95, scaleY: 1.04 },
  },
  side: {
    // Slanted gazing pill looking left away from modal
    path: "M -9 -11 A 9 9 0 0 1 9 -11 L 9 11 A 9 9 0 0 1 -9 11 Z",
    leftEye: { x: -44, y: 2, rotate: 22, scaleX: 0.85, scaleY: 0.88 },
    rightEye: { x: -6, y: 4, rotate: 18, scaleX: 0.95, scaleY: 0.95 },
    body: { y: 0, scaleX: 1, scaleY: 1 },
  },
  peek: {
    // Peeking curiously up-right directly into the password input box with left eye wink (-)
    path: "M -10 -12 A 10 10 0 0 1 10 -12 L 10 12 A 10 10 0 0 1 -10 12 Z",
    leftEye: { x: 6, y: -16, rotate: 10, scaleX: 1.15, scaleY: 0.05, opacity: 0.9 },
    rightEye: { x: 48, y: -24, rotate: 16, scaleX: 0.92, scaleY: 0.92, opacity: 1 },
    body: { y: -4, scaleX: 0.96, scaleY: 1.04 },
  },
  notif: {
    // Excited gaze shifted up-right looking directly at top-right satellite notification badge
    path: "M -9.3 -11.3 A 9.3 9.3 0 0 1 9.3 -11.3 L 9.3 11.3 A 9.3 9.3 0 0 1 -9.3 11.3 Z",
    leftEye: { x: 13.5, y: -36.5, rotate: -19, scaleX: 0.97, scaleY: 0.95 },
    rightEye: { x: 58.8, y: -47.2, rotate: -6, scaleX: 0.81, scaleY: 0.95 },
    body: { y: -6, scaleX: 0.96, scaleY: 1.04 },
  },
};

// Standard eye variants export for backwards compatibility
export const eyeVariants = mascotVariants;

const FACE_PATH =
  "M99.9 -0.48C99.9 2.78 99.74 6.05 99.42 9.29C99.1 12.53 98.62 15.77 97.98 18.96C97.34 22.15 96.54 25.33 95.59 28.44C94.65 31.55 93.54 34.64 92.29 37.64C91.04 40.65 89.63 43.61 88.09 46.48C86.55 49.35 84.86 52.16 83.05 54.87C81.23 57.57 79.27 60.2 77.2 62.72C75.13 65.24 72.92 67.66 70.61 69.96C68.3 72.26 65.87 74.46 63.34 76.53C60.81 78.59 58.17 80.54 55.46 82.35C52.74 84.16 49.92 85.84 47.04 87.38C44.16 88.91 41.19 90.31 38.17 91.56C35.15 92.8 32.06 93.91 28.93 94.85C25.8 95.8 22.61 96.59 19.41 97.23C16.2 97.86 12.95 98.34 9.7 98.66C6.45 98.98 3.17 99.14 -0.1 99.14C-3.37 99.14 -6.65 98.98 -9.9 98.66C-13.15 98.34 -16.4 97.86 -19.61 97.23C-22.81 96.59 -26 95.8 -29.13 94.85C-32.25 93.91 -35.35 92.8 -38.37 91.56C-41.39 90.31 -44.36 88.91 -47.24 87.38C-50.12 85.84 -52.94 84.16 -55.66 82.35C-58.37 80.54 -61.01 78.59 -63.54 76.53C-66.06 74.46 -68.5 72.26 -70.81 69.96C-73.12 67.66 -75.33 65.24 -77.4 62.72C-79.47 60.2 -81.43 57.57 -83.25 54.87C-85.06 52.16 -86.75 49.35 -88.29 46.48C-89.83 43.61 -91.24 40.65 -92.49 37.64C-93.74 34.64 -94.85 31.55 -95.79 28.44C-96.74 25.33 -97.54 22.15 -98.18 18.96C-98.82 15.77 -99.3 12.53 -99.62 9.29C-99.94 6.05 -100.1 2.78 -100.1 -0.48C-100.1 -3.73 -99.94 -7 -99.62 -10.24C-99.3 -13.48 -98.82 -16.72 -98.18 -19.91C-97.54 -23.1 -96.74 -26.28 -95.79 -29.39C-94.85 -32.51 -93.74 -35.59 -92.49 -38.6C-91.24 -41.61 -89.83 -44.57 -88.29 -47.44C-86.75 -50.31 -85.06 -53.11 -83.25 -55.82C-81.43 -58.53 -79.47 -61.16 -77.4 -63.67C-75.33 -66.19 -73.12 -68.62 -70.81 -70.92C-68.5 -73.22 -66.06 -75.42 -63.54 -77.48C-61.01 -79.55 -58.37 -81.5 -55.66 -83.31C-52.94 -85.11 -50.12 -86.8 -47.24 -88.33C-44.36 -89.87 -41.39 -91.27 -38.37 -92.51C-35.35 -93.76 -32.25 -94.86 -29.13 -95.8C-26 -96.75 -22.81 -97.54 -19.61 -98.18C-16.4 -98.81 -13.15 -99.3 -9.9 -99.61C-6.65 -99.93 -3.37 -100.09 -0.1 -100.09C3.17 -100.09 6.45 -99.93 9.7 -99.61C12.95 -99.3 16.2 -98.81 19.41 -98.18C22.61 -97.54 25.8 -96.75 28.93 -95.8C32.06 -94.86 35.15 -93.76 38.17 -92.51C41.19 -91.27 44.16 -89.87 47.04 -88.33C49.92 -86.8 52.74 -85.11 55.46 -83.31C58.17 -81.5 60.81 -79.55 63.34 -77.48C65.87 -75.42 68.3 -73.22 70.61 -70.92C72.92 -68.62 75.13 -66.19 77.2 -63.67C79.27 -61.16 81.23 -58.53 83.05 -55.82C84.86 -53.11 86.55 -50.31 88.09 -47.44C89.63 -44.57 91.04 -41.61 92.29 -38.6C93.54 -35.59 94.65 -32.51 95.59 -29.39C96.54 -26.28 97.34 -23.1 97.98 -19.91C98.62 -16.72 99.1 -13.48 99.42 -10.24C99.74 -7 99.9 -3.73 99.9 -0.48Z";

const MAX_GAZE_OFFSET = 7;

/**
 * Bloub Mascot Component (Pure SVG Vector Implementation with Organic Motion)
 * Features curved crescent happy eyes (⌒ ⌒), drooping sad capsules, peaceful eyelids,
 * squash-and-stretch body physics, and locked center-point transforms.
 * 
 * @param {Object} props
 * @param {'sad' | 'happy' | 'idle' | 'closed' | 'shock' | 'side'} [props.state="sad"] - Mascot expression state
 * @param {number} [props.size=250] - Size in pixels
 * @param {boolean|number|string} [props.badge=false] - Top-right satellite indicator dot or unread count
 * @param {string} [props.badgeColor="#38bdf8"] - Satellite indicator fill color
 * @param {boolean} [props.badgePulse=true] - Enable soft pulsing aura animation for badge
 * @param {Function} [props.onClick] - Click handler
 */
export function BloubMascot({
  state = "sad",
  size = 250,
  className = "",
  interactiveGaze = true,
  enableAutoBlink = true,
  badge = false,
  badgeColor = "#38bdf8",
  badgePulse = true,
  onClick,
}) {
  const rawId = useId();
  const safeUid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `bot-mask-${safeUid}`;

  const containerRef = useRef(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // ─── Natural Periodic Auto-Blinking Effect ─────────────────────────────
  useEffect(() => {
    if (state === "closed" || !enableAutoBlink) return;

    let timeoutId;
    let blinkEndTimeoutId;

    const scheduleBlink = () => {
      const delay = Math.random() * 2500 + 3500; // Natural blink every 3.5s - 6s
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        blinkEndTimeoutId = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150); // Fast 150ms natural eye blink snap
      }, delay);
    };

    scheduleBlink();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(blinkEndTimeoutId);
    };
  }, [state, enableAutoBlink]);

  const activeState = state;
  const currentVariant = mascotVariants[activeState] || mascotVariants.sad;

  // ─── Contextual In-Place Eye Blinking (No position jump) ────────────────
  const isClosedState = state === "closed";
  const isEyeBlinking = isBlinking || isClosedState;

  const leftEyeAnim = {
    x: currentVariant.leftEye.x + gaze.x,
    y: currentVariant.leftEye.y + gaze.y + (isBlinking ? 2 : 0),
    rotate: currentVariant.leftEye.rotate,
    scaleX: isBlinking ? (currentVariant.leftEye.scaleX || 1) * 1.12 : currentVariant.leftEye.scaleX,
    scaleY: isBlinking ? 0.05 : currentVariant.leftEye.scaleY,
  };

  const rightEyeAnim = {
    x: currentVariant.rightEye.x + gaze.x * 0.88,
    y: currentVariant.rightEye.y + gaze.y * 0.88 + (isBlinking ? 2 : 0),
    rotate: currentVariant.rightEye.rotate,
    scaleX: isBlinking ? (currentVariant.rightEye.scaleX || 1) * 1.12 : currentVariant.rightEye.scaleX,
    scaleY: isBlinking ? 0.05 : currentVariant.rightEye.scaleY,
  };

  // ─── Mouse Gaze Tracking ────────────────────────────────────────────────
  useEffect(() => {
    if (!interactiveGaze || typeof window === "undefined") return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxDistance = 300;
      const factor = Math.min(dist / maxDistance, 1);

      setGaze({
        x: (dx / dist) * factor * MAX_GAZE_OFFSET,
        y: (dy / dist) * factor * MAX_GAZE_OFFSET,
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactiveGaze]);

  const springTransition = {
    type: "spring",
    stiffness: 300,
    damping: 22,
  };

  const activeTransition = isEyeBlinking
    ? { duration: 0.12, ease: "easeInOut" }
    : springTransition;

  return (
    <motion.div
      ref={containerRef}
      onClick={onClick}
      animate={{
        y: currentVariant.body.y,
        scaleX: currentVariant.body.scaleX,
        scaleY: currentVariant.body.scaleY,
      }}
      transition={springTransition}
      className={`relative select-none flex items-center justify-center ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Animated bloub avatar (${activeState})`}
    >
      {/* Inner Breathing Float Loop Container */}
      <motion.div
        animate={{
          y: [-2, 2, -2],
          scaleX: [1, 1.01, 1],
          scaleY: [1, 1.015, 1],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-full h-full flex items-center justify-center"
      >
        <svg
          width={size}
          height={size}
          viewBox="-125 -125 250 250"
          role="img"
          aria-label="Animated bloub avatar"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="-158"
              y="-158"
              width="316"
              height="316"
            >
              {/* White base mask for avatar body shape */}
              <path d={FACE_PATH} fill="#fff" />
              
              {/* Left Eye Cutout inside Mask */}
              <motion.g
                animate={leftEyeAnim}
                transition={activeTransition}
                style={{ transformBox: "fill-box", transformOrigin: "center center" }}
              >
                <motion.path
                  d={currentVariant.path}
                  fill="#000"
                  animate={{ d: currentVariant.path }}
                  transition={activeTransition}
                />
              </motion.g>

              {/* Right Eye Cutout inside Mask */}
              <motion.g
                animate={rightEyeAnim}
                transition={activeTransition}
                style={{ transformBox: "fill-box", transformOrigin: "center center" }}
              >
                <motion.path
                  d={currentVariant.path}
                  fill="#000"
                  animate={{ d: currentVariant.path }}
                  transition={activeTransition}
                />
              </motion.g>
            </mask>
          </defs>

          <g opacity="1">
            {/* Base Mascot Body Fill */}
            <path d={FACE_PATH} fill="#f9f9f9" />
            
            {/* Masked Dark Inner Body */}
            <g mask={`url(#${maskId})`}>
              <rect x="-158" y="-158" width="316" height="316" fill="#0a0a0c" />
            </g>
          </g>

          {/* ─── Satellite Badge / Indicator (Top-Right Combo) ─── */}
          {badge !== undefined && badge !== false && badge !== null && (
            <g className="satellite-badge-group">
              {/* Continuous Pulsing Aura Ring */}
              {badgePulse && (
                <motion.circle
                  cx="68"
                  cy="-68"
                  r={typeof badge === "number" || typeof badge === "string" ? 22 : 14}
                  fill={badgeColor}
                  opacity={0.35}
                  animate={{ scale: [1, 1.45, 1], opacity: [0.35, 0, 0.35] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Solid Satellite Dot with White Border */}
              <circle
                cx="68"
                cy="-68"
                r={
                  typeof badge === "number"
                    ? badge > 9
                      ? 20
                      : 16
                    : typeof badge === "string"
                    ? 20
                    : 12
                }
                fill={badgeColor}
                stroke="#ffffff"
                strokeWidth="3.5"
              />

              {/* Numeric / Text Badge Label */}
              {(typeof badge === "number" || typeof badge === "string") && (
                <text
                  x="68"
                  y="-62"
                  textAnchor="middle"
                  fontSize={
                    typeof badge === "number"
                      ? badge > 99
                        ? "13"
                        : badge > 9
                        ? "15"
                        : "17"
                      : "14"
                  }
                  fontWeight="900"
                  fill="#ffffff"
                  className="select-none pointer-events-none font-sans"
                >
                  {typeof badge === "number" ? (badge > 99 ? "99+" : badge) : badge}
                </text>
              )}
            </g>
          )}
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default BloubMascot;
