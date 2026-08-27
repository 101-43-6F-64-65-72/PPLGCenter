import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * Reusable Production Select Dropdown Component
 * Styled identically to Input.jsx with label, error, helper text, and left icon.
 */
export const Select = React.forwardRef(
  (
    {
      label,
      name,
      children,
      error = null,
      helperText = null,
      leftIcon = null,
      isDisabled = false,
      isRequired = false,
      className = "",
      selectClassName = "",
      options = [], // Array of { value, label } or standard children <option>
      placeholder = "Pilih...",
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const baseSelectStyles =
      "w-full rounded-none border bg-white text-slate-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none transition-colors appearance-none cursor-pointer focus:border-[#2C1EE8] disabled:bg-slate-100 disabled:cursor-not-allowed";

    const borderStyles = error
      ? "border-rose-500 focus:border-rose-500"
      : "border-slate-200 hover:border-slate-300";

    const leftPadding = leftIcon ? "pl-9" : "";

    return (
      <div className={`w-full flex flex-col gap-1 ${className}`}>
        {label && (
          <label htmlFor={name} className="flex items-center gap-1 text-slate-700 font-bold uppercase tracking-wider text-xs">
            <span>{label}</span>
            {isRequired && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}

        <div className="relative w-full flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center justify-center text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={isDisabled}
            className={`${baseSelectStyles} ${borderStyles} ${leftPadding} pr-9 ${selectClassName}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {children
              ? children
              : options.map((opt) => (
                  <option key={opt.value ?? opt.id ?? opt} value={opt.value ?? opt.id ?? opt}>
                    {opt.label ?? opt.name ?? opt}
                  </option>
                ))}
          </select>

          <div className="absolute right-3 flex items-center justify-center text-slate-400 pointer-events-none">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {error && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
