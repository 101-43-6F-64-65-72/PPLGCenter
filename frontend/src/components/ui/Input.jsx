"use client";

import React, { useState } from "react";

let motionImport = null;
try {
  const m = require("motion/react");
  motionImport = m.motion;
} catch (e) {
  try {
    const f = require("framer-motion");
    motionImport = f.motion;
  } catch (e2) {}
}

const FallbackDiv = React.forwardRef(({ children, className, style, onClick }, ref) => (
  <div ref={ref} className={className} style={style} onClick={onClick}>
    {children}
  </div>
));
FallbackDiv.displayName = "FallbackDiv";

const MotionDiv = motionImport?.div || FallbackDiv;

/**
 * Reusable Production Form Input Component
 * Compatible with React Hook Form, handles labels, helper text, error messages, prefix/suffix icons.
 * Features smooth spring morphing focus ring and icon micro-animations on typing.
 */
export const Input = React.forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder = "",
      error = null,
      helperText = null,
      leftIcon = null,
      rightIcon = null,
      isDisabled = false,
      isRequired = false,
      className = "",
      inputClassName = "",
      variant = "light", // 'light' for default white bg, 'dark' for dark cards
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    ref
  ) => {
    const isDark = variant === "dark";
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(props.value || props.defaultValue));

    const handleFocus = (e) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    const handleChange = (e) => {
      setHasValue(Boolean(e.target.value));
      if (onChange) onChange(e);
    };

    const labelStyles = isDark
      ? "text-slate-100 font-medium text-sm"
      : "text-gray-700 font-medium text-sm";

    const baseInputStyles = isDark
      ? "w-full rounded-2xl border bg-white/95 text-slate-950 px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/25 disabled:bg-slate-200 disabled:cursor-not-allowed"
      : "w-full rounded-2xl border bg-white text-gray-900 px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/20 disabled:bg-gray-100 disabled:cursor-not-allowed";

    const borderStyles = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : isFocused
      ? "border-[#2c1ee8]"
      : isDark
      ? "border-white/20"
      : "border-gray-200 hover:border-gray-300";

    const leftPadding = leftIcon ? "pl-11" : "";
    const rightPadding = rightIcon ? "pr-11" : "";

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label htmlFor={name} className={`flex items-center gap-1 ${labelStyles}`}>
            <span>{label}</span>
            {isRequired && <span className="text-red-500 font-bold">*</span>}
          </label>
        )}

        <MotionDiv
          animate={{
            scale: isFocused ? 1.015 : 1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative w-full flex items-center group"
        >
          {/* Animated Morphing Ambient Border Glow Ring */}
          {isFocused && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="absolute -inset-0.5 rounded-[18px] bg-gradient-to-r from-[#2c1ee8] via-indigo-500 to-blue-400 opacity-60 blur-xs pointer-events-none"
            />
          )}

          {leftIcon && (
            <MotionDiv
              animate={{
                scale: isFocused || hasValue ? 1.15 : 1,
                rotate: isFocused ? [0, -6, 0] : 0,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="absolute left-3.5 z-20 flex items-center justify-center text-slate-400 pointer-events-none"
            >
              {leftIcon}
            </MotionDiv>
          )}

          <input
            ref={ref}
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            disabled={isDisabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={`relative z-10 ${baseInputStyles} ${borderStyles} ${leftPadding} ${rightPadding} ${inputClassName}`}
            {...props}
          />

          {rightIcon && (
            <MotionDiv
              animate={{
                scale: isFocused ? 1.08 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="absolute right-3.5 z-20 flex items-center justify-center text-slate-400"
            >
              {rightIcon}
            </MotionDiv>
          )}
        </MotionDiv>

        {error && <p className="text-xs font-medium text-red-500 mt-0.5">{error}</p>}
        {!error && helperText && (
          <p className={isDark ? "text-xs text-slate-300" : "text-xs text-gray-500"}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
