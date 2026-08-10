"use client";

import React from "react";
import { sanitizeHtml } from "@/lib/sanitizer";

export default function RichContentViewer({ content, className = "" }) {
  if (!content) return null;

  const sanitized = sanitizeHtml(content);

  return (
    <div
      className={`prose prose-indigo max-w-none text-gray-800 font-sans leading-relaxed text-base sm:text-lg 
        [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-gray-800
        [&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:font-black [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:tracking-tight
        [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:tracking-tight
        [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
        [&_li]:text-gray-800 [&_li]:font-medium
        [&_blockquote]:border-l-4 [&_blockquote]:border-[#2c1ee8] [&_blockquote]:bg-indigo-50/60 [&_blockquote]:p-4 [&_blockquote]:my-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:text-indigo-950 [&_blockquote]:font-medium [&_blockquote]:italic
        [&_a]:text-[#2c1ee8] [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-blue-800 [&_a]:font-semibold
        [&_hr]:my-6 [&_hr]:border-t [&_hr]:border-gray-200
        [&_code]:bg-slate-100 [&_code]:text-slate-800 [&_code]:font-mono [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-sm [&_code]:border [&_code]:border-slate-200
        ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
