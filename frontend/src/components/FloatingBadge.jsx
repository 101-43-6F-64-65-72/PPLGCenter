"use client";

import React from "react";
import { motion } from "@/lib/motion";

export default function FloatingBadge({
  text,
  subtext,
  position,
  icon: Icon,
  delay = 0,
}) {
  const positionClasses = {
    "top-right": "-top-3 -right-3 sm:-top-5 sm:-right-5 z-20",
    "middle-left": "top-1/2 -translate-y-1/2 -left-3 sm:-left-6 z-20",
    "bottom-right": "bottom-6 -right-3 sm:-right-5 z-20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -6],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: {
          duration: 4,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
          delay: delay + 0.3,
        },
      }}
      className={`absolute ${positionClasses[position] || ""} select-none`}
    >
      <div className="bg-white/95 backdrop-blur-md text-gray-900 border border-slate-200/80 shadow-lg shadow-slate-900/5 px-4 py-2.5 rounded-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-200">
        {Icon && (
          <div className="flex items-center justify-center h-8.5 w-8.5 rounded-xl bg-blue-50/90 text-[#2c1ee8] shrink-0 border border-blue-100/60">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
            {text}
          </span>
          {subtext && (
            <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

