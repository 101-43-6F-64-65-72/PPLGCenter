import React from "react";
import TwinOrbitSpinner from "@/components/ui/TwinOrbitSpinner";

export const LoadingSpinner = ({ size = "md", color = "primary", label = null, className = "" }) => {
  return <TwinOrbitSpinner size={size} color={color} label={label} className={className} />;
};

export default LoadingSpinner;
