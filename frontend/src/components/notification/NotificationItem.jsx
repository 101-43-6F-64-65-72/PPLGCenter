"use client";

import React from "react";
import Link from "next/link";
import { 
  Check, 
  Trash2, 
  Megaphone, 
  FileText, 
  Award, 
  Clock, 
  Lock, 
  BookOpen, 
  Calendar, 
  Settings, 
  Bell, 
  AlertTriangle, 
  AlertCircle 
} from "lucide-react";

function stripHtml(input) {
  if (!input) return "";
  let text = String(input).replace(/<[^>]*>/g, " ");

  const entityMap = {
    "&quot;": '"',
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&copy;": "©",
    "&reg;": "®",
  };

  text = text.replace(/&[a-zA-Z0-9#]+;/g, (match) => entityMap[match] || "");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function formatTimeAgo(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 60) return "Baru saja";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mnt lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} hr lalu`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} bln lalu`;
  return `${Math.floor(diffInMonths / 12)} thn lalu`;
}

export default function NotificationItem({ notification, onMarkRead, onDelete }) {
  const isRead = notification.isRead;
  const priority = notification.priority ?? 1;

  const getIcon = () => {
    switch (notification.type) {
      case 0: return <Megaphone className="w-4 h-4" />;
      case 1: return <FileText className="w-4 h-4" />;
      case 2: return <Award className="w-4 h-4" />;
      case 3: return <Clock className="w-4 h-4" />;
      case 4: return <Lock className="w-4 h-4" />;
      case 5: return <BookOpen className="w-4 h-4" />;
      case 6: return <Calendar className="w-4 h-4" />;
      case 7: return <Settings className="w-4 h-4" />;
      case 8:
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityConfig = () => {
    switch (priority) {
      case 3:
        return {
          border: "border-l-4 border-l-rose-600",
          badge: (
            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Darurat
            </span>
          ),
          unreadBg: "bg-rose-50/20 border-white/20 hover:bg-rose-50/35 hover:border-white/40",
          iconBg: "bg-rose-50 text-rose-600 border-rose-200",
          unreadDot: "bg-rose-600",
          titleColor: "text-slate-900 font-extrabold",
        };
      case 2:
        return {
          border: "border-l-4 border-l-amber-500",
          badge: (
            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Penting
            </span>
          ),
          unreadBg: "bg-amber-50/15 border-white/20 hover:bg-amber-50/25 hover:border-white/40",
          iconBg: "bg-amber-50 text-amber-700 border-amber-200",
          unreadDot: "bg-amber-500",
          titleColor: "text-slate-900 font-extrabold",
        };
      case 0:
        return {
          border: "border-l-4 border-l-slate-300",
          badge: (
            <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium px-2 py-0.5 rounded-md shrink-0">
              Rendah
            </span>
          ),
          unreadBg: "bg-white/30 border-white/20 hover:bg-white/45 hover:border-white/40",
          iconBg: "bg-slate-100 text-slate-600 border-slate-200",
          unreadDot: "bg-slate-400",
          titleColor: "text-slate-900 font-extrabold",
        };
      case 1:
      default:
        return {
          border: "border-l-4 border-l-slate-900",
          badge: (
            <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-bold px-2 py-0.5 rounded-md shrink-0">
              Normal
            </span>
          ),
          unreadBg: "bg-white/40 border-white/20 hover:bg-white/55 hover:border-white/40",
          iconBg: "bg-slate-100 text-slate-800 border-slate-200",
          unreadDot: "bg-slate-900",
          titleColor: "text-slate-900 font-extrabold",
        };
    }
  };

  const priorityConfig = getPriorityConfig();
  const formattedTime = formatTimeAgo(notification.createdAt);

  const handleClick = () => {
    if (!isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  const content = (
    <div
      onClick={handleClick}
      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${priorityConfig.border} ${
        isRead
          ? "bg-white/40 border-white/25 text-slate-700 hover:border-white/50 hover:bg-white/55 shadow-2xs"
          : `${priorityConfig.unreadBg} text-slate-900 shadow-xs`
      }`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs transition-colors ${
        isRead ? "bg-white/50 text-slate-500 border-white/30" : priorityConfig.iconBg
      }`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className={`text-xs sm:text-sm truncate ${!isRead ? priorityConfig.titleColor : "text-slate-900 font-bold"}`}>
            {stripHtml(notification.title)}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            {priorityConfig.badge}
            {!isRead && <span className={`w-2 h-2 rounded-full ${priorityConfig.unreadDot}`} />}
          </div>
        </div>
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
          {stripHtml(notification.body || notification.message)}
        </p>
        <span className="text-[10px] text-slate-400 font-medium mt-1 block">{formattedTime}</span>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {!isRead && onMarkRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onMarkRead(notification.id);
            }}
            title="Tandai Dibaca"
            className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(notification.id);
            }}
            title="Hapus Notifikasi"
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const resolveActionUrl = (rawUrl, notif) => {
    let url = rawUrl;

    const refType = notif?.referenceType;
    const type = notif?.type;
    const refId = notif?.referenceId;

    const isProposal =
      refType === 8 ||
      refType === "Proposal" ||
      type === 10 ||
      type === 19 ||
      type === 20 ||
      type === 21 ||
      type === 22;

    const isExtracurricular =
      refType === 15 ||
      refType === "Extracurricular" ||
      type === 23 ||
      type === 24;

    const isAnnouncement =
      refType === 1 ||
      refType === "Announcement" ||
      type === 0 ||
      type === 18;

    const isElection =
      refType === 17 ||
      refType === "Election" ||
      (typeof type === "number" && type >= 25 && type <= 28);

    const isGrade =
      refType === 10 ||
      refType === "StudentGrade" ||
      type === 2 ||
      type === 12 ||
      type === 13;

    const isFacility =
      refType === 7 ||
      refType === "Facility" ||
      refType === "Booking" ||
      type === 9;

    const isCalendar =
      refType === 5 ||
      refType === "AcademicEvent" ||
      type === 6;

    if (!url) {
      if (isProposal) {
        url = refId ? `/proposal?id=${refId}` : "/proposal";
      } else if (isExtracurricular) {
        url = refId ? `/ekstrakurikuler/${refId}` : "/ekstrakurikuler";
      } else if (isAnnouncement) {
        url = refId ? `/mading/${refId}` : "/mading";
      } else if (isElection) {
        url = "/dashboard";
      } else if (isGrade) {
        url = "/nilai";
      } else if (isFacility) {
        url = "/fasilitas";
      } else if (isCalendar) {
        url = "/kalender";
      }
    }

    if (!url) return null;

    if (url.startsWith("/announcements/")) {
      return url.replace("/announcements/", "/mading/");
    }
    if (url === "/announcements") {
      return "/mading";
    }
    if (url.startsWith("/proposals/")) {
      return url.replace("/proposals/", "/proposal/");
    }
    if (url === "/proposals") {
      return "/proposal";
    }
    if (url.startsWith("/extracurriculars/")) {
      return url.replace("/extracurriculars/", "/ekstrakurikuler/");
    }
    if (url === "/extracurriculars") {
      return "/ekstrakurikuler";
    }

    return url;
  };

  const targetUrl = resolveActionUrl(notification.actionUrl, notification);

  if (targetUrl) {
    return (
      <Link href={targetUrl} className="block group">
        {content}
      </Link>
    );
  }

  return <div className="group">{content}</div>;
}
