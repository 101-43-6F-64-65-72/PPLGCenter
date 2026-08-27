import React from "react";
import Link from "next/link";
import NotificationItem from "./NotificationItem";
import { CheckCheck, BellOff, Sparkles } from "lucide-react";

export default function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onMarkRead, onClose }) {
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-none shadow-xl z-50 overflow-hidden font-sans text-left animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="p-3.5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs uppercase tracking-tight text-slate-900">Pusat Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-50 text-[#2C1EE8] text-[9.5px] font-bold font-mono px-1.5 py-0.2 rounded-none border border-blue-200 uppercase">
              {unreadCount} baru
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-[#2C1EE8] hover:text-[#2013ce] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tandai dibaca</span>
          </button>
        )}
      </div>

      {/* List Container */}
      <div className="max-h-96 overflow-y-auto p-2.5 space-y-1.5 bg-slate-50/50">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs space-y-1">
            <BellOff className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="font-bold uppercase text-slate-700 text-xs">Belum ada notifikasi baru</p>
            <p className="text-[11px] text-slate-400">Pemberitahuan aktivitas Anda akan muncul di sini.</p>
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

      {/* Footer Link */}
      <div className="p-2.5 bg-white border-t border-slate-200 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs font-bold uppercase tracking-wider text-[#2C1EE8] hover:text-[#2013ce] block w-full py-0.5 transition-colors"
        >
          Lihat Semua Notifikasi →
        </Link>
      </div>
    </div>
  );
}
