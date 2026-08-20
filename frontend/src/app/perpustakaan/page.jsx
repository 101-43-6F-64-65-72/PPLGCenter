"use client";

import React, { useState, useEffect, useCallback } from "react";
import libraryService from "@/services/libraryService";
import schoolClassService from "@/services/schoolClassService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Folder, FolderPlus, BookOpen, CheckCircle2, XCircle, Clock, Search, ShieldCheck,
  ChevronRight, ExternalLink, MapPin, Globe, Plus, Trash2, Eye, Mail, Lock, Users, Sparkles, Filter,
  Upload, Image as ImageIcon, Calendar, AlertCircle
} from "lucide-react";

export default function PerpustakaanPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("explorer"); // 'explorer' | 'myBorrowings' | 'teacherInbox'

  // Navigation & Folder Stack (Google Drive Breadcrumbs)
  const [folderStack, setFolderStack] = useState([]); // Array of { id, name }
  const currentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;

  // Folder & Book Data
  const [folders, setFolders] = useState([]);
  const [books, setBooks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [alertMessage, setAlertMessage] = useState(null);

  // Available Classes for Targeted Visibility Selection
  const [classesList, setClassesList] = useState([]);

  // Modals State
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [newFolderVisibility, setNewFolderVisibility] = useState("Public"); // "Public" | "TeachersOnly" | "TargetedClasses"
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  // Book Creation Modal State
  const [createBookModalOpen, setCreateBookModalOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookIsbn, setBookIsbn] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");
  const [bookPubYear, setBookPubYear] = useState("");
  const [bookSynopsis, setBookSynopsis] = useState("");
  const [bookTotalCopies, setBookTotalCopies] = useState(1);
  const [bookCoverUrl, setBookCoverUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [bookLocationType, setBookLocationType] = useState("Offline"); // "Offline" | "Digital"
  const [bookLocationDetails, setBookLocationDetails] = useState("");

  // Student Borrowing Form State
  const [selectedBookForDetail, setSelectedBookForDetail] = useState(null);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
  const [borrowNotes, setBorrowNotes] = useState("");
  const [submittingBorrow, setSubmittingBorrow] = useState(false);

  // My Borrowings (Student) & Targeted Inbox (Teacher)
  const [myRequests, setMyRequests] = useState([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);

  const [teacherRequests, setTeacherRequests] = useState([]);
  const [loadingTeacherRequests, setLoadingTeacherRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  const isTeacherOrAdmin = user?.role === "Admin" || user?.role === "Teacher";

  // Load classes list for Targeted Visibility picker
  useEffect(() => {
    if (isTeacherOrAdmin) {
      schoolClassService.getClasses()
        .then((res) => {
          const list = res?.data || res || [];
          setClassesList(Array.isArray(list) ? list : []);
        })
        .catch((e) => console.error("Failed to load classes list:", e));
    }
  }, [isTeacherOrAdmin]);

  // Load Folders & Books for current breadcrumb
  const loadExplorerData = useCallback(async () => {
    try {
      setLoadingData(true);
      const parentId = currentFolder?.id || null;
      const [foldersRes, booksRes] = await Promise.all([
        libraryService.getFolders(parentId),
        libraryService.getBooks(parentId, search),
      ]);
      setFolders(foldersRes?.data || foldersRes || []);
      setBooks(booksRes?.data || booksRes || []);
    } catch (err) {
      console.error("Failed to load library explorer data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [currentFolder, search]);

  const fetchMyRequests = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingMyRequests(true);
      const res = await libraryService.getStudentBorrowRequests();
      setMyRequests(res?.data || res || []);
    } catch (err) {
      console.error("Failed to load student borrow requests:", err);
    } finally {
      setLoadingMyRequests(false);
    }
  }, [isAuthenticated]);

  const fetchTeacherRequests = useCallback(async () => {
    if (!isAuthenticated || !isTeacherOrAdmin) return;
    try {
      setLoadingTeacherRequests(true);
      const res = await libraryService.getTargetedTeacherBorrowRequests();
      setTeacherRequests(res?.data || res || []);
    } catch (err) {
      console.error("Failed to load teacher borrow requests:", err);
    } finally {
      setLoadingTeacherRequests(false);
    }
  }, [isAuthenticated, isTeacherOrAdmin]);

  useEffect(() => {
    loadExplorerData();
  }, [loadExplorerData]);

  useEffect(() => {
    if (activeTab === "myBorrowings") fetchMyRequests();
    if (activeTab === "teacherInbox") fetchTeacherRequests();
  }, [activeTab, fetchMyRequests, fetchTeacherRequests]);

  // Folder Navigation Handlers
  const handleOpenFolder = (folder) => {
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearch("");
  };

  const handleNavigateBreadcrumb = (index) => {
    if (index === -1) {
      setFolderStack([]);
    } else {
      setFolderStack((prev) => prev.slice(0, index + 1));
    }
    setSearch("");
  };

  // Cloudinary Cover Image File Upload Handler
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      setAlertMessage(null);
      const uploadedUrl = await uploadImageToCloudinary(file, "library-covers");
      if (uploadedUrl) {
        setBookCoverUrl(uploadedUrl);
        setAlertMessage({ type: "success", text: "Cover buku berhasil diunggah ke Cloudinary!" });
      }
    } catch (err) {
      console.error("Failed to upload book cover image:", err);
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengunggah gambar cover buku ke Cloudinary." });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setAlertMessage(null);
      await libraryService.createFolder({
        name: newFolderName,
        description: newFolderDesc,
        parentFolderId: currentFolder?.id || null,
        visibilityType: newFolderVisibility,
        allowedClassIds: newFolderVisibility === "TargetedClasses" ? selectedClassIds : null,
      });

      setCreateFolderModalOpen(false);
      setNewFolderName("");
      setNewFolderDesc("");
      setNewFolderVisibility("Public");
      setSelectedClassIds([]);
      setAlertMessage({ type: "success", text: "Folder/Kategori perpustakaan berhasil dibuat!" });
      loadExplorerData();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal membuat folder perpustakaan." });
    }
  };

  const handleDeleteFolder = async (folderId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus folder ini beserta seluruh isinya?")) return;

    try {
      setAlertMessage(null);
      await libraryService.deleteFolder(folderId);
      setAlertMessage({ type: "success", text: "Folder berhasil dihapus." });
      loadExplorerData();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal menghapus folder." });
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    try {
      setAlertMessage(null);
      await libraryService.createBook({
        title: bookTitle,
        author: bookAuthor,
        isbn: bookIsbn,
        publisher: bookPublisher,
        publicationYear: bookPubYear ? parseInt(bookPubYear, 10) : null,
        synopsis: bookSynopsis,
        totalCopies: parseInt(bookTotalCopies, 10) || 1,
        coverImageUrl: bookCoverUrl,
        locationType: bookLocationType,
        locationDetails: bookLocationDetails,
        folderId: currentFolder?.id || null,
      });

      setCreateBookModalOpen(false);
      setBookTitle("");
      setBookAuthor("");
      setBookIsbn("");
      setBookPublisher("");
      setBookPubYear("");
      setBookSynopsis("");
      setBookTotalCopies(1);
      setBookCoverUrl("");
      setBookLocationDetails("");
      setAlertMessage({ type: "success", text: "Buku berhasil ditambahkan ke repositori perpustakaan!" });
      loadExplorerData();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal menambahkan buku." });
    }
  };

  const handleDeleteBook = async (bookId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus buku ini?")) return;

    try {
      setAlertMessage(null);
      await libraryService.deleteBook(bookId);
      setAlertMessage({ type: "success", text: "Buku berhasil dihapus." });
      loadExplorerData();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal menghapus buku." });
    }
  };

  // Borrow Preset Helper (e.g. +3 Hari, +7 Hari, +14 Hari)
  const setBorrowDurationPreset = (days) => {
    const start = borrowDate ? new Date(borrowDate) : new Date();
    const end = new Date(start.getTime() + days * 86400000);
    setDueDate(end.toISOString().split("T")[0]);
  };

  const calculateDurationDays = () => {
    if (!borrowDate || !dueDate) return 0;
    const start = new Date(borrowDate);
    const end = new Date(dueDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookForDetail) return;

    try {
      setSubmittingBorrow(true);
      setAlertMessage(null);
      await libraryService.borrowBook(selectedBookForDetail.id, {
        borrowDate: new Date(borrowDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        notes: borrowNotes,
      });

      setBorrowModalOpen(false);
      setSelectedBookForDetail(null);
      setBorrowNotes("");
      setAlertMessage({ type: "success", text: "Permintaan peminjaman berhasil dikirim ke pengajar pembuat buku!" });
      loadExplorerData();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengajukan peminjaman buku." });
    } finally {
      setSubmittingBorrow(false);
    }
  };

  const handleRespondBorrowRequest = async (requestId, approve) => {
    try {
      setProcessingRequestId(requestId);
      setAlertMessage(null);
      await libraryService.respondToBorrowRequest(requestId, approve);
      setAlertMessage({
        type: "success",
        text: approve ? "Permintaan peminjaman berhasil disetujui." : "Permintaan peminjaman berhasil ditolak.",
      });
      fetchTeacherRequests();
      loadExplorerData();
    } catch (err) {
      setAlertMessage({ type: "error", text: err?.message || "Gagal memproses peminjaman." });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const toggleClassSelection = (classId) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter((id) => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full mb-2">
              Perpustakaan & Repository PPLG Center
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Katalog & Repository Modul Kejuruan
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Struktur repositori bertingkat (Google Drive Style) dengan kendali visibilitas kelas dan peminjaman online.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("explorer")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "explorer"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📂 Repository Buku
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab("myBorrowings")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "myBorrowings"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📜 Peminjaman Saya
              </button>
            )}

            {isTeacherOrAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("teacherInbox")}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "teacherInbox"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inbox Peminjaman Guru</span>
                  {teacherRequests.filter((r) => r.status === "Pending" || r.status === "0").length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center">
                      {teacherRequests.filter((r) => r.status === "Pending" || r.status === "0").length}
                    </span>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Global Alert Notification */}
        {alertMessage && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm font-semibold border ${
              alertMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {alertMessage.text}
          </div>
        )}

        {/* TAB 1: GOOGLE DRIVE REPOSITORY EXPLORER VIEW */}
        {activeTab === "explorer" && (
          <div className="space-y-6">
            {/* Top Toolbar: Breadcrumb Navigation & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
              {/* Google Drive Breadcrumbs */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-slate-300">
                <button
                  type="button"
                  onClick={() => handleNavigateBreadcrumb(-1)}
                  className="hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Folder className="w-4 h-4 text-indigo-400" />
                  <span>Utama</span>
                </button>

                {folderStack.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <button
                      type="button"
                      onClick={() => handleNavigateBreadcrumb(idx)}
                      className={`hover:text-indigo-400 cursor-pointer transition-colors ${
                        idx === folderStack.length - 1 ? "text-indigo-400 font-extrabold" : ""
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Controls & Creation Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari buku..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-slate-900 border border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setCreateFolderModalOpen(true)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 text-indigo-400" />
                    <span>+ Folder</span>
                  </button>
                )}

                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setCreateBookModalOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Buku / Modul</span>
                  </button>
                )}
              </div>
            </div>

            {loadingData ? (
              <div className="text-center py-16 text-slate-500 text-xs">Memuat daftar repository & buku...</div>
            ) : (
              <div className="space-y-8">
                {/* Section 1: Subfolders Directory */}
                {folders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Folder / Kategori ({folders.length})
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {folders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleOpenFolder(folder)}
                          className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group relative"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                              <Folder className="w-5 h-5 fill-indigo-500/20" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-white text-xs sm:text-sm truncate">
                                {folder.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                                <span>{folder.creatorName}</span>
                                <span>•</span>
                                <span className="text-indigo-400 font-bold">
                                  {folder.visibilityType === "Public"
                                    ? "🌐 Publik"
                                    : folder.visibilityType === "TeachersOnly"
                                    ? "🔒 Guru"
                                    : "🎯 Kelas Sasaran"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isTeacherOrAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFolder(folder.id, e)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Hapus Folder"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Books Catalog */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Daftar Buku & Modul ({books.length})
                  </h3>

                  {books.length === 0 && folders.length === 0 ? (
                    <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                      Folder ini masih kosong. Belum ada folder atau buku yang ditambahkan.
                    </div>
                  ) : books.length === 0 ? (
                    <div className="text-center py-10 bg-slate-800/20 rounded-xl text-slate-500 text-xs">
                      Belum ada buku di tingkat folder ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {books.map((book) => (
                        <div
                          key={book.id}
                          className="bg-slate-800/40 border border-slate-700/40 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-indigo-500/5 group relative"
                        >
                          <div>
                            {/* Cover Thumbnail */}
                            <div className="h-44 bg-slate-900/60 rounded-xl mb-4 overflow-hidden relative flex items-center justify-center border border-slate-800">
                              {book.coverImageUrl ? (
                                <img
                                  src={book.coverImageUrl}
                                  alt={book.title}
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <BookOpen className="w-12 h-12 text-slate-700" />
                              )}

                              {/* Location Badge */}
                              <span
                                className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1 ${
                                  book.locationType === "Digital"
                                    ? "bg-cyan-500/90 text-white"
                                    : "bg-emerald-500/90 text-white"
                                }`}
                              >
                                {book.locationType === "Digital" ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                <span>{book.locationType}</span>
                              </span>
                            </div>

                            <h3 className="font-extrabold text-white text-sm sm:text-base line-clamp-2">{book.title}</h3>
                            <p className="text-slate-400 text-xs mt-1">Penulis: {book.author}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5 line-clamp-1">Oleh: {book.creatorName}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400">
                              Stok: {book.availableCopies}/{book.totalCopies}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedBookForDetail(book)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                              >
                                Detail
                              </button>

                              {isTeacherOrAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteBook(book.id, e)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Hapus Buku"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY BORROWINGS VIEW (STUDENT) */}
        {activeTab === "myBorrowings" && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">📜 Riwayat Peminjaman Saya</h2>
            {loadingMyRequests ? (
              <div className="text-center py-10 text-slate-500 text-xs">Memuat riwayat peminjaman...</div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/40 rounded-xl text-slate-400 text-xs">
                Belum ada riwayat peminjaman buku.
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800 gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{req.bookTitle}</h4>
                      <p className="text-slate-400 mt-0.5">
                        Tanggal Pinjam: {new Date(req.borrowDate).toLocaleDateString()} | Batas Kembali:{" "}
                        {new Date(req.dueDate).toLocaleDateString()}
                      </p>
                      {req.borrowNotes && (
                        <p className="text-slate-500 mt-0.5">Catatan/Alasan: {req.borrowNotes}</p>
                      )}
                      {req.rejectionReason && (
                        <p className="text-rose-400 mt-1 italic">Alasan Penolakan: {req.rejectionReason}</p>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                        req.status === "Approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : req.status === "Pending"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TARGETED TEACHER BORROWING INBOX */}
        {activeTab === "teacherInbox" && isTeacherOrAdmin && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Inbox Peminjaman Permohonan Siswa (Buku Saya)</h2>
            </div>
            <p className="text-xs text-slate-400">
              Menampilkan permintaan peminjaman khusus untuk buku-buku yang Anda tambahkan ke repositori.
            </p>

            {loadingTeacherRequests ? (
              <div className="text-center py-10 text-slate-500 text-xs">Memuat inbox peminjaman...</div>
            ) : teacherRequests.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/40 rounded-xl text-slate-400 text-xs">
                Tidak ada permintaan peminjaman buku untuk Anda saat ini.
              </div>
            ) : (
              <div className="space-y-3">
                {teacherRequests.map((req) => {
                  const isPending = req.status === "Pending" || req.status === "0";

                  return (
                    <div
                      key={req.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-700/60 gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                              isPending
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : req.status === "Approved"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {isPending ? "PENDING" : req.status}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-white text-sm sm:text-base">{req.bookTitle}</h4>
                        <p className="text-slate-300 font-medium mt-0.5">
                          Pemohon: <strong>{req.borrowerName}</strong> ({req.borrowerClassName || "Siswa"}) • Pinjam:{" "}
                          {new Date(req.borrowDate).toLocaleDateString()} s/d {new Date(req.dueDate).toLocaleDateString()}
                        </p>
                        {req.borrowNotes && (
                          <p className="text-slate-400 mt-1">Alasan Peminjaman: "{req.borrowNotes}"</p>
                        )}
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2 self-end lg:self-auto">
                          <button
                            type="button"
                            disabled={processingRequestId === req.id}
                            onClick={() => handleRespondBorrowRequest(req.id, true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Setujui</span>
                          </button>

                          <button
                            type="button"
                            disabled={processingRequestId === req.id}
                            onClick={() => handleRespondBorrowRequest(req.id, false)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Folder Modal */}
      {createFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Buat Folder / Kategori Baru</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Nama Folder:</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Buku Database, Modul PPLG..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Deskripsi (Opsional):</label>
                <textarea
                  rows="2"
                  placeholder="Penjelasan isi folder..."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Targeted Visibility Setting */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Setting Visibilitas Akses:</label>
                <select
                  value={newFolderVisibility}
                  onChange={(e) => setNewFolderVisibility(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Public">🌐 Publik (Semua Siswa & Guru)</option>
                  <option value="TeachersOnly">🔒 Hanya Guru & Admin</option>
                  <option value="TargetedClasses">🎯 Kelas Sasaran Tertentu</option>
                </select>
              </div>

              {/* Class Checkboxes if TargetedClasses */}
              {newFolderVisibility === "TargetedClasses" && (
                <div className="space-y-2 pt-2 border-t border-slate-700/60">
                  <label className="block text-xs text-slate-400 font-semibold">Pilih Kelas yang Berhak Mengakses:</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-700">
                    {classesList.map((cls) => (
                      <label key={cls.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={() => toggleClassSelection(cls.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{cls.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateFolderModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Book Modal with Cloudinary File Upload */}
      {createBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Tambah Buku / Modul Baru</h3>
            <form onSubmit={handleCreateBook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Judul Buku:</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pemrograman Web dengan React..."
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Penulis:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Penulis..."
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Jumlah Stok Buku:</label>
                  <input
                    type="number"
                    min="1"
                    value={bookTotalCopies}
                    onChange={(e) => setBookTotalCopies(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Cover Image Upload (From Computer to Cloudinary) */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Cover Sampul Buku (Unggah dari Komputer):</label>
                <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-3 text-center hover:border-indigo-500 transition-colors relative">
                  {bookCoverUrl ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={bookCoverUrl} alt="Cover Preview" className="w-12 h-16 object-cover rounded-lg border border-slate-700 shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tersimpan di Cloudinary</span>
                          </p>
                          <p className="text-slate-500 text-[10px] truncate max-w-[200px]">{bookCoverUrl}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookCoverUrl("")}
                        className="px-2.5 py-1 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                      <Upload className="w-6 h-6 text-indigo-400 mb-1" />
                      <span className="text-xs text-slate-300 font-medium">
                        {uploadingCover ? "Mengunggah Gambar ke Cloudinary..." : "Klik untuk Pilih Gambar Sampul (PNG/JPG)"}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Otomatis diunggah & disimpan di Cloudinary</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingCover}
                        onChange={handleCoverFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Location Type Selector */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tipe Lokasi Akses Buku:</label>
                <select
                  value={bookLocationType}
                  onChange={(e) => setBookLocationType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Offline">📍 Offline (Perpustakaan / Rak Fisik)</option>
                  <option value="Digital">🌐 Digital (Link E-Book / PDF Cloudinary)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  {bookLocationType === "Digital" ? "Tautan Link E-Book (URL):" : "Lokasi Fisik (Misal: Rak A-3 Perpustakaan Utama):"}
                </label>
                <input
                  type="text"
                  placeholder={bookLocationType === "Digital" ? "https://..." : "Perpustakaan Utama Rak A-3"}
                  value={bookLocationDetails}
                  onChange={(e) => setBookLocationDetails(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Sinopsis / Deskripsi Ringkas:</label>
                <textarea
                  rows="3"
                  placeholder="Penjelasan singkat modul..."
                  value={bookSynopsis}
                  onChange={(e) => setBookSynopsis(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateBookModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingCover}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Detail & Borrow Modal */}
      {selectedBookForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white">{selectedBookForDetail.title}</h3>
                <p className="text-xs text-slate-400">Penulis: {selectedBookForDetail.author}</p>
              </div>
              <button
                onClick={() => setSelectedBookForDetail(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
              <p className="flex items-center gap-2 text-slate-300 font-semibold">
                <span>Tipe Lokasi:</span>
                <span className="text-indigo-400">{selectedBookForDetail.locationType}</span>
              </p>
              {selectedBookForDetail.locationDetails && (
                <p className="text-slate-300">
                  <span className="font-semibold">Detail Lokasi:</span>{" "}
                  {selectedBookForDetail.locationType === "Digital" ? (
                    <a
                      href={selectedBookForDetail.locationDetails}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 inline-flex"
                    >
                      <span>Buka E-Book</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span>{selectedBookForDetail.locationDetails}</span>
                  )}
                </p>
              )}
              <p className="text-slate-400">Pengajar Pembuat: {selectedBookForDetail.creatorName}</p>
              <p className="text-slate-400">Sisa Stok: {selectedBookForDetail.availableCopies} dari {selectedBookForDetail.totalCopies}</p>
            </div>

            {selectedBookForDetail.synopsis && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                {selectedBookForDetail.synopsis}
              </p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookForDetail(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  disabled={selectedBookForDetail.availableCopies < 1}
                  onClick={() => setBorrowModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Pinjam Buku Ini
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Rich Borrow Request Form Modal */}
      {borrowModalOpen && selectedBookForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-extrabold text-white">Formulir Peminjaman Buku</h3>
            </div>
            <p className="text-xs text-slate-300">Buku: <strong className="text-indigo-300">{selectedBookForDetail.title}</strong></p>

            <form onSubmit={handleBorrowSubmit} className="space-y-4 text-xs">
              {/* Interactive Date Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tanggal Pinjam:</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Batas Pengembalian:</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Duration Preset Selector Buttons */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Pilih Pilihan Durasi Peminjaman Cepat:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(3)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-slate-200 rounded-xl font-bold transition-all cursor-pointer text-[11px]"
                  >
                    ⚡ +3 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(7)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-indigo-400 rounded-xl font-bold transition-all cursor-pointer text-[11px]"
                  >
                    📅 +7 Hari (1 Wk)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(14)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-slate-200 rounded-xl font-bold transition-all cursor-pointer text-[11px]"
                  >
                    ⏳ +14 Hari (2 Wk)
                  </button>
                </div>
              </div>

              {/* Calculated Duration Summary Banner */}
              <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-3 text-indigo-300 text-[11px] font-semibold flex items-center justify-between">
                <span>Total Durasi Peminjaman:</span>
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md font-black text-xs">
                  {calculateDurationDays()} Hari
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Alasan Peminjaman / Catatan Siswa:</label>
                <textarea
                  rows="3"
                  placeholder="Misal: Dipinjam untuk referensi pengerjaan tugas proyek akhir..."
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setBorrowModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBorrow}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {submittingBorrow ? "Mengirim..." : "Kirim Pengajuan Peminjaman"}
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
