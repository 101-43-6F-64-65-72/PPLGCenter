---
name: claude-dev-suite-claude-dev-suite-framer-motion
description: Framer Motion animation skill for React. Declarative physics-based animations, variants, AnimatePresence, layout transitions, gestures, drag, and scroll-driven motion.
---

# Framer Motion Skill

Framer Motion is a declarative React animation library for building physics-based, gesture-aware UI animations and transitions.

## Skill Overview & API Reference

### 1. Import Pattern (Motion v12+)
Always prefer importing motion components and tools from `"motion/react"` (or the project's `@/lib/motion` abstraction):

```jsx
import { motion, AnimatePresence } from "motion/react";
```

### 2. Core Motion Components
Replace standard HTML tags with `motion` primitives:

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Content
</motion.div>
```

### 3. Variants & Staggered Orchestration
Use variants to clean up inline styles and coordinate parent-child stagger timings:

```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function AnimatedList({ items }) {
  return (
    <motion.ul variants={containerVariants} initial="hidden" animate="visible">
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### 4. AnimatePresence for Unmount Transitions
Wrap conditional elements or routed views in `<AnimatePresence>` to animate when nodes leave the DOM:

```jsx
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50"
    >
      <motion.div
        key="modal-content"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        Modal Body
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### 5. Layout & Shared Element Animations (FLIP)
Use `layout` for automatic smooth geometry transitions, or `layoutId` for shared element hero transitions across views:

```jsx
// Smooth layout reflow on state/size change
<motion.div layout transition={{ duration: 0.3 }}>
  {expanded ? <LongContent /> : <ShortContent />}
</motion.div>

// Shared element transition between tab items
{activeTab === tab.id && (
  <motion.div
    layoutId="active-tab-pill"
    className="absolute inset-0 bg-blue-600 rounded-full"
    transition={{ type: "spring", stiffness: 500, damping: 35 }}
  />
)}
```

### 6. Gestures & Interactivity
Add intuitive hover, press, and drag interactions:

```jsx
<motion.button
  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
  whileTap={{ scale: 0.97 }}
  drag="x"
  dragConstraints={{ left: -50, right: 50 }}
  dragElastic={0.2}
  className="btn-primary"
>
  Interactive Button
</motion.button>
```

### 7. Viewport & Scroll Motion
Trigger animations when elements scroll into view:

```jsx
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function RevealOnScroll({ children }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
```

## Best Practices Checklist
- [x] Use `key` attributes on children of `<AnimatePresence>` so Motion tracks individual node identity.
- [x] Prefer CSS transform properties (`x`, `y`, `scale`, `rotate`, `opacity`) over heavy layout properties (`width`, `height`, `top`, `left`) for 60fps performance.
- [x] Check for reduced motion preferences (`useReducedMotion`) to ensure accessibility for users with motion sensitivity.
