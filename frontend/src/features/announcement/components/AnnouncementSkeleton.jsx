import React from "react";

export const AnnouncementSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-gray-100 rounded-[22px] overflow-hidden shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="aspect-[16/10] w-full bg-gray-200" />
            <div className="p-5 sm:p-6 space-y-3">
              <div className="h-3 w-1/3 bg-gray-200 rounded-full" />
              <div className="h-5 w-5/6 bg-gray-200 rounded-lg" />
              <div className="h-5 w-4/6 bg-gray-200 rounded-lg" />
              <div className="h-3 w-full bg-gray-100 rounded-full mt-2" />
              <div className="h-3 w-4/5 bg-gray-100 rounded-full" />
            </div>
          </div>
          <div className="p-5 sm:p-6 pt-0 flex justify-between border-t border-gray-50 mt-4">
            <div className="h-3 w-1/4 bg-gray-200 rounded-full" />
            <div className="h-3 w-1/6 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementSkeleton;
