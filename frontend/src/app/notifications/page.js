"use client";

import React, { useState, useEffect } from "react";
import { notificationService } from "@/services/notificationService";
import NotificationItem from "@/components/notification/NotificationItem";
import AuthGuard from "@/components/layout/AuthGuard";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterRead, setFilterRead] = useState("");
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    body: "",
    type: 8, // General
    priority: 1, // Normal
    targetRole: "",
    actionUrl: "",
  });
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const params = { page, pageSize: 10 };
        if (filterType !== "") params.type = filterType;
        if (filterRead !== "") params.isRead = filterRead === "read";

        const res = await notificationService.getNotifications(params);
        if (isMounted && res?.data) {
          setNotifications(res.data.items || []);
          setTotalPages(Math.ceil((res.data.totalCount || 0) / 10) || 1);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [page, filterType, filterRead]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 10 };
      if (filterType !== "") params.type = filterType;
      if (filterRead !== "") params.isRead = filterRead === "read";

      const res = await notificationService.getNotifications(params);
      if (res?.data) {
        setNotifications(res.data.items || []);
        setTotalPages(Math.ceil((res.data.totalCount || 0) / 10) || 1);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setSubmittingBroadcast(true);
    try {
      await notificationService.broadcast(broadcastForm);
      setBroadcastModalOpen(false);
      setBroadcastForm({ title: "", body: "", type: 8, priority: 1, targetRole: "", actionUrl: "" });
      fetchNotifications();
    } catch (err) {
      console.error("Broadcast failed", err);
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🔔</span> Pusat Notifikasi
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Kelola dan pantau seluruh notifikasi dan pengumuman aktivitas Anda
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all"
              >
                Tandai Semua Dibaca
              </button>
              <button
                onClick={() => setBroadcastModalOpen(true)}
                className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
              >
                <span>📢</span> Kirim Broadcast
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Semua Tipe</option>
              <option value="0">Pengumuman</option>
              <option value="1">Tugas</option>
              <option value="2">Nilai Tugas</option>
              <option value="3">Presensi Dibuka</option>
              <option value="4">Presensi Ditutup</option>
              <option value="5">Materi Pembelajaran</option>
              <option value="6">Agenda Akademik</option>
              <option value="7">Sistem</option>
              <option value="8">Umum</option>
            </select>

            <select
              value={filterRead}
              onChange={(e) => { setFilterRead(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Semua Status</option>
              <option value="unread">Belum Dibaca</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm animate-pulse">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <span className="text-4xl block">📭</span>
              <h3 className="text-base font-semibold text-slate-200">Tidak ada notifikasi</h3>
              <p className="text-xs text-slate-500">Anda telah membaca seluruh notifikasi atau tidak ada data yang cocok dengan filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                ← Sebelumnya
              </button>
              <span className="text-xs text-slate-400">
                Halaman {page} dari {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </div>

        {/* Broadcast Modal */}
        {broadcastModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📢</span> Kirim Broadcast Notifikasi
                </h3>
                <button
                  onClick={() => setBroadcastModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Judul Notifikasi *</label>
                  <input
                    type="text"
                    required
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Contoh: Pengumuman Libur Nasional"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Pesan / Body *</label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastForm.body}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Tuliskan detail pesan broadcast..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Target Role</label>
                    <select
                      value={broadcastForm.targetRole}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Semua User</option>
                      <option value="Student">Siswa (Student)</option>
                      <option value="Teacher">Guru (Teacher)</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Prioritas</label>
                    <select
                      value={broadcastForm.priority}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value={0}>Rendah (Low)</option>
                      <option value={1}>Normal</option>
                      <option value={2}>Tinggi (High)</option>
                      <option value={3}>Darurat (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Action URL (Opsional)</label>
                  <input
                    type="text"
                    value={broadcastForm.actionUrl}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, actionUrl: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Contoh: /announcements"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBroadcast}
                    className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {submittingBroadcast ? "Sending..." : "Kirim Sekarang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
