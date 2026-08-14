import React from "react";

export function FacilityCardSkeleton() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 animate-pulse">
      <div className="aspect-16/10 w-full rounded-2xl bg-slate-200" />
      <div className="space-y-2">
        <div className="h-4 w-1/3 bg-slate-200 rounded-md" />
        <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
        <div className="h-4 w-full bg-slate-100 rounded-md" />
      </div>
      <div className="h-10 w-full bg-slate-200 rounded-xl" />
    </div>
  );
}

export function ItemCardSkeleton() {
  return <FacilityCardSkeleton />;
}
