"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { 
  Bell, 
  Send, 
  CheckCheck, 
  X, 
  Inbox, 
  Megaphone, 
  Edit3, 
  Trash2, 
  Users, 
  Radio 
} from "lucide-react";
import { notificationService } from "@/services/notificationService";
import NotificationItem from "@/components/notification/NotificationItem";
import AuthGuard from "@/components/layout/AuthGuard";
import TwinOrbitSpinner from "@/components/ui/TwinOrbitSpinner";
import useAuth from "@/hooks/useAuth";

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

export default function NotificationsPage() {
  const { user, role } = useAuth();
  
  // Authorization check for broadcast management (Admin or Teacher)
  const isAuthorized =
    role === "Admin" ||
    role === "Teacher" ||
    user?.role === "Admin" ||
    user?.role === "Teacher" ||
    user?.role === 0 ||
    user?.role === 1 ||
    String(user?.role || "").toLowerCase().includes("teacher") ||
    String(user?.role || "").toLowerCase().includes("admin");

  const [activeTab, setActiveTab] = useState("my"); // "my" | "broadcasts"

  // User Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterRead, setFilterRead] = useState("");

  // Broadcast List state
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

  // Broadcast Form Modal state
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(null); // null if creating, broadcast obj if editing
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    body: "",
    type: 8,
    priority: 1,
    targetRole: "",
    actionUrl: "",
  });
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [actionError, setActionError] = useState("");

  // Fetch My Notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 10 };
      if (filterType !== "") params.type = filterType;
      if (filterRead !== "") params.isRead = filterRead === "read";

      const res = await notificationService.getNotifications(params);
      const rawData = res?.data?.items || res?.items || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      const items = Array.isArray(rawData) ? rawData : [];
      const total = res?.data?.totalCount || res?.totalCount || items.length;
      setNotifications(items);
      setTotalPages(Math.ceil((total || 0) / 10) || 1);
    } catch (err) {
      console.error("Failed to fetch notifications:", err?.message || err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Broadcast List (for authorized roles)
  const fetchBroadcasts = async () => {
    if (!isAuthorized) return;
    setLoadingBroadcasts(true);
    try {
      const res = await notificationService.getBroadcasts();
      const rawItems = res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
      const items = Array.isArray(rawItems) ? rawItems : [];
      setBroadcasts(items);
    } catch (err) {
      console.error("Failed to fetch broadcast list:", err?.message || err);
      setBroadcasts([]);
    } finally {
      setLoadingBroadcasts(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (activeTab === "my") {
      fetchNotifications();
    } else if (activeTab === "broadcasts" && isAuthorized) {
      fetchBroadcasts();
    }
  }, [page, filterType, filterRead, activeTab, isAuthorized]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err?.message || err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err?.message || err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err?.message || err);
    }
  };

  const openCreateModal = () => {
    setEditingBroadcast(null);
    setBroadcastForm({
      title: "",
      body: "",
      type: 8,
      priority: 1,
      targetRole: "",
      actionUrl: "",
    });
    setActionError("");
    setBroadcastModalOpen(true);
  };

  const openEditModal = (b) => {
    const isCreator = user?.id && b?.createdByUserId && user.id.toLowerCase() === b.createdByUserId.toLowerCase();
    if (!isCreator) {
      alert(`Hanya pembuat broadcast (${b.createdByName || "pembuat asal"}) yang dapat mengedit broadcast ini.`);
      return;
    }

    setEditingBroadcast(b);
    setBroadcastForm({
      title: b.title || "",
      body: b.body || "",
      type: b.type ?? 8,
      priority: b.priority ?? 1,
      targetRole: b.targetRole || "",
      actionUrl: b.actionUrl || "",
    });
    setActionError("");
    setBroadcastModalOpen(true);
  };

  const handleSaveBroadcast = async (e) => {
    e.preventDefault();
    setSubmittingBroadcast(true);
    setActionError("");

    const payload = {
      title: broadcastForm.title.trim(),
      body: broadcastForm.body.trim(),
      type: Number(broadcastForm.type) || 8,
      priority: Number(broadcastForm.priority) ?? 1,
      targetRole: broadcastForm.targetRole ? broadcastForm.targetRole : null,
      actionUrl: broadcastForm.actionUrl ? broadcastForm.actionUrl.trim() : null,
    };

    try {
      if (editingBroadcast) {
        // Edit mode
        const res = await notificationService.updateBroadcast(editingBroadcast.broadcastId, payload);
        const isSuccess = res?.statusCode === 200 || res?.status === 200 || res?.success || res?.message?.toLowerCase()?.includes("success") || res?.message?.toLowerCase()?.includes("berhasil");

        if (isSuccess) {
          setBroadcastModalOpen(false);
          await fetchBroadcasts();
        } else {
          setActionError(res?.message || "Gagal memperbarui broadcast.");
        }
      } else {
        // Create mode
        const res = await notificationService.broadcast(payload);
        const isSuccess = res?.statusCode === 200 || res?.status === 200 || res?.success || res?.message?.toLowerCase()?.includes("success") || res?.message?.toLowerCase()?.includes("berhasil");

        if (isSuccess) {
          setBroadcastModalOpen(false);
          await fetchBroadcasts();
          await fetchNotifications();
        } else {
          setActionError(res?.message || "Gagal mengirim broadcast.");
        }
      }
    } catch (err) {
      console.error("Broadcast operation failed:", err?.message || err);
      setActionError(err?.message || err?.response?.data?.message || "Terjadi kesalahan saat mengirim broadcast.");
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  const handleDeleteBroadcast = async (b) => {
    const isCreator = user?.id && b?.createdByUserId && user.id.toLowerCase() === b.createdByUserId.toLowerCase();
    const isAdmin = role === "Admin" || user?.role === "Admin" || user?.role === 0;

    if (!isCreator && !isAdmin) {
      alert("Anda tidak memiliki izin untuk menghapus broadcast ini.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus broadcast "${b.title}"?`)) {
      return;
    }

    try {
      await notificationService.deleteBroadcast(b.broadcastId);
      await fetchBroadcasts();
    } catch (err) {
      console.error("Failed to delete broadcast:", err?.message || err);
      alert(err?.message || err?.response?.data?.message || "Gagal menghapus broadcast.");
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
            badge={<Badge variant="info">Pemberitahuan Sistem</Badge>}
            actions={
              <>
                {activeTab === "my" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleMarkAllRead}
                    leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
                  >
                    Tandai Semua Dibaca
                  </Button>
                )}
                {isAuthorized && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateModal}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Kirim Broadcast Baru
                  </Button>
                )}
              </>
            }
          />

          {/* Role-based Navigation Sub-Tabs */}
          {isAuthorized && (
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("my")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "my"
                    ? "bg-[#2c1ee8] text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Notifikasi Saya</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("broadcasts")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "broadcasts"
                    ? "bg-[#2c1ee8] text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Kelola Broadcast ({broadcasts.length})</span>
              </button>
            </div>
          )}

          {/* TAB 1: Notifikasi Saya */}
          {activeTab === "my" && (
            <>
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
                  <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
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
            </>
          )}

          {/* TAB 2: Kelola Broadcast (Khusus Admin & Guru) */}
          {activeTab === "broadcasts" && isAuthorized && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#2c1ee8] text-white rounded-xl shadow-xs">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-indigo-950">
                      Daftar Broadcast Terkirim
                    </h3>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      Edit broadcast hanya dapat dilakukan oleh pembuatnya. Admin & Guru dapat mengelola pesan broadcast sekolah.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openCreateModal}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Kirim Broadcast
                </Button>
              </div>

              {loadingBroadcasts ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-xs gap-3">
                  <TwinOrbitSpinner size="lg" color="primary" />
                  <p className="text-xs font-bold text-gray-500 animate-pulse">Memuat daftar broadcast...</p>
                </div>
              ) : broadcasts.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 space-y-2 shadow-xs">
                  <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-base font-extrabold text-gray-900">Belum Ada Broadcast</h3>
                  <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto">
                    Belum ada pengumuman broadcast yang dikirim ke pengguna. Klik tombol di atas untuk membuat broadcast baru.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map((b) => {
                    const isCreator = user?.id && b?.createdByUserId && user.id.toLowerCase() === b.createdByUserId.toLowerCase();
                    const isAdmin = role === "Admin" || user?.role === "Admin" || user?.role === 0;

                    return (
                      <div
                        key={b.broadcastId}
                        className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-3 hover:border-gray-200 transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              {b.createdByName || "Pembuat Sesi"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">•</span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {new Date(b.createdAt).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                              {b.recipientCount} Penerima
                            </span>
                            {b.targetRole && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-bold px-2 py-0.5 rounded-full">
                                Target: {b.targetRole}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(b)}
                              disabled={!isCreator}
                              title={isCreator ? "Edit broadcast ini" : `Hanya pembuat (${b.createdByName}) yang dapat mengedit`}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isCreator
                                  ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            {(isCreator || isAdmin) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBroadcast(b)}
                                title="Hapus broadcast ini"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-black text-gray-900 mb-1">
                            {stripHtml(b.title)}
                          </h4>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                            {stripHtml(b.body)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        <Footer />

        {/* Broadcast Modal (Create & Edit) */}
        {broadcastModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#2c1ee8]" />
                  <span>{editingBroadcast ? "Edit Broadcast Notifikasi" : "Kirim Broadcast Notifikasi"}</span>
                </h3>
                <button
                  onClick={() => setBroadcastModalOpen(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleSaveBroadcast} className="space-y-4">
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
                      disabled={!!editingBroadcast}
                      value={broadcastForm.targetRole}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#2c1ee8] disabled:opacity-60 cursor-pointer"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#2c1ee8] cursor-pointer"
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
                    placeholder="Contoh: /mading"
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
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{editingBroadcast ? "Simpan Perubahan" : "Kirim Broadcast"}</span>
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
