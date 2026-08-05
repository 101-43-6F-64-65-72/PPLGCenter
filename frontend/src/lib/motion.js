"use client";

import React from "react";

/**
 * Universal Motion (motion.dev) Module
 * Imports motion and AnimatePresence from "motion/react" per project animation guidelines.
 */
let motionImport = null;
let animatePresenceImport = null;

try {
  const motionReact = require("motion/react");
  motionImport = motionReact.motion;
  animatePresenceImport = motionReact.AnimatePresence;
} catch (e) {
  try {
    const framer = require("framer-motion");
    motionImport = framer.motion;
    animatePresenceImport = framer.AnimatePresence;
  } catch (e2) {
    // Native fallback proxy while hydration completes
  }
}

// Fallback Motion Proxy Component Generator
const createMotionProxy = () => {
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        const MotionComponent = React.forwardRef(({ children, className, style, onClick, ...props }, ref) => {
          const Tag = prop || "div";
          // Filter out motion-specific props if native Motion module is hydrating
          const cleanProps = { ...props };
          delete cleanProps.initial;
          delete cleanProps.animate;
          delete cleanProps.exit;
          delete cleanProps.transition;
          delete cleanProps.variants;

          return (
            <Tag ref={ref} className={className} style={style} onClick={onClick} {...cleanProps}>
              {children}
            </Tag>
          );
        });
        MotionComponent.displayName = `MotionProxy(${prop || "div"})`;
        return MotionComponent;
      },
    }
  );
};

export const motion = motionImport || createMotionProxy();
export const AnimatePresence = animatePresenceImport || (({ children }) => <>{children}</>);

export default { motion, AnimatePresence };
