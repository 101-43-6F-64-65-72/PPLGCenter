import React from "react";

export const AnnouncementDetailSkeleton = () => {
  return (
    <div className="w-full animate-pulse space-y-8">
      {/* Title Skeleton */}
      <div className="space-y-3">
        <div className="h-10 sm:h-12 w-3/4 bg-gray-200 rounded-2xl" />
        <div className="h-10 sm:h-12 w-1/2 bg-gray-200 rounded-2xl" />
      </div>

      {/* Hero Image Skeleton */}
      <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-[24px] sm:rounded-[32px] bg-gray-200" />

      {/* Paragraph Lines Skeleton */}
      <div className="space-y-4 pt-2">
        <div className="h-4 w-full bg-gray-200 rounded-full" />
        <div className="h-4 w-11/12 bg-gray-200 rounded-full" />
        <div className="h-4 w-4/5 bg-gray-200 rounded-full" />
        <div className="h-4 w-full bg-gray-200 rounded-full" />
        <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
      </div>

      {/* Bottom Date Skeleton */}
      <div className="pt-8 flex justify-end">
        <div className="h-4 w-28 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
};

export default AnnouncementDetailSkeleton;
