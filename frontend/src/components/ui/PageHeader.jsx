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
  return (
    <div className={`bg-white border border-slate-200 rounded-none p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left w-full overflow-hidden ${className}`}>
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {IconComp && (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-blue-50 text-[#2C1EE8] flex items-center justify-center border border-blue-200 shrink-0 font-bold">
            {React.isValidElement(IconComp) ? IconComp : <IconComp className="w-4 h-4 text-[#2C1EE8]" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 uppercase tracking-tight break-words">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-xs text-slate-500 font-normal mt-0.5 break-words line-clamp-2 sm:line-clamp-none">{description}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0 w-full sm:w-auto">{actions}</div>}
    </div>
  );
};

export default PageHeader;

