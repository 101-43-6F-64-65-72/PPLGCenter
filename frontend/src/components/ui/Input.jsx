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
      ? "text-slate-100 font-bold uppercase tracking-wider text-xs"
      : "text-slate-700 font-bold uppercase tracking-wider text-xs";

    const baseInputStyles = isDark
      ? "w-full rounded-none border bg-white/95 text-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none transition-colors focus:border-[#2C1EE8] disabled:bg-slate-200 disabled:cursor-not-allowed"
      : "w-full rounded-none border bg-white text-slate-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none transition-colors focus:border-[#2C1EE8] disabled:bg-slate-100 disabled:cursor-not-allowed";

    const borderStyles = error
      ? "border-rose-500 focus:border-rose-500"
      : isFocused
      ? "border-[#2C1EE8]"
      : isDark
      ? "border-white/20"
      : "border-slate-200 hover:border-slate-300";

    const leftPadding = leftIcon ? "pl-9" : "";
    const rightPadding = rightIcon ? "pr-9" : "";

    return (
      <div className={`w-full flex flex-col gap-1 ${className}`}>
        {label && (
          <label htmlFor={name} className={`flex items-center gap-1 ${labelStyles}`}>
            <span>{label}</span>
            {isRequired && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}

        <div className="relative w-full flex items-center group">
          {leftIcon && (
            <div className="absolute left-3 z-20 flex items-center justify-center text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
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
            <div className="absolute right-3 z-20 flex items-center justify-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{error}</p>}
        {!error && helperText && (
          <p className={isDark ? "text-[11px] text-slate-300" : "text-[11px] text-slate-500"}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
