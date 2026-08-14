import React from "react";

/**
 * Reusable Production Page / Section Header Component
 * Standardizes title typography, description, icon container, badge, and right-side action buttons.
 */
export const PageHeader = ({
  icon: IconComp,
  title,
  description,
  badge = null,
  actions = null,
  variant = "light", // 'light' | 'navy' | 'executive'
  className = "",
}) => {
  if (variant === "navy" || variant === "executive") {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071225] via-[#0b1630] to-[#2c1ee8] p-6 sm:p-8 text-white shadow-lg border border-white/10 ${className}`}>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            {IconComp && (
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md text-amber-300 flex items-center justify-center border border-white/20 shrink-0 shadow-md">
                {React.isValidElement(IconComp) ? IconComp : <IconComp className="w-6 h-6 text-amber-300" />}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
                {badge}
              </div>
              {description && <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1 max-w-2xl">{description}</p>}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100/80 ${className}`}>
      <div className="flex items-start sm:items-center gap-3.5">
        {IconComp && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-[#2c1ee8] flex items-center justify-center border border-blue-100 shrink-0 shadow-xs">
            {React.isValidElement(IconComp) ? IconComp : <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-[#2c1ee8]" />}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
