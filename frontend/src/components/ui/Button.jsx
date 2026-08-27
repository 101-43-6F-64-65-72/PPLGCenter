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
      "inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-none transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variants = {
      primary:
        "bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white shadow-xs",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200",
      outline:
        "border border-[#2C1EE8] text-[#2C1EE8] hover:bg-[#2C1EE8] hover:text-white",
      ghost:
        "text-slate-700 hover:bg-slate-100",
      danger:
        "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs",
      destructive:
        "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs",
    };

    const sizes = {
      xs: "text-[10px] px-2 py-1 gap-1",
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-xs px-4 py-2 gap-2",
      lg: "text-sm px-6 py-2.5 gap-2",
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


