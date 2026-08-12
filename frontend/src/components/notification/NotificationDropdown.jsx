import React from "react";
import Link from "next/link";
import NotificationItem from "./NotificationItem";
import { CheckCheck, BellOff, Sparkles } from "lucide-react";

export default function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onMarkRead, onClose }) {
  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/70 backdrop-blur-xl border border-white/40 rounded-[28px] shadow-2xl shadow-blue-900/15 z-50 overflow-hidden font-sans ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-4 bg-white/60 backdrop-blur-md border-b border-white/20 text-slate-800 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2c1ee8]" />
          <h3 className="font-extrabold text-sm tracking-tight text-slate-900">Pusat Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="bg-[#2c1ee8]/10 text-[#2c1ee8] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#2c1ee8]/20">
              {unreadCount} baru
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-[#2c1ee8] hover:text-blue-800 font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tandai dibaca</span>
          </button>
        )}
      </div>

      {/* List Container */}
      <div className="max-h-96 overflow-y-auto p-3 space-y-2.5 bg-white/30 backdrop-blur-sm">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs space-y-1">
            <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="font-bold text-slate-700">Belum ada notifikasi baru</p>
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
      <div className="p-3 bg-white/50 backdrop-blur-md border-t border-slate-100/50 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs font-extrabold text-[#2c1ee8] hover:text-indigo-800 block w-full py-1 transition-colors"
        >
          Lihat Semua Notifikasi →
        </Link>
      </div>
    </div>
  );
}
