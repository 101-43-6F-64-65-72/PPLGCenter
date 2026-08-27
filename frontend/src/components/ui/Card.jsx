import React from "react";

export const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`bg-white rounded-none border border-slate-200 shadow-xs transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-1 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = "", ...props }) => {
  return (
    <h3 className={`text-base font-bold text-slate-900 uppercase tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = "", ...props }) => {
  return (
    <p className={`text-xs text-slate-500 font-normal leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = "", ...props }) => {
  return (
    <div className={`px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-none flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
