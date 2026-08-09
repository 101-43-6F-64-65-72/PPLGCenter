"use client";

import React from "react";
import FacilityCard from "./FacilityCard";
import { FacilityCardSkeleton } from "./FacilitySkeleton";
import AnimatedContent from "@/components/common/AnimatedContent";

export default function FacilitySection({
  title = "FASILITAS TEMPAT",
  items = [],
  isLoading = false,
  onItemAction,
}) {
  const skeletonGrid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
      {Array.from({ length: 4 }).map((_, idx) => (
        <FacilityCardSkeleton key={idx} />
      ))}
    </div>
  );

  return (
    <section className="w-full py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 uppercase">
              {title}
            </h2>
            {items.length > 0 && (
              <span className="bg-blue-50 text-[#2c1ee8] border border-blue-200/80 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {items.length} Tempat
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-normal">
            Pilih tempat atau ruangan sekolah yang ingin Anda cek ketersediaan dan ajukan peminjaman
          </p>
        </div>
      </div>

      {/* Grid Container wrapped in AnimatedContent */}
      <AnimatedContent isLoading={isLoading} skeleton={skeletonGrid}>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {items.map((item) => (
              <FacilityCard
                key={item.id}
                title={item.title || item.name}
                location={item.location}
                capacity={item.capacity}
                status={item.status}
                time={item.time}
                imageSrc={item.imageSrc}
                onActionClick={() => onItemAction && onItemAction(item)}
              />
            ))}
          </div>
        ) : (
          <div className="w-full text-center py-12 bg-gray-50/80 rounded-3xl border border-dashed border-gray-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2c1ee8] mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-sm">Tidak ada fasilitas tempat ditemukan</p>
            <p className="text-gray-500 text-xs mt-1">Coba gunakan kata kunci pencarian yang berbeda.</p>
          </div>
        )}
      </AnimatedContent>
    </section>
  );
}
