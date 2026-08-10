import React from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

/**
 * Reusable Production Button Component
 * Supports variants (primary, secondary, outline, ghost, danger/destructive), sizes (xs, sm, md, lg), loading, icons.
 */
export const Button = React.forwardRef(
  (
    {
      children,
      type = "button",
      variant = "primary",
      size = "md",
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      leftIcon = null,
      rightIcon = null,
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]";

    const variants = {
      primary:
        "bg-[#2c1ee8] hover:bg-[#2013ce] text-white shadow-sm hover:shadow-md hover:shadow-[#2c1ee8]/20 focus:ring-[#2c1ee8]",
      secondary:
        "bg-blue-50 hover:bg-blue-100 text-[#2c1ee8] focus:ring-blue-400 border border-blue-100",
      outline:
        "border border-[#2c1ee8] text-[#2c1ee8] hover:bg-[#2c1ee8] hover:text-white focus:ring-[#2c1ee8]",
      ghost:
        "text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20 focus:ring-rose-500",
      destructive:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20 focus:ring-rose-500",
    };

    const sizes = {
      xs: "text-xs px-2.5 py-1 gap-1 rounded-xl",
      sm: "text-xs px-3.5 py-1.5 gap-1.5 rounded-xl",
      md: "text-sm px-5 py-2.5 gap-2 rounded-2xl",
      lg: "text-base px-7 py-3.5 gap-2.5 rounded-2xl",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled || isLoading}
        onClick={onClick}
        className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size="sm" color={variant === "outline" || variant === "ghost" || variant === "secondary" ? "primary" : "white"} />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

