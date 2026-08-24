"use client";

import React from "react";
import { sanitizeHtml } from "@/lib/sanitizer";

export default function RichContentViewer({ content, className = "" }) {
  if (!content) return null;

  const sanitized = sanitizeHtml(content);

  return (
    <div
      className={`prose prose-indigo max-w-none text-gray-900 font-sans leading-relaxed text-base sm:text-lg lg:text-xl
        [&_p]:mb-5 [&_p]:leading-relaxed [&_p]:text-gray-800 [&_p]:text-base [&_p]:sm:text-lg [&_p]:lg:text-xl
        [&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:lg:text-4xl [&_h1]:font-black [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight
        [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:lg:text-3xl [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight
        [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-5 [&_h3]:mb-2
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ul]:space-y-2
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_ol]:space-y-2
        [&_li]:text-gray-800 [&_li]:font-medium [&_li]:text-base [&_li]:sm:text-lg
        [&_blockquote]:border-l-4 [&_blockquote]:border-[#2C1EE8] [&_blockquote]:bg-blue-50/60 [&_blockquote]:p-5 [&_blockquote]:my-5 [&_blockquote]:rounded-r-2xl [&_blockquote]:text-slate-900 [&_blockquote]:font-medium [&_blockquote]:italic [&_blockquote]:text-base [&_blockquote]:sm:text-lg
        [&_a]:text-[#2C1EE8] [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-blue-800 [&_a]:hover:underline [&_a]:font-bold [&_a]:break-all [&_a]:cursor-pointer [&_a]:transition-colors
        [&_hr]:my-8 [&_hr]:border-t [&_hr]:border-gray-200
        [&_code]:bg-slate-100 [&_code]:text-slate-800 [&_code]:font-mono [&_code]:px-2.5 [&_code]:py-1 [&_code]:rounded-md [&_code]:text-sm [&_code]:sm:text-base [&_code]:border [&_code]:border-slate-200
        ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
