"use client";

import React from "react";

export function AnnouncementCardSkeleton() {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 animate-pulse">
      <div>
        {/* Cover Skeleton */}
        <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-slate-200 p-3 flex justify-between">
          <div className="h-5 w-20 bg-slate-300 rounded-md" />
          <div className="h-5 w-16 bg-slate-300 rounded-md" />
        </div>

        {/* Meta & Title Skeleton */}
        <div className="space-y-3 mb-3">
          <div className="flex justify-between">
            <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
            <div className="h-3.5 w-20 bg-slate-200 rounded-md" />
          </div>
          <div className="h-5 w-4/5 bg-slate-200 rounded-md" />
          <div className="h-5 w-3/5 bg-slate-200 rounded-md" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full bg-slate-100 rounded-md" />
            <div className="h-3 w-4/5 bg-slate-100 rounded-md" />
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <div className="h-4 w-24 bg-slate-200 rounded-md" />
        <div className="h-4 w-16 bg-slate-200 rounded-md" />
      </div>
    </div>
  );
}

export default function AnnouncementSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <AnnouncementCardSkeleton key={idx} />
      ))}
    </div>
  );
}
