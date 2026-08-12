"use client";

import React from "react";
import { motion } from "@/lib/motion";

export default function ChalkboardOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 opacity-[0.16]">
      {/* 1. Top-Left Mathematical Formula: Integration & Exponential */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: [0, -8, 0] }}
        transition={{
          opacity: { duration: 1.2, delay: 0.2 },
          y: { duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        }}
        className="absolute top-12 left-8 sm:left-16 font-mono text-xs sm:text-sm text-blue-900 tracking-wider font-semibold select-none"
      >
        <svg width="220" height="70" viewBox="0 0 220 70" fill="none" className="stroke-blue-600/80">
          <text x="10" y="30" fill="#2c1ee8" fontSize="13" fontFamily="monospace" fontWeight="600" opacity="0.85">
            ∫₀^∞ e^(-x²) dx = √π / 2
          </text>
          <text x="10" y="55" fill="#3b82f6" fontSize="11" fontFamily="monospace" opacity="0.7">
            ∇ × B = μ₀ J + μ₀ε₀ (∂E/∂t)
          </text>
        </svg>
      </motion.div>

      {/* 2. Top-Right Chalk Sine Wave Oscillator Graph */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { duration: 1.4, delay: 0.4 },
          y: { duration: 7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        }}
        className="absolute top-16 right-10 sm:right-24"
      >
        <svg width="200" height="90" viewBox="0 0 200 90" fill="none">
          {/* XY Axes */}
          <path d="M 10 45 L 190 45 M 100 10 L 100 80" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.6" />
          {/* Axis Labels */}
          <text x="180" y="40" fill="#2c1ee8" fontSize="10" fontFamily="monospace">x</text>
          <text x="105" y="20" fill="#2c1ee8" fontSize="10" fontFamily="monospace">y</text>
          {/* Sine Curve */}
          <path
            d="M 10 45 Q 32.5 15, 55 45 T 100 45 T 145 45 T 190 45"
            stroke="#2c1ee8"
            strokeWidth="1.75"
            strokeOpacity="0.8"
            fill="none"
          />
          {/* Formula Label */}
          <text x="20" y="80" fill="#1e3a8a" fontSize="10" fontFamily="monospace" fontWeight="bold">
            f(x) = A · sin(ωt + φ)
          </text>
        </svg>
      </motion.div>

      {/* 3. Middle-Right Parabola Graph & Vector Diagram */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 1.5, delay: 0.6 },
          y: { duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        }}
        className="absolute top-1/2 right-4 sm:right-12 -translate-y-1/2 hidden md:block"
      >
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
          {/* Parabola Curve */}
          <path d="M 20 20 Q 90 130, 160 20" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" strokeOpacity="0.75" fill="none" />
          {/* Vertex Point */}
          <circle cx="90" cy="75" r="3" fill="#2c1ee8" opacity="0.8" />
          {/* Coordinate grid tick marks */}
          <line x1="90" y1="20" x2="90" y2="120" stroke="#93c5fd" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
          <text x="100" y="80" fill="#1e3a8a" fontSize="10" fontFamily="monospace">
            V(h,k) = (0, y₀)
          </text>
          <text x="25" y="130" fill="#2c1ee8" fontSize="11" fontFamily="monospace" fontWeight="600">
            y = a(x - h)² + k
          </text>
        </svg>
      </motion.div>

      {/* 4. Bottom-Left Geometry Right Triangle & Trigonometry Formula */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, 9, 0] }}
        transition={{
          opacity: { duration: 1.3, delay: 0.5 },
          y: { duration: 6.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        }}
        className="absolute bottom-16 left-6 sm:left-20"
      >
        <svg width="210" height="100" viewBox="0 0 210 100" fill="none">
          {/* Triangle Path */}
          <path d="M 20 80 L 140 80 L 140 20 Z" stroke="#2c1ee8" strokeWidth="1.5" strokeOpacity="0.75" fill="none" />
          {/* Right Angle Marker */}
          <path d="M 128 80 L 128 68 L 140 68" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
          {/* Angle Arc θ */}
          <path d="M 45 80 A 25 25 0 0 0 38 68" stroke="#2c1ee8" strokeWidth="1" fill="none" opacity="0.7" />
          <text x="50" y="74" fill="#2c1ee8" fontSize="10" fontFamily="monospace">θ</text>
          {/* Labels */}
          <text x="70" y="95" fill="#1e3a8a" fontSize="10" fontFamily="monospace">a (alas)</text>
          <text x="145" y="55" fill="#1e3a8a" fontSize="10" fontFamily="monospace">b</text>
          <text x="70" y="45" fill="#2c1ee8" fontSize="10" fontFamily="monospace">c (hipotenusa)</text>
          <text x="10" y="20" fill="#2c1ee8" fontSize="11" fontFamily="monospace" fontWeight="bold">
            a² + b² = c² | cos(θ) = a/c
          </text>
        </svg>
      </motion.div>

      {/* 5. Center-Left Quantum Energy & Limit Formula */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, y: [0, -7, 0] }}
        transition={{
          opacity: { duration: 1.6, delay: 0.7 },
          y: { duration: 7.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        }}
        className="absolute top-1/2 left-4 sm:left-10 -translate-y-1/2 hidden md:block"
      >
        <svg width="190" height="90" viewBox="0 0 190 90" fill="none">
          <text x="10" y="30" fill="#2c1ee8" fontSize="13" fontFamily="monospace" fontWeight="bold" opacity="0.85">
            E = mc² = h·f
          </text>
          <text x="10" y="55" fill="#3b82f6" fontSize="11" fontFamily="monospace" opacity="0.75">
            lim_(x→0) (sin x / x) = 1
          </text>
          <text x="10" y="78" fill="#1e40af" fontSize="10" fontFamily="monospace" opacity="0.65">
            ∑_(n=1)^∞ (1/n²) = π²/6
          </text>
        </svg>
      </motion.div>
    </div>
  );
}
