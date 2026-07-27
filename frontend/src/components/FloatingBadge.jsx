import React from 'react';

export default function FloatingBadge({ text, position }) {
  // Define positions according to Figma design layout
  const positionClasses = {
    'top-right': '-top-4 -right-4 sm:-top-5 sm:-right-8 z-20',
    'middle-left': 'top-1/2 -translate-y-1/2 -left-6 sm:-left-12 z-20',
    'bottom-right': 'bottom-10 -right-4 sm:-right-8 z-20',
  };

  // Define speech bubble tail positions
  const tailClasses = {
    'top-right': 'absolute -bottom-2 left-3 w-4 h-4 bg-[#DCFCE7] rotate-45 rounded-sm',
    'middle-left': 'absolute top-1/2 -translate-y-1/2 -right-1.5 w-4 h-4 bg-[#DCFCE7] rotate-45 rounded-sm',
    'bottom-right': 'absolute top-1/2 -translate-y-1/2 -left-1.5 w-4 h-4 bg-[#DCFCE7] rotate-45 rounded-sm',
  };

  return (
    <div className={`absolute ${positionClasses[position] || ''} select-none`}>
      <div className="relative bg-[#DCFCE7] text-[#166534] font-medium text-sm sm:text-base px-5 py-2.5 rounded-2xl shadow-sm border border-emerald-200/40 flex items-center justify-center">
        <span>{text}</span>
        {/* Speech bubble tail */}
        <div className={tailClasses[position] || ''} />
      </div>
    </div>
  );
}
