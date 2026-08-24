"use client";

import React from "react";

/**
 * High-fidelity Skeleton loader matching FacilityCard
 */
export function FacilityCardSkeleton() {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-4 animate-pulse">
      <div>
        {/* Card Cover Image Skeleton */}
        <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-md bg-slate-200 flex flex-col justify-between p-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-16 bg-slate-300 rounded-md" />
            <div className="h-5 w-14 bg-slate-300 rounded-md" />
          </div>
        </div>

        {/* Location & Title Skeleton */}
        <div className="space-y-2.5 mb-3">
          <div className="h-3 w-1/3 bg-slate-100 rounded-md" />
          <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full bg-slate-100 rounded-md" />
            <div className="h-3.5 w-4/5 bg-slate-100 rounded-md" />
          </div>
        </div>

        {/* Specs Metadata Skeleton */}
        <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
          <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
          <div className="h-3 w-2/5 bg-slate-100 rounded-md" />
        </div>
      </div>

      {/* Action Button Skeleton */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="h-9 w-full bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export function ItemCardSkeleton() {
  return <FacilityCardSkeleton />;
}
