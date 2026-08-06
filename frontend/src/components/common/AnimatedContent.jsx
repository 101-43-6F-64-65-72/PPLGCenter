"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";

/**
 * AnimatedContent - Reusable smooth transition wrapper component for loading states.
 * Fades out skeleton and gracefully slides/fades in content without layout jumps.
 *
 * @param {boolean} isLoading - Whether data is currently loading
 * @param {boolean} loading - Alias for isLoading
 * @param {React.ReactNode} skeleton - Skeleton element to display while loading
 * @param {React.ReactNode} children - Content to display after loading completes
 * @param {string} className - Optional container styling
 * @param {number} delay - Short buffer delay in ms before showing content (default: 180ms)
 */
export default function AnimatedContent({
  isLoading = false,
  loading,
  skeleton = null,
  children,
  className = "",
  delay = 180,
}) {
  const activeLoading = loading !== undefined ? loading : isLoading;
  const [showContent, setShowContent] = useState(!activeLoading);

  useEffect(() => {
    let timer;
    if (activeLoading) {
      setShowContent(false);
    } else {
      timer = setTimeout(() => {
        setShowContent(true);
      }, delay);
    }
    return () => clearTimeout(timer);
  }, [activeLoading, delay]);

  return (
    <div className={`relative w-full ${className}`}>
      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full"
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
