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
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80",
    info: "bg-blue-50 text-[#2c1ee8] border-blue-200/80",
    neutral: "bg-gray-100 text-gray-600 border-gray-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200/80",
  };

  const dots = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-[#2c1ee8]",
    neutral: "bg-gray-400",
    purple: "bg-violet-500",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-full border ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant] || dots.neutral}`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
