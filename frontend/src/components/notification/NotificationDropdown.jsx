import React from "react";
import Link from "next/link";
import NotificationItem from "./NotificationItem";

export default function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onMarkRead, onClose }) {
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
      <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-100 text-sm">Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs px-2 py-0.5 rounded-full font-medium">
              {unreadCount} baru
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto p-2 space-y-2 divide-y-0">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <span className="text-2xl mb-2 block">🔔</span>
            Belum ada notifikasi
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkRead={onMarkRead}
            />
          ))
        )}
      </div>

      <div className="p-2.5 bg-slate-800/60 border-t border-slate-700/60 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs text-slate-300 hover:text-indigo-400 font-medium block w-full py-1 transition-colors"
        >
          Lihat Semua Notifikasi →
        </Link>
      </div>
    </div>
  );
}
