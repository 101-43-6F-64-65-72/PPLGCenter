import React from "react";
import Link from "next/link";

export default function PrimaryButton({
  text = "Explore",
  href,
  onClick,
  className = "",
}) {
  const buttonContent = (
    <>
      <span>{text}</span>
      <svg
        className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:translate-x-1 text-blue-400 group-hover:text-white"
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
    </>
  );

  const baseClasses =
    "group relative inline-flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm sm:text-base px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl shadow-md hover:shadow-lg hover:shadow-slate-900/20 transition-all duration-200 cursor-pointer active:scale-[0.97] border border-slate-800 hover:border-slate-700 select-none";

  const combinedClasses = `${baseClasses} ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClasses}
        aria-label={text}
        onClick={onClick}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combinedClasses} aria-label={text}>
      {buttonContent}
    </button>
  );
}



