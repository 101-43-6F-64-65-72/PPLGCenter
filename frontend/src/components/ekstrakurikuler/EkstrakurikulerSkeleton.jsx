import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export function EkstrakurikulerSkeleton({ categoriesCount = 2, itemsPerCategory = 3 }) {
  return (
    <div className="space-y-12 w-full animate-fadeIn">
      {Array.from({ length: categoriesCount }).map((_, catIdx) => (
        <section key={catIdx} className="space-y-6">
          {/* Category Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200/80 pb-3 gap-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-8 w-44 rounded-md" />
              </div>
              <Skeleton className="h-4 w-72 rounded-md" />
            </div>
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: itemsPerCategory }).map((_, cardIdx) => (
              <div
                key={cardIdx}
                className="flex flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4"
              >
                {/* Image Placeholder */}
                <Skeleton className="h-48 w-full rounded-2xl" />

                {/* Badge & Schedule */}
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>

                {/* Title */}
                <Skeleton className="h-6 w-3/4 rounded-md" />

                {/* Description lines */}
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3.5 w-5/6 rounded-md" />
                </div>

                {/* Footer / Info */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default EkstrakurikulerSkeleton;
