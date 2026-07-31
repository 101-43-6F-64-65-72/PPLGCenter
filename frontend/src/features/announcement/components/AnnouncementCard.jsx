import React from "react";
import Image from "next/image";
import { ArrowRight, Clock, Star } from "@/components/common/Icons";
import { resolveImageUrl, formatDate } from "@/lib/utils";

export const AnnouncementCard = ({ announcement, onClick }) => {
  const {
    id,
    title,
    summary,
    image,
    imageUrl,
    category,
    author,
    createdBy,
    createdAt,
    readTime = "4 Min",
    rating = "4.9 ★",
  } = announcement;

  const formattedDate = formatDate(createdAt);
  const coverImage = resolveImageUrl(imageUrl || image);
  const authorName = author || createdBy || "Redaksi Sekolah";

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 hover:border-blue-300 rounded-[22px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2 group cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />

          <span className="absolute top-3 left-3 bg-[#1d4ed8] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
            {category || "Pengumuman"}
          </span>

          {rating && (
            <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-300" />
              {rating}
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2.5">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {readTime} baca
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mb-3 group-hover:text-[#1d4ed8] transition-colors line-clamp-2">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3 font-normal">
            {summary}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6 pt-0 flex items-center justify-between border-t border-gray-100 mt-4">
        <span className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
          {authorName}
        </span>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1d4ed8] group-hover:text-[#153e90] transition-colors">
          <span>Baca Detail</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  );
};

export default AnnouncementCard;
