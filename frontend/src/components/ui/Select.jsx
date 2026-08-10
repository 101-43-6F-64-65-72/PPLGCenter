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
      "w-full rounded-2xl border bg-white text-gray-900 px-4 py-3 text-xs sm:text-sm font-semibold outline-none transition-all appearance-none cursor-pointer focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/20 disabled:bg-gray-100 disabled:cursor-not-allowed";

    const borderStyles = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-200 hover:border-gray-300";

    const leftPadding = leftIcon ? "pl-11" : "";

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label htmlFor={name} className="flex items-center gap-1 text-gray-700 font-semibold text-xs sm:text-sm">
            <span>{label}</span>
            {isRequired && <span className="text-red-500 font-bold">*</span>}
          </label>
        )}

        <div className="relative w-full flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center justify-center text-gray-400 pointer-events-none">
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
            className={`${baseSelectStyles} ${borderStyles} ${leftPadding} pr-10 ${selectClassName}`}
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

          <div className="absolute right-3.5 flex items-center justify-center text-gray-400 pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && <p className="text-xs font-medium text-red-500 mt-0.5">{error}</p>}
        {!error && helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
