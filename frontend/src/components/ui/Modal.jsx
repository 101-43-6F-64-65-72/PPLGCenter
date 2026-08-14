import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Reusable Production Modal / Dialog Component
 * Props: isOpen, onClose, title, description, size ('sm', 'md', 'lg', 'xl', 'max'), children, footer
 */
export const Modal = ({
  isOpen = true,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  className = "",
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    max: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 w-full my-auto transition-all transform scale-100 ${sizes[size] || sizes.md} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5 gap-4">
            <div>
              {title && <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>}
              {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                type="button"
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="space-y-4">{children}</div>

        {/* Footer Actions */}
        {footer && (
          <div className="border-t border-gray-100 pt-4 mt-6 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
