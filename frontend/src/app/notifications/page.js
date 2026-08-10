"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Bell, Send, CheckCheck, X } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import NotificationItem from "@/components/notification/NotificationItem";
import AuthGuard from "@/components/layout/AuthGuard";
import TwinOrbitSpinner from "@/components/ui/TwinOrbitSpinner";

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
        if (isMounted) {
          const items = res?.data?.items || res?.items || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
          const total = res?.data?.totalCount || res?.totalCount || items.length;
          setNotifications(items);
          setTotalPages(Math.ceil((total || 0) / 10) || 1);
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
      const items = res?.data?.items || res?.items || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      const total = res?.data?.totalCount || res?.totalCount || items.length;
      setNotifications(items);
      setTotalPages(Math.ceil((total || 0) / 10) || 1);
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
      <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-6">
          {/* Header */}
          <PageHeader
            icon={Bell}
            title="Pusat Notifikasi"
            description="Kelola dan pantau seluruh notifikasi dan pengumuman aktivitas Anda."
            badge={<Badge variant="info">Pemberitahuan System</Badge>}
            actions={
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleMarkAllRead}
                  leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
                >
                  Tandai Semua Dibaca
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setBroadcastModalOpen(true)}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Kirim Broadcast
                </Button>
              </>
            }
          />

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-xs text-gray-500 font-bold">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 outline-none focus:border-[#2c1ee8]"
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
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 outline-none focus:border-[#2c1ee8]"
            >
              <option value="">Semua Status</option>
              <option value="unread">Belum Dibaca</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-xs gap-3">
              <TwinOrbitSpinner size="lg" color="primary" />
              <p className="text-xs font-bold text-gray-500 animate-pulse">Memuat notifikasi Anda...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 space-y-2 shadow-xs">
              <span className="text-4xl block mb-1">📭</span>
              <h3 className="text-base font-extrabold text-gray-900">Tidak ada notifikasi</h3>
              <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto">
                Anda telah membaca seluruh notifikasi atau belum ada pemberitahuan baru yang cocok dengan filter.
              </p>
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
            <div className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition cursor-pointer"
              >
                ← Halaman Sebelumnya
              </button>
              <span className="text-xs font-extrabold text-gray-700">
                Halaman {page} dari {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition cursor-pointer"
              >
                Halaman Selanjutnya →
              </button>
            </div>
          )}
        </main>

        <Footer />

        {/* Broadcast Modal */}
        {broadcastModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span className="text-xl">📢</span>
                  <span>Kirim Broadcast Notifikasi (Admin)</span>
                </h3>
                <button
                  onClick={() => setBroadcastModalOpen(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Judul Notifikasi *</label>
                  <input
                    type="text"
                    required
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#2c1ee8] focus:bg-white font-medium"
                    placeholder="Contoh: Pengumuman Libur Nasional Hari Raya"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Pesan / Detail Notifikasi *</label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastForm.body}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-3.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#2c1ee8] focus:bg-white font-medium leading-relaxed"
                    placeholder="Tuliskan detail pesan broadcast kepada pengguna..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Target Pengguna</label>
                    <select
                      value={broadcastForm.targetRole}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#2c1ee8]"
                    >
                      <option value="">Semua User (Global)</option>
                      <option value="Student">Siswa (Student)</option>
                      <option value="Teacher">Guru (Teacher)</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tingkat Prioritas</label>
                    <select
                      value={broadcastForm.priority}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#2c1ee8]"
                    >
                      <option value={0}>Rendah (Low)</option>
                      <option value={1}>Normal</option>
                      <option value={2}>Tinggi (High)</option>
                      <option value={3}>Darurat (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tujuan Tautan / Action URL (Opsional)</label>
                  <input
                    type="text"
                    value={broadcastForm.actionUrl}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, actionUrl: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#2c1ee8] focus:bg-white font-medium"
                    placeholder="Contoh: /announcements"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setBroadcastModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBroadcast}
                    className="px-6 py-2.5 rounded-2xl bg-[#2c1ee8] text-white text-xs font-bold hover:bg-[#2013ce] transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submittingBroadcast ? (
                      <>
                        <TwinOrbitSpinner size="xs" color="white" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Broadcast</span>
                      </>
                    )}
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
