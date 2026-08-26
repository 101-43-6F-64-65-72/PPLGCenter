"use client";

import React, { useState, useEffect, useCallback } from "react";
import feedbackService from "@/services/feedbackService";
import {
  Star,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquareHeart,
  User,
  Shield,
  Lightbulb,
  Bug,
  Palette,
  Heart,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

const CATEGORIES = ["Semua", "Fitur", "Bug", "UI/UX", "Apresiasi", "Lainnya"];
const STATUSES = ["Semua", "Pending", "Reviewed", "Resolved"];

export default function AdminFeedbackTab() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Action states
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await feedbackService.getSummary();
      if (res?.data) {
        setSummary(res.data);
      }
    } catch (e) {
      console.error("Gagal mengambil ringkasan umpan balik:", e);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        category: selectedCategory !== "Semua" ? selectedCategory : undefined,
        rating: selectedRating > 0 ? selectedRating : undefined,
        status: selectedStatus !== "Semua" ? selectedStatus : undefined,
      };

      const res = await feedbackService.getFeedbacks(params);
      const data = res?.data || res;
      setFeedbacks(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (e) {
      console.error("Gagal mengambil daftar umpan balik:", e);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedRating, selectedStatus]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleUpdateStatus = async (id, newStatus, currentNotes = "") => {
    try {
      setUpdatingId(id);
      await feedbackService.updateStatus(id, {
        status: newStatus,
        adminNotes: currentNotes,
      });
      setToastMessage({ type: "success", text: `Status berhasil diubah menjadi ${newStatus}.` });
      fetchFeedbacks();
      fetchSummary();
    } catch (e) {
      setToastMessage({ type: "error", text: "Gagal memperbarui status." });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus umpan balik ini?")) {
      return;
    }

    try {
      setDeletingId(id);
      await feedbackService.deleteFeedback(id);
      setToastMessage({ type: "success", text: "Umpan balik berhasil dihapus." });
      fetchFeedbacks();
      fetchSummary();
    } catch (e) {
      setToastMessage({ type: "error", text: "Gagal menghapus umpan balik." });
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "Fitur":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Lightbulb className="w-3 h-3" /> Saran Fitur</span>;
      case "Bug":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><Bug className="w-3 h-3" /> Laporan Bug</span>;
      case "UI/UX":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Palette className="w-3 h-3" /> Desain UI/UX</span>;
      case "Apresiasi":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200"><Heart className="w-3 h-3" /> Apresiasi</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200"><MessageSquare className="w-3 h-3" /> {cat}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300"><Clock className="w-3 h-3" /> Menunggu</span>;
      case "Reviewed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300"><CheckCircle className="w-3 h-3" /> Ditinjau</span>;
      case "Resolved":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3 h-3" /> Selesai</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${
          toastMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs underline cursor-pointer">Tutup</button>
        </div>
      )}

      {/* 1. Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Masukan</span>
            <MessageSquareHeart className="w-4 h-4 text-[#2c1ee8]" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {summaryLoading ? "..." : summary?.totalCount || 0}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Dari warga sekolah</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Rata-Rata Kepuasan</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
            {summaryLoading ? "..." : `${summary?.averageRating || 5.0}`}
            <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
          </p>
          <span className="text-[11px] text-amber-600 font-bold">⭐ Skor Evaluasi</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Belum Ditinjau</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">
            {summaryLoading ? "..." : summary?.pendingCount || 0}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Perlu tindakan</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Terselesaikan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {summaryLoading ? "..." : summary?.resolvedCount || 0}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Telah ditindaklanjuti</span>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kata kunci masukan, nama, NISN/NIP..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#2c1ee8] outline-none"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchFeedbacks();
              fetchSummary();
            }}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Filter Pills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Filter Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Filter Rating
            </label>
            <select
              value={selectedRating}
              onChange={(e) => {
                setSelectedRating(Number(e.target.value));
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
            >
              <option value={0}>Semua Rating</option>
              <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
              <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
              <option value={3}>⭐⭐⭐ (3 Bintang)</option>
              <option value={2}>⭐⭐ (2 Bintang)</option>
              <option value={1}>⭐ (1 Bintang)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Filter Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Feedback Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-500">Memuat daftar umpan balik...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-800">Tidak ada umpan balik yang ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Belum ada masukan yang sesuai dengan kriteria filter atau pencarian Anda.
            </p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-blue-200 transition"
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  {getCategoryBadge(item.category)}
                  {getStatusBadge(item.status)}

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= item.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(item.createdAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              {/* Feedback Content Text */}
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                  "{item.content}"
                </p>
              </div>

              {/* Sender Identity & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                {/* Sender Tag */}
                <div className="flex items-center gap-2 text-xs">
                  {item.isAnonymous ? (
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pengirim Anonim ({item.userRole || "Siswa"})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{item.userName}</span>
                      {item.userIdentifier && (
                        <span className="text-slate-400 font-normal">({item.userIdentifier})</span>
                      )}
                      <span className="text-[10px] font-black uppercase bg-[#2c1ee8] text-white px-1.5 py-0.2 rounded">
                        {item.userRole}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Switcher & Delete Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status !== "Reviewed" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "Reviewed")}
                      disabled={updatingId === item.id}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      Tandai Ditinjau
                    </button>
                  )}

                  {item.status !== "Resolved" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "Resolved")}
                      disabled={updatingId === item.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      Tandai Selesai
                    </button>
                  )}

                  {item.status === "Resolved" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "Pending")}
                      disabled={updatingId === item.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      Reset ke Pending
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Hapus masukan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600">
          <span>Menampilkan halaman {page} dari {totalPages} ({totalItems} total masukan)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
