import React from 'react';

export default function FloatingBadge({ text, position }) {
  // Define positions according to Figma design layout
  const positionClasses = {
    'top-right': '-top-3 -right-3 sm:-top-4 sm:-right-6 z-20',
    'middle-left': 'top-1/2 -translate-y-1/2 -left-5 sm:-left-10 z-20',
    'bottom-right': 'bottom-8 -right-3 sm:-right-6 z-20',
  };

  // Define speech bubble tail positions
  const tailClasses = {
    'top-right': 'absolute -bottom-2 left-2 w-3.5 h-3.5 bg-[#fff] rotate-45 rounded-sm',
    'middle-left': 'absolute top-1/2 -translate-y-1/2 -right-1 w-3.5 h-3.5 bg-[#fff] rotate-45 rounded-sm',
    'bottom-right': 'absolute top-1/2 -translate-y-1/2 -left-1 w-3.5 h-3.5 bg-[#fff] rotate-45 rounded-sm',
  };

  return (
    <div className={`absolute ${positionClasses[position] || ''} select-none`}>
      <div className="relative bg-[#a4b7fc] text-[#060d29] font-medium text-xs sm:text-sm px-4 py-2 rounded-2xl shadow-sm border border-emerald-200/40 flex items-center justify-center">
        <span>{text}</span>
        {/* Speech bubble tail */}
        <div className={tailClasses[position] || ''} />
      </div>
    </div>
  );
}
