"use client";

import React, { useRef } from "react";
import Link from "next/link";
import FacilityCard from "./FacilityCard";
import ItemCard from "./ItemCard";
import { FacilityCardSkeleton, ItemCardSkeleton } from "./FacilitySkeleton";

export default function FacilitySection({
  title = "TEMPAT",
  seeAllHref = "#",
  items = [],
  type = "facility", // 'facility' | 'item'
  isLoading = false,
  onItemAction,
  onSeeAllClick,
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="w-full py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5 px-1 sm:px-2">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 uppercase">
          {title}
        </h2>

        <div className="flex items-center gap-3">
          {/* Scroll Navigation Buttons for Desktop */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
              aria-label="Scroll Kiri"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
              aria-label="Scroll Kanan"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <Link
            href={seeAllHref}
            onClick={(e) => {
              if (onSeeAllClick) {
                e.preventDefault();
                onSeeAllClick();
              }
            }}
            className="group flex items-center gap-1.5 text-base sm:text-lg font-semibold text-[#2c1ee8] hover:text-[#2218a3] transition-colors cursor-pointer"
          >
            <span>Lihat semua</span>
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 px-1 sm:px-2 scrollbar-none scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading ? (
          // Render Skeletons
          Array.from({ length: 4 }).map((_, idx) =>
            type === "facility" ? (
              <FacilityCardSkeleton key={idx} />
            ) : (
              <ItemCardSkeleton key={idx} />
            )
          )
        ) : items.length > 0 ? (
          items.map((item) =>
            type === "facility" ? (
              <FacilityCard
                key={item.id}
                title={item.title}
                time={item.time}
                status={item.status}
                imageSrc={item.imageSrc}
                onActionClick={() => onItemAction && onItemAction(item)}
              />
            ) : (
              <ItemCard
                key={item.id}
                title={item.title}
                category={item.category}
                stock={item.stock}
                status={item.status}
                imageSrc={item.imageSrc}
                onActionClick={() => onItemAction && onItemAction(item)}
              />
            )
          )
        ) : (
          <div className="w-full text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">Tidak ada data {title.toLowerCase()} ditemukan.</p>
          </div>
        )}
      </div>
    </section>
  );
}
