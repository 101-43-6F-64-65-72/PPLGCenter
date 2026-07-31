import React from "react";

/**
 * Reusable Production Form Input Component
 * Compatible with React Hook Form, handles labels, helper text, error messages, prefix/suffix icons.
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
      ...props
    },
    ref
  ) => {
    const isDark = variant === "dark";

    const labelStyles = isDark
      ? "text-slate-100 font-medium text-sm"
      : "text-gray-700 font-medium text-sm";

    const baseInputStyles = isDark
      ? "w-full rounded-2xl border bg-white/95 text-slate-950 px-4 py-3 text-sm outline-none transition-all focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/25 disabled:bg-slate-200 disabled:cursor-not-allowed"
      : "w-full rounded-2xl border bg-white text-gray-900 px-4 py-3 text-sm outline-none transition-all focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/20 disabled:bg-gray-100 disabled:cursor-not-allowed";

    const borderStyles = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
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

        <div className="relative w-full flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center justify-center text-gray-400 pointer-events-none">
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
            className={`${baseInputStyles} ${borderStyles} ${leftPadding} ${rightPadding} ${inputClassName}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center justify-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

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
