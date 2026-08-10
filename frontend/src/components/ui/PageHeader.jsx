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
  className = "",
}) => {
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
