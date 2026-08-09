import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Banner & Header Card Skeleton */}
      <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
        <div className="relative h-56 sm:h-60 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 flex items-center justify-between px-8">
          <div className="space-y-3 z-10 w-full max-w-md">
            <Skeleton className="h-6 w-3/4 bg-white/20 rounded-lg" />
            <Skeleton className="h-4 w-1/2 bg-white/10 rounded-md" />
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-5">
              {/* Avatar Skeleton */}
              <div className="relative h-28 w-28 rounded-full border-4 border-white bg-gray-200 sm:h-32 sm:w-32 shrink-0">
                <Skeleton className="h-full w-full rounded-full" />
              </div>

              {/* User Meta Skeleton */}
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left space-y-3.5">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Skeleton className="h-8 w-48 rounded-xl" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-56 rounded-md" />
              </div>
            </div>

            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Academic Info Card Skeleton */}
      <div className="rounded-[24px] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
        <Skeleton className="h-4 w-36 rounded-md mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50/80">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Profile Form Card Skeleton */}
      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8 space-y-6">
        {/* Navigation Tabs Skeleton */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Fields Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-6 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
