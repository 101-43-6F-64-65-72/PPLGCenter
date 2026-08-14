import React from "react";
import { AlertCircle, X } from "@/components/common/Icons";

export const ErrorAlert = ({ title = "Terjadi Kesalahan", message, onClose, className = "" }) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm shadow-sm transition-all ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h4 className="font-semibold text-red-900 mb-0.5">{title}</h4>}
        <p className="text-red-700 leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
