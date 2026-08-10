import React from "react";
import Link from "next/link";
import NotificationItem from "./NotificationItem";
import { CheckCheck, BellOff } from "lucide-react";

export default function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onMarkRead, onClose }) {
  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-100 rounded-3xl shadow-2xl z-50 overflow-hidden font-sans animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-4 bg-[#2c1ee8] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-sm tracking-tight">Pusat Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="bg-[#2c1ee8] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
              {unreadCount} baru
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-blue-200 hover:text-white font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tandai dibaca</span>
          </button>
        )}
      </div>

      {/* List Container */}
      <div className="max-h-96 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-xs space-y-1">
            <BellOff className="w-8 h-8 text-gray-300 mx-auto mb-1" />
            <p className="font-bold text-gray-700">Belum ada notifikasi baru</p>
            <p className="text-[11px] text-gray-400">Pemberitahuan aktivitas Anda akan muncul di sini.</p>
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
      <div className="p-3 bg-white border-t border-gray-100 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs font-black text-[#2c1ee8] hover:text-[#2013ce] block w-full py-1 transition-colors"
        >
          Lihat Semua Notifikasi →
        </Link>
      </div>
    </div>
  );
}
