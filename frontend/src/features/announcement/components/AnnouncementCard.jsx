import React from "react";
import Image from "next/image";
import { ArrowRight, Pin } from "@/components/common/Icons";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { resolveImageUrl, formatDate } from "@/lib/utils";
import { stripHtml } from "@/lib/sanitizer";

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
    isPinned,
    reactionCount,
    ReactionCount,
    reactionsCount,
    ReactionsCount,
    commentCount,
    CommentCount,
    commentsCount,
    CommentsCount,
  } = announcement;

  const formattedDate = formatDate(createdAt);
  const coverImage = resolveImageUrl(announcement.coverImageUrl || imageUrl || image);
  const authorName = author || createdBy || "Redaksi Sekolah";

  const totalReactions = reactionCount ?? ReactionCount ?? reactionsCount ?? ReactionsCount ?? 0;
  const totalComments = commentCount ?? CommentCount ?? commentsCount ?? CommentsCount ?? 0;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />

          <span className="absolute top-3 left-3 bg-[#2c1ee8] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
            {category || "Pengumuman"}
          </span>

          {isPinned && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
              <Pin className="w-3 h-3 fill-current" />
              <span>Disematkan</span>
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-medium mb-2.5">
            <span>{formattedDate}</span>

            {/* Reaction & Comment Badges */}
            <div className="flex items-center gap-2">
              {totalReactions > 0 && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-[#2c1ee8] px-2 py-0.5 rounded-full border border-blue-100 text-[11px] font-bold">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{totalReactions}</span>
                </span>
              )}

              {totalComments > 0 && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 text-[11px] font-bold">
                  <MessageSquare className="w-3 h-3 text-slate-500" />
                  <span>{totalComments}</span>
                </span>
              )}
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#2c1ee8] transition-colors line-clamp-2">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-normal">
            {stripHtml(summary)}
          </p>
        </div>
      </div>

      <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-3 pt-3">
        <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
          {authorName}
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2c1ee8] group-hover:text-blue-700 transition-colors">
          <span>Baca Detail</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  );
};

export default AnnouncementCard;

