import React from "react";

/**
 * Reusable Production Badge Component
 * Variants: success, warning, danger, info, neutral, purple
 * Sizes: sm, md
 */
export const Badge = ({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
  ...props
}) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-[#2C1EE8] border-blue-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
  };

  const dots = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-[#2C1EE8]",
    neutral: "bg-slate-400",
    purple: "bg-violet-500",
  };

  const sizes = {
    sm: "px-1.5 py-0.2 text-[9.5px] gap-1",
    md: "px-2 py-0.5 text-[11px] gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center font-bold font-mono uppercase rounded-none border ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-none ${dots[variant] || dots.neutral}`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
