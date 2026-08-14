"use client";

import React, { useState, useEffect, useCallback } from "react";
import bookService from "@/services/bookService";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PerpustakaanPage() {
  const { isAuthenticated, user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [requestedDays, setRequestedDays] = useState(7);
  const [borrowSubmitting, setBorrowSubmitting] = useState(false);
  const [borrowMessage, setBorrowMessage] = useState(null);
  const [myRequests, setMyRequests] = useState([]);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookService.getBooks({ page: 1, pageSize: 20, category, search });
      setBooks(res?.items || res?.data?.items || []);
    } catch (err) {
      console.error("Failed to load books:", err);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  const fetchMyRequests = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await bookService.getMyBorrowRequests({ page: 1, pageSize: 10 });
      setMyRequests(res?.items || res?.data?.items || []);
    } catch (err) {
      console.error("Failed to load borrow requests:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBooks();
    fetchMyRequests();
  }, [fetchBooks, fetchMyRequests]);

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      setBorrowSubmitting(true);
      setBorrowMessage(null);
      await bookService.requestBorrow({
        bookId: selectedBook.id,
        requestedDays: parseInt(requestedDays, 10),
      });
      setBorrowMessage({ type: "success", text: "Pengajuan peminjaman berhasil dikirim!" });
      setSelectedBook(null);
      fetchBooks();
      fetchMyRequests();
    } catch (err) {
      setBorrowMessage({
        type: "error",
        text: err?.message || "Gagal mengajukan peminjaman buku.",
      });
    } finally {
      setBorrowSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full mb-3">
            Perpustakaan PPLG Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Katalog Buku & Modul Pembelajaran
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">
            Akses buku pemrograman, rekayasa perangkat lunak, dan referensi teknologi terkini.
          </p>
        </div>

        {/* Status Message Alert */}
        {borrowMessage && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
              borrowMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {borrowMessage.text}
          </div>
        )}

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
          <input
            id="book-search-input"
            type="text"
            placeholder="Cari judul buku, penulis, atau ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <select
            id="book-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Semua Kategori</option>
            <option value="Pemrograman">Pemrograman</option>
            <option value="Database">Database</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile App">Mobile App</option>
            <option value="DevOps">DevOps</option>
          </select>
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Memuat katalog buku...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-400">
            Tidak ada buku yang ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-slate-800/40 border border-slate-700/40 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-indigo-500/5 group"
              >
                <div>
                  <div className="h-44 bg-slate-900/60 rounded-xl mb-4 overflow-hidden relative flex items-center justify-center border border-slate-800">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl text-slate-700 font-bold">📖</span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                    {book.category || "Umum"}
                  </span>
                  <h3 className="font-bold text-white text-base mt-2 line-clamp-2">{book.title}</h3>
                  <p className="text-slate-400 text-xs mt-1">Penulis: {book.author}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      book.availableCopies > 0
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    Tersedia: {book.availableCopies}/{book.totalCopies}
                  </span>

                  {isAuthenticated && (
                    <button
                      id={`pinjam-btn-${book.id}`}
                      disabled={book.availableCopies <= 0}
                      onClick={() => setSelectedBook(book)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Pinjam
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Borrow Requests (For Logged in Student) */}
        {isAuthenticated && myRequests.length > 0 && (
          <div className="mt-16 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Riwayat Peminjaman Saya</h2>
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs sm:text-sm"
                >
                  <div>
                    <p className="font-bold text-white">{req.bookTitle}</p>
                    <p className="text-slate-400 text-xs">
                      Tgl Pinjam: {new Date(req.borrowDate).toLocaleDateString()} | Batas:{" "}
                      {new Date(req.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      req.status === "Approved"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : req.status === "Pending"
                        ? "bg-amber-500/20 text-amber-300"
                        : req.status === "Returned"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Borrow Request Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Pinjam Buku</h3>
            <p className="text-sm text-slate-300 mb-4">{selectedBook.title}</p>
            <form onSubmit={handleBorrowSubmit}>
              <label htmlFor="borrow-duration-input" className="block text-xs text-slate-400 mb-1">
                Durasi Peminjaman (Hari, Max 14):
              </label>
              <input
                id="borrow-duration-input"
                type="number"
                min="1"
                max="14"
                value={requestedDays}
                onChange={(e) => setRequestedDays(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mb-6 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="confirm-borrow-btn"
                  type="submit"
                  disabled={borrowSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {borrowSubmitting ? "Mengirim..." : "Konfirmasi Pinjam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
