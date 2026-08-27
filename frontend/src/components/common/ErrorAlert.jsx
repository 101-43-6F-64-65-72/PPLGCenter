import React from "react";
import { AlertCircle, X } from "@/components/common/Icons";

export const ErrorAlert = ({ title = "Perhatian", message, onClose, className = "" }) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-none bg-rose-50 border border-rose-200 text-rose-900 text-xs shadow-xs transition-all ${className}`}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold text-rose-950 uppercase tracking-tight mb-0.5 text-xs">{title}</h4>}
        <p className="text-rose-700 leading-relaxed font-normal">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="text-rose-400 hover:text-rose-700 p-0.5 rounded-none transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
