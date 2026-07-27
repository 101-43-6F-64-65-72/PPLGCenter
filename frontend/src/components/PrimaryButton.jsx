import React from "react";

export default function PrimaryButton({ text = "Explore", onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-3 bg-[#00B929] hover:bg-[#009E23] text-white font-semibold text-xl lg:text-2xl px-9 py-4 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
      aria-label={text}
    >
      <span>{text}</span>
      <svg
        className="w-6 h-6 lg:w-7 lg:h-7 stroke-[2.5]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
        />
      </svg>
    </button>
  );
}
