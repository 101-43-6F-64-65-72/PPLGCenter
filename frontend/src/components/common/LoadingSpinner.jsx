import React from "react";

export const LoadingSpinner = ({ size = "md", color = "primary", className = "" }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3",
    xl: "w-16 h-16 border-4",
  };

  const colors = {
    primary: "border-[#2c1ee8] border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-400 border-t-transparent",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full ${sizes[size] || sizes.md} ${colors[color] || colors.primary} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;
