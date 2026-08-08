import React from "react";
import Link from "next/link";

function formatTimeAgo(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 60) return "Baru saja";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} hari yang lalu`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} bulan yang lalu`;
  return `${Math.floor(diffInMonths / 12)} tahun yang lalu`;
}

export default function NotificationItem({ notification, onMarkRead, onDelete }) {
  const isRead = notification.isRead;

  // Render icon based on type or icon prop
  const getIcon = () => {
    switch (notification.type) {
      case 0: // Announcement
        return "📢";
      case 1: // Assignment
        return "📝";
      case 2: // AssignmentGraded
        return "⭐";
      case 3: // AttendanceOpened
        return "⏰";
      case 4: // AttendanceClosed
        return "🔒";
      case 5: // MaterialPublished
        return "📚";
      case 6: // AcademicEvent
        return "📅";
      case 7: // System
        return "⚙️";
      case 8: // General
      default:
        return "🔔";
    }
  };

  const getPriorityBadge = () => {
    switch (notification.priority) {
      case 3: // Urgent
        return <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded">URGENT</span>;
      case 2: // High
        return <span className="text-[10px] bg-amber-500/20 text-amber-400 font-medium px-1.5 py-0.5 rounded">Penting</span>;
      default:
        return null;
    }
  };

  const formattedTime = formatTimeAgo(notification.createdAt);

  const content = (
    <div
      className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
        isRead
          ? "bg-slate-800/40 border-slate-700/50 opacity-80"
          : "bg-slate-800 border-indigo-500/30 shadow-md hover:border-indigo-500/60"
      }`}
    >
      <div className="text-xl shrink-0 p-2 rounded-lg bg-slate-700/50">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className={`text-sm font-semibold text-slate-100 truncate ${!isRead ? "text-indigo-300" : ""}`}>
            {notification.title}
          </h4>
          <div className="flex items-center gap-1 shrink-0">
            {getPriorityBadge()}
            {!isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
          </div>
        </div>
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{notification.body || notification.message}</p>
        <span className="text-[11px] text-slate-400 mt-1.5 block">{formattedTime}</span>
      </div>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isRead && onMarkRead && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onMarkRead(notification.id);
            }}
            title="Tandai Dibaca"
            className="p-1 text-slate-400 hover:text-indigo-400 text-xs"
          >
            ✓
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(notification.id);
            }}
            title="Hapus"
            className="p-1 text-slate-400 hover:text-red-400 text-xs"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block group">
        {content}
      </Link>
    );
  }

  return <div className="group">{content}</div>;
}
