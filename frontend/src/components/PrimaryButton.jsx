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
        className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-1.5"
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
    "group inline-flex items-center justify-center gap-2.5 sm:gap-3 bg-[#2c1ee8] hover:bg-[#2013ce] text-white font-semibold text-base sm:text-lg lg:text-xl px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl shadow-sm hover:shadow-md hover:shadow-blue-600/25 transition-all duration-300 cursor-pointer active:scale-95";

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

