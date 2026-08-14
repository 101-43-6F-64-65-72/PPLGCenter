import React from "react";
import Skeleton from "./Skeleton";

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              {Array.from({ length: cols }).map((_, idx) => (
                <th key={idx} className="px-6 py-4">
                  <Skeleton className="h-4 w-24 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: cols }).map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    {colIdx === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-32 rounded" />
                      </div>
                    ) : (
                      <Skeleton className="h-4 w-28 rounded" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableSkeleton;
