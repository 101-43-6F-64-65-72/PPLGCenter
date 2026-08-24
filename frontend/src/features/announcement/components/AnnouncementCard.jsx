"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Pin, Calendar, Users, ThumbsUp, MessageSquare, Edit, Trash2 } from "lucide-react";
import { resolveImageUrl, formatDate } from "@/lib/utils";
import { stripHtml } from "@/lib/sanitizer";

const getCategoryBadgeStyle = (category) => {
  if (!category) return "bg-blue-50 text-[#2C1EE8] border-blue-200";
  const cat = category.trim().toLowerCase();
  if (cat.includes("libur")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (cat.includes("ujian")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (cat.includes("osis")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (cat.includes("ekstra")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (cat.includes("akademik")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (cat.includes("prestasi") || cat.includes("lomba")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const getCategoryFallbackImage = (category, title) => {
  const text = `${category || ""} ${title || ""}`.toLowerCase();
  if (text.includes("akademik") || text.includes("ujian") || text.includes("rapor")) {
    return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80";
  }
  if (text.includes("osis") || text.includes("organisasi") || text.includes("pemilihan")) {
    return "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80";
  }
  if (text.includes("ekstra") || text.includes("basket") || text.includes("futsal") || text.includes("olahraga")) {
    return "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80";
  }
  if (text.includes("prestasi") || text.includes("lomba") || text.includes("juara")) {
    return "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop&q=80";
  }
  if (text.includes("libur")) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80";
};

export default function AnnouncementCard({
  announcement,
  onClick,
  canManage = false,
  onEdit,
  onDelete,
}) {
  if (!announcement) return null;

  const {
    id,
    title = "Pengumuman Sekolah",
    summary = "",
    content = "",
    coverImageUrl,
    imageUrl,
    image,
    category = "Pengumuman",
    createdByUserName,
    author,
    createdBy,
    createdAt,
    isPinned,
    isShowcase,
    IsShowcase,
    targetClasses,
    reactionCount,
    ReactionCount,
    reactionsCount,
    ReactionsCount,
    commentCount,
    CommentCount,
    commentsCount,
    CommentsCount,
  } = announcement;

  const inShowcase = !!(isShowcase ?? IsShowcase);
  const rawImage = coverImageUrl || imageUrl || image;
  const coverImage = (rawImage && typeof rawImage === "string" && !rawImage.includes("dummypic"))
    ? resolveImageUrl(rawImage)
    : getCategoryFallbackImage(category, title);

  const formattedDate = formatDate(createdAt);
  const authorName = createdByUserName || author || createdBy || "PPLG Center";
  const categoryBadgeClass = getCategoryBadgeStyle(category);
  const cleanSummary = stripHtml(summary || content || "Klik untuk membaca detail informasi pengumuman selengkapnya.");

  const totalReactions = reactionCount ?? ReactionCount ?? reactionsCount ?? ReactionsCount ?? 0;
  const totalComments = commentCount ?? CommentCount ?? commentsCount ?? CommentsCount ?? 0;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 transition-all duration-300 hover:border-[#2C1EE8] hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    >
      <div>
        {/* Card Cover Header */}
        <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-100">
          <Image
            src={coverImage}
            alt={title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

          {/* Badges Top Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2 p-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide border shadow-2xs ${categoryBadgeClass}`}
            >
              {category || "Pengumuman"}
            </span>

            <div className="flex items-center gap-1.5">
              {inShowcase && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#2C1EE8] text-white shadow-2xs">
                  <span>Showcase</span>
                </span>
              )}

              {isPinned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-500 text-white shadow-2xs">
                  <Pin className="w-3 h-3 fill-current" />
                  <span>Disematkan</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Announcement Meta & Title */}
        <div className="space-y-2.5">
          {/* Date & Target Class Header */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#2C1EE8] shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {targetClasses && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#2C1EE8] border border-blue-100 text-[10px] font-bold truncate max-w-[140px]">
                <Users className="w-3 h-3 shrink-0" />
                <span className="truncate">{targetClasses}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 transition-colors group-hover:text-[#2C1EE8]"
            title={title}
          >
            {title}
          </h3>

          {/* Content Excerpt */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 font-normal">
            {cleanSummary}
          </p>
        </div>
      </div>

      {/* Footer Meta & Actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Author / Engagement */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px] bg-slate-100 px-2 py-0.5 rounded-md">
            {authorName}
          </span>

          {(totalReactions > 0 || totalComments > 0) && (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
              {totalReactions > 0 && (
                <span className="inline-flex items-center gap-0.5 text-blue-600">
                  <ThumbsUp className="w-3 h-3" />
                  <span className="text-[11px]">{totalReactions}</span>
                </span>
              )}
              {totalComments > 0 && (
                <span className="inline-flex items-center gap-0.5 text-slate-600">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-[11px]">{totalComments}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Action: Button or Admin Buttons */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {canManage && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(announcement);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#2C1EE8] hover:bg-blue-50 transition-colors cursor-pointer"
                title="Edit Pengumuman"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Hapus Pengumuman"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#2C1EE8] group-hover:text-[#2013ce] transition-all cursor-pointer pl-1"
          >
            <span>Detail</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
