"use client";

import React, { useState, useEffect, useCallback } from "react";
import libraryService from "@/services/libraryService";
import schoolClassService from "@/services/schoolClassService";
import uploadImageToCloudinary from "@/services/cloudinaryService";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorFallback from "@/components/ErrorFallback";
import LoginModal from "@/features/auth/components/LoginModal";
import {
  Folder,
  FolderPlus,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MapPin,
  Globe,
  Plus,
  Trash2,
  Eye,
  Mail,
  Lock,
  Users,
  Sparkles,
  Filter,
  Upload,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  BookMarked,
  Layers,
  ArrowRight,
  Check,
  X
} from "lucide-react";

export default function PerpustakaanPage() {
  const { isAuthenticated, user, role } = useAuth();
  const [activeTab, setActiveTab] = useState("explorer"); // 'explorer' | 'myBorrowings' | 'teacherInbox'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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

  const userRole = (role || user?.role || "").toString().toLowerCase();
  const isTeacherOrAdmin = userRole === "admin" || userRole === "teacher" || userRole === "guru";

  // Load classes list for Targeted Visibility picker
  useEffect(() => {
    if (isTeacherOrAdmin) {
      schoolClassService
        .getClasses()
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
        libraryService.getFolders(parentId).catch(() => ({ data: [] })),
        libraryService.getBooks(parentId, "").catch(() => ({ data: [] })),
      ]);
      setFolders(foldersRes?.data || foldersRes || []);
      setBooks(booksRes?.data || booksRes || []);
    } catch (err) {
      console.error("Failed to load library explorer data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [currentFolder]);

  // Instant Client-Side Search (Instant matching with zero loading delay or UI flicker)
  const filteredBooks = books.filter((book) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q) ||
      book.creatorName?.toLowerCase().includes(q) ||
      book.synopsis?.toLowerCase().includes(q) ||
      book.locationDetails?.toLowerCase().includes(q)
    );
  });

  const filteredFolders = folders.filter((folder) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      folder.name?.toLowerCase().includes(q) ||
      folder.description?.toLowerCase().includes(q) ||
      folder.creatorName?.toLowerCase().includes(q)
    );
  });

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
        setAlertMessage({ type: "success", text: "Sampul buku berhasil diunggah!" });
      }
    } catch (err) {
      console.error("Failed to upload book cover image:", err);
      setAlertMessage({ type: "error", text: err?.message || "Gagal mengunggah gambar sampul buku." });
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
        name: newFolderName.trim(),
        description: newFolderDesc.trim(),
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
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        isbn: bookIsbn.trim(),
        publisher: bookPublisher.trim(),
        publicationYear: bookPubYear ? parseInt(bookPubYear, 10) : null,
        synopsis: bookSynopsis.trim(),
        totalCopies: parseInt(bookTotalCopies, 10) || 1,
        coverImageUrl: bookCoverUrl,
        locationType: bookLocationType,
        locationDetails: bookLocationDetails.trim(),
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
      setAlertMessage({ type: "success", text: "Buku berhasil ditambahkan ke repositori!" });
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
        notes: borrowNotes.trim(),
      });

      setBorrowModalOpen(false);
      setSelectedBookForDetail(null);
      setBorrowNotes("");
      setAlertMessage({ type: "success", text: "Permintaan peminjaman berhasil dikirim ke pengajar!" });
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
        text: approve ? "Permintaan peminjaman disetujui." : "Permintaan peminjaman ditolak.",
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

  const pendingTeacherRequestsCount = teacherRequests.filter(
    (r) => r.status === "Pending" || r.status === "0"
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-8">
        {/* Top Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2C1EE8] text-[11px] font-mono font-extrabold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Perpustakaan & Repository Modul PPLG</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Katalog & Modul Kejuruan
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Repositori modul belajar, buku cetak kejuruan, dan literatur digital dengan peminjaman mandiri siswa.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("explorer")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "explorer"
                    ? "bg-[#2C1EE8] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
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
                      ? "bg-[#2C1EE8] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
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
                      ? "bg-[#2C1EE8] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Inbox Guru</span>
                    {pendingTeacherRequestsCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center">
                        {pendingTeacherRequestsCount}
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global Alert Notification */}
        {alertMessage && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold border flex items-center justify-between gap-3 animate-fade-in ${
              alertMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span>{alertMessage.text}</span>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: GOOGLE DRIVE REPOSITORY EXPLORER VIEW */}
        {activeTab === "explorer" && (
          <div className="space-y-6">
            {/* Top Toolbar: Breadcrumb Navigation & Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-slate-600 scrollbar-none py-1">
                <button
                  type="button"
                  onClick={() => handleNavigateBreadcrumb(-1)}
                  className="hover:text-[#2C1EE8] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <Folder className="w-4 h-4 text-[#2C1EE8]" />
                  <span>Utama</span>
                </button>

                {folderStack.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => handleNavigateBreadcrumb(idx)}
                      className={`hover:text-[#2C1EE8] cursor-pointer transition-colors shrink-0 ${
                        idx === folderStack.length - 1 ? "text-[#2C1EE8] font-black" : ""
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Controls & Creation Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari judul buku..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all"
                  />
                </div>

                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setCreateFolderModalOpen(true)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FolderPlus className="w-4 h-4 text-[#2C1EE8]" />
                    <span>+ Folder</span>
                  </button>
                )}

                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setCreateBookModalOpen(true)}
                    className="px-4 py-2 bg-[#2C1EE8] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Buku</span>
                  </button>
                )}
              </div>
            </div>

            {loadingData ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm font-medium">
                <div className="w-8 h-8 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Memuat repositori dan koleksi buku...
              </div>
            ) : (
              <div className="space-y-8">
                {/* Section 1: Subfolders Directory */}
                {filteredFolders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#2C1EE8]" />
                      <span>Kategori Folder ({filteredFolders.length})</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleOpenFolder(folder)}
                          className="bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group relative shadow-2xs hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2C1EE8] shrink-0 group-hover:scale-105 transition-transform">
                              <Folder className="w-5 h-5 fill-blue-100" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#2C1EE8] transition-colors">
                                {folder.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                                <span className="truncate max-w-[90px]">{folder.creatorName || "Guru"}</span>
                                <span>•</span>
                                <span className="text-[#2C1EE8] font-bold">
                                  {folder.visibilityType === "Public"
                                    ? "🌐 Publik"
                                    : folder.visibilityType === "TeachersOnly"
                                    ? "🔒 Guru"
                                    : "🎯 Terbatas"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isTeacherOrAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFolder(folder.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
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
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <BookMarked className="w-3.5 h-3.5 text-[#2C1EE8]" />
                    <span>Daftar Buku & Modul ({filteredBooks.length})</span>
                  </h3>

                  {filteredBooks.length === 0 && filteredFolders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
                      <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      {search ? `Tidak ada buku atau folder yang cocok dengan "${search}".` : "Folder ini masih kosong. Belum ada folder atau buku yang ditambahkan."}
                    </div>
                  ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      {search ? `Tidak ada buku yang cocok dengan "${search}".` : "Belum ada buku di tingkat folder ini."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredBooks.map((book) => (
                        <div
                          key={book.id}
                          className="bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-slate-200/50 group relative"
                        >
                          <div>
                            {/* Cover Thumbnail */}
                            <div className="h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden relative flex items-center justify-center border border-slate-100">
                              {book.coverImageUrl ? (
                                <img
                                  src={book.coverImageUrl}
                                  alt={book.title}
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="text-center p-4">
                                  <BookOpen className="w-12 h-12 text-blue-300 mx-auto mb-1" />
                                  <span className="text-[10px] font-mono text-slate-400">PPLG Literasi</span>
                                </div>
                              )}

                              {/* Location Badge */}
                              <span
                                className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 shadow-xs ${
                                  book.locationType === "Digital"
                                    ? "bg-blue-600 text-white"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                {book.locationType === "Digital" ? (
                                  <Globe className="w-3 h-3" />
                                ) : (
                                  <MapPin className="w-3 h-3" />
                                )}
                                <span>{book.locationType}</span>
                              </span>
                            </div>

                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-[#2C1EE8] transition-colors">
                              {book.title}
                            </h3>
                            <p className="text-slate-600 text-xs mt-1 font-medium">Penulis: {book.author}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5 line-clamp-1 font-mono">
                              Oleh: {book.creatorName || "Pengajar PPLG"}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600">
                              Stok: <strong className="text-slate-900">{book.availableCopies}</strong> / {book.totalCopies}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedBookForDetail(book)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-[#2C1EE8] text-slate-700 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                              >
                                Detail
                              </button>

                              {isTeacherOrAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteBook(book.id, e)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 space-y-5 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-slate-900">📜 Riwayat Peminjaman Buku Saya</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar permohonan peminjaman buku fisik dan status persetujuan dari guru pembina.
              </p>
            </div>

            {loadingMyRequests ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                Memuat riwayat peminjaman...
              </div>
            ) : myRequests.length === 0 ? (
              <div className="py-6 w-full flex justify-center">
                <ErrorFallback
                  statusCode="EMPTY"
                  title="Belum Ada Peminjaman"
                  description="Belum ada riwayat peminjaman buku. Silakan pilih buku di repositori untuk mengajukan permohonan."
                  primaryAction={{ label: "Kembali ke Beranda", href: "/" }}
                  showHomeButton={false}
                  fullPage={false}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/90 gap-4 text-xs transition-colors"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{req.bookTitle}</h4>
                      <p className="text-slate-600 mt-1 font-medium">
                        Tanggal Pinjam: <strong>{new Date(req.borrowDate).toLocaleDateString("id-ID")}</strong> • Batas
                        Kembali: <strong>{new Date(req.dueDate).toLocaleDateString("id-ID")}</strong>
                      </p>
                      {req.borrowNotes && (
                        <p className="text-slate-500 mt-1 italic">Catatan: "{req.borrowNotes}"</p>
                      )}
                      {req.rejectionReason && (
                        <p className="text-rose-600 mt-1 font-semibold">Alasan Penolakan: {req.rejectionReason}</p>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-auto uppercase tracking-wider ${
                        req.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : req.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
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
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 space-y-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#2C1EE8]" />
                <h2 className="text-xl font-bold text-slate-900">Inbox Permohonan Peminjaman Siswa</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan permohonan peminjaman khusus untuk buku-buku yang Anda kelola di repositori.
              </p>
            </div>

            {loadingTeacherRequests ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                Memuat inbox peminjaman...
              </div>
            ) : teacherRequests.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-500 text-xs">
                Tidak ada permohonan peminjaman buku yang menunggu persetujuan Anda saat ini.
              </div>
            ) : (
              <div className="space-y-3">
                {teacherRequests.map((req) => {
                  const isPending = req.status === "Pending" || req.status === "0";

                  return (
                    <div
                      key={req.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between p-5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/90 gap-4 text-xs transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                              isPending
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : req.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isPending ? "Menunggu" : req.status}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-base">{req.bookTitle}</h4>
                        <p className="text-slate-700 font-medium">
                          Pemohon: <strong className="text-[#2C1EE8]">{req.borrowerName}</strong> (
                          {req.borrowerClassName || "Siswa"}) • Pinjam:{" "}
                          <strong>{new Date(req.borrowDate).toLocaleDateString("id-ID")}</strong> s/d{" "}
                          <strong>{new Date(req.dueDate).toLocaleDateString("id-ID")}</strong>
                        </p>
                        {req.borrowNotes && (
                          <p className="text-slate-500 italic">Alasan Peminjaman: "{req.borrowNotes}"</p>
                        )}
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                          <button
                            type="button"
                            disabled={processingRequestId === req.id}
                            onClick={() => handleRespondBorrowRequest(req.id, true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Setujui</span>
                          </button>

                          <button
                            type="button"
                            disabled={processingRequestId === req.id}
                            onClick={() => handleRespondBorrowRequest(req.id, false)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-md w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Buat Folder / Kategori Baru</h3>
              <p className="text-xs text-slate-500 mt-0.5">Kelompokkan modul atau buku sesuai topik/kelas.</p>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Nama Folder:</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pemrograman Web, Basis Data..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Deskripsi (Opsional):</label>
                <textarea
                  rows="2"
                  placeholder="Penjelasan isi folder..."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Targeted Visibility Setting */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Visibilitas Akses:</label>
                <select
                  value={newFolderVisibility}
                  onChange={(e) => setNewFolderVisibility(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="Public">🌐 Publik (Semua Siswa & Guru)</option>
                  <option value="TeachersOnly">🔒 Hanya Guru & Admin</option>
                  <option value="TargetedClasses">🎯 Kelas Sasaran Tertentu</option>
                </select>
              </div>

              {/* Class Checkboxes if TargetedClasses */}
              {newFolderVisibility === "TargetedClasses" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-slate-700 font-bold">Pilih Kelas Sasaran:</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {classesList.map((cls) => (
                      <label
                        key={cls.id}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={() => toggleClassSelection(cls.id)}
                          className="rounded text-[#2C1EE8] focus:ring-blue-500"
                        />
                        <span>{cls.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setCreateFolderModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-lg w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Tambah Buku / Modul Baru</h3>
              <p className="text-xs text-slate-500 mt-0.5">Lengkapi data informasi buku untuk repositori perpustakaan.</p>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Judul Buku:</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pemrograman Web dengan Next.js..."
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Penulis:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Penulis..."
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Jumlah Stok:</label>
                  <input
                    type="number"
                    min="1"
                    value={bookTotalCopies}
                    onChange={(e) => setBookTotalCopies(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* Cover Image Upload (From Computer to Cloudinary) */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Sampul Buku:</label>
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-blue-300 transition-colors relative">
                  {bookCoverUrl ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={bookCoverUrl}
                          alt="Cover Preview"
                          className="w-12 h-16 object-cover rounded-xl border border-slate-200 shrink-0 shadow-xs"
                        />
                        <div className="text-left min-w-0">
                          <p className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tersimpan di Cloudinary</span>
                          </p>
                          <p className="text-slate-400 text-[10px] truncate max-w-[220px] font-mono">{bookCoverUrl}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookCoverUrl("")}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                      <Upload className="w-6 h-6 text-[#2C1EE8] mb-1" />
                      <span className="text-xs text-slate-700 font-bold">
                        {uploadingCover ? "Mengunggah Gambar..." : "Klik untuk Pilih Gambar Sampul (PNG/JPG)"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Otomatis disimpan di Cloudinary</span>
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
                <label className="block text-slate-700 mb-1 font-bold">Tipe Akses Buku:</label>
                <select
                  value={bookLocationType}
                  onChange={(e) => setBookLocationType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="Offline">📍 Offline (Perpustakaan / Rak Fisik)</option>
                  <option value="Digital">🌐 Digital (Link E-Book / PDF)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  {bookLocationType === "Digital"
                    ? "Tautan Link E-Book (URL):"
                    : "Lokasi Fisik (Misal: Rak A-3 Perpustakaan):"}
                </label>
                <input
                  type="text"
                  placeholder={bookLocationType === "Digital" ? "https://..." : "Perpustakaan Utama Rak A-3"}
                  value={bookLocationDetails}
                  onChange={(e) => setBookLocationDetails(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Sinopsis / Deskripsi Ringkas:</label>
                <textarea
                  rows="3"
                  placeholder="Penjelasan ringkas isi modul / buku..."
                  value={bookSynopsis}
                  onChange={(e) => setBookSynopsis(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateBookModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingCover}
                  className="px-5 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-md w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {selectedBookForDetail.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Penulis: {selectedBookForDetail.author}</p>
              </div>
              <button
                onClick={() => setSelectedBookForDetail(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="flex items-center justify-between text-slate-700 font-medium">
                <span>Tipe Lokasi:</span>
                <span className="font-extrabold text-[#2C1EE8]">{selectedBookForDetail.locationType}</span>
              </p>
              {selectedBookForDetail.locationDetails && (
                <p className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Detail Lokasi:</span>
                  {selectedBookForDetail.locationType === "Digital" ? (
                    <a
                      href={selectedBookForDetail.locationDetails}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2C1EE8] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Buka E-Book</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="font-bold text-slate-900">{selectedBookForDetail.locationDetails}</span>
                  )}
                </p>
              )}
              <p className="flex items-center justify-between text-slate-700 font-medium">
                <span>Pengajar Pengunggah:</span>
                <span className="font-bold text-slate-900">{selectedBookForDetail.creatorName || "Pengajar PPLG"}</span>
              </p>
              <p className="flex items-center justify-between text-slate-700 font-medium">
                <span>Ketersediaan Stok:</span>
                <span className="font-extrabold text-emerald-700">
                  {selectedBookForDetail.availableCopies} dari {selectedBookForDetail.totalCopies} buku
                </span>
              </p>
            </div>

            {selectedBookForDetail.synopsis && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100 font-medium">
                {selectedBookForDetail.synopsis}
              </p>
            )}

            <div className="flex gap-3 justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedBookForDetail(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Tutup
              </button>

              {isAuthenticated ? (
                <button
                  type="button"
                  disabled={selectedBookForDetail.availableCopies < 1}
                  onClick={() => setBorrowModalOpen(true)}
                  className="px-5 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  Pinjam Buku Ini
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-5 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  Login untuk Meminjam
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Rich Borrow Request Form Modal */}
      {borrowModalOpen && selectedBookForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-md w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2C1EE8]" />
              <h3 className="text-xl font-extrabold text-slate-900">Formulir Peminjaman Buku</h3>
            </div>
            <p className="text-xs text-slate-600">
              Buku yang dipinjam: <strong className="text-[#2C1EE8]">{selectedBookForDetail.title}</strong>
            </p>

            <form onSubmit={handleBorrowSubmit} className="space-y-4 text-xs">
              {/* Interactive Date Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#2C1EE8]" />
                    <span>Tanggal Pinjam:</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Batas Kembali:</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium cursor-pointer"
                  />
                </div>
              </div>

              {/* Duration Preset Selector Buttons */}
              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">Pilihan Durasi Cepat:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(3)}
                    className="px-3 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-[#2C1EE8] rounded-xl font-bold transition-all cursor-pointer text-[11px]"
                  >
                    ⚡ +3 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(7)}
                    className="px-3 py-2 bg-blue-50/70 hover:bg-blue-50 border border-blue-200 text-[#2C1EE8] rounded-xl font-bold transition-all cursor-pointer text-[11px]"
                  >
                    📅 +7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(14)}
                    className="px-3 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-[#2C1EE8] rounded-xl font-bold transition-all cursor-pointer text-[11px]"
                  >
                    ⏳ +14 Hari
                  </button>
                </div>
              </div>

              {/* Calculated Duration Summary Banner */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 text-blue-900 text-xs font-semibold flex items-center justify-between">
                <span>Total Durasi Peminjaman:</span>
                <span className="px-3 py-1 bg-white text-[#2C1EE8] border border-blue-200 rounded-lg font-black text-xs shadow-2xs">
                  {calculateDurationDays()} Hari
                </span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Alasan Peminjaman / Catatan:</label>
                <textarea
                  rows="3"
                  placeholder="Misal: Dipinjam untuk referensi pengerjaan tugas proyek..."
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBorrowModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBorrow}
                  className="px-5 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50 shadow-sm transition-all"
                >
                  {submittingBorrow ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal for Guest users */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          loadExplorerData();
        }}
      />

      <Footer />
    </div>
  );
}
