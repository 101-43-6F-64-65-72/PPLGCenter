import React from "react";

export function FacilityCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[220px] sm:w-[240px] h-[340px] rounded-3xl bg-gray-200 animate-pulse overflow-hidden relative border border-gray-100 flex flex-col justify-end p-5">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-gray-200/50 to-transparent" />
      <div className="relative z-10 space-y-3">
        <div className="h-6 w-3/4 bg-gray-300 rounded-md" />
        <div className="h-4 w-1/2 bg-gray-300 rounded-md" />
      </div>
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[180px] sm:w-[210px] h-[280px] rounded-3xl bg-gray-200 animate-pulse overflow-hidden relative border border-gray-100 flex flex-col justify-end p-4">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-gray-200/50 to-transparent" />
      <div className="relative z-10 space-y-2">
        <div className="h-5 w-2/3 bg-gray-300 rounded-md" />
        <div className="h-3 w-1/3 bg-gray-300 rounded-md" />
      </div>
    </div>
  );
}
