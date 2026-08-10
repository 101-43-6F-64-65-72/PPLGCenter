import React from "react";
import Link from "next/link";
import { Check, Trash2 } from "lucide-react";

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

  const getIcon = () => {
    switch (notification.type) {
      case 0: return "📢";
      case 1: return "📝";
      case 2: return "⭐";
      case 3: return "⏰";
      case 4: return "🔒";
      case 5: return "📚";
      case 6: return "📅";
      case 7: return "⚙️";
      case 8:
      default: return "🔔";
    }
  };

  const getPriorityBadge = () => {
    switch (notification.priority) {
      case 3:
        return <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 font-extrabold px-1.5 py-0.5 rounded-md">URGENT</span>;
      case 2:
        return <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.5 rounded-md">Penting</span>;
      default:
        return null;
    }
  };

  const formattedTime = formatTimeAgo(notification.createdAt);

  const handleClick = () => {
    if (!isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  const content = (
    <div
      onClick={handleClick}
      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
        isRead
          ? "bg-white border-gray-100 text-gray-700 opacity-90 hover:bg-gray-50"
          : "bg-blue-50/70 border-blue-200 text-gray-900 shadow-xs hover:border-[#2c1ee8]/40"
      }`}
    >
      <div className="text-lg shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-xs">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className={`text-xs sm:text-sm font-black truncate ${!isRead ? "text-[#2c1ee8]" : "text-gray-900"}`}>
            {notification.title}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            {getPriorityBadge()}
            {!isRead && <span className="w-2 h-2 rounded-full bg-[#2c1ee8] animate-pulse" />}
          </div>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-medium">
          {notification.body || notification.message}
        </p>
        <span className="text-[10px] text-gray-400 font-semibold mt-1 block">{formattedTime}</span>
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
            className="p-1 text-gray-400 hover:text-[#2c1ee8] hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
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
            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
