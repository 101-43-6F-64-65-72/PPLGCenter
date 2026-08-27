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

  // Navigation & Folder Stack (Breadcrumbs)
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

  // Instant Client-Side Search
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
      folder.creatorName?.toLowerCase().includes(q) ||
      folder.description?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (activeTab === "explorer") {
      loadExplorerData();
    }
  }, [activeTab, loadExplorerData]);

  // Fetch Student Borrow Requests
  const fetchMyBorrowings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingMyRequests(true);
      const res = await libraryService.getMyBorrowRequests();
      setMyRequests(res?.data || res || []);
    } catch (err) {
      console.error("Failed to load student borrow requests:", err);
    } finally {
      setLoadingMyRequests(false);
    }
  }, [isAuthenticated]);

  // Fetch Teacher Inbox Requests
  const fetchTeacherRequests = useCallback(async () => {
    if (!isTeacherOrAdmin) return;
    try {
      setLoadingTeacherRequests(true);
      const res = await libraryService.getTeacherBorrowRequests();
      setTeacherRequests(res?.data || res || []);
    } catch (err) {
      console.error("Failed to load teacher borrow requests:", err);
    } finally {
      setLoadingTeacherRequests(false);
    }
  }, [isTeacherOrAdmin]);

  useEffect(() => {
    if (activeTab === "myBorrowings") fetchMyBorrowings();
    if (activeTab === "teacherInbox") fetchTeacherRequests();
  }, [activeTab, fetchMyBorrowings, fetchTeacherRequests]);

  const handleOpenFolder = (folder) => {
    setFolderStack([...folderStack, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index) => {
    if (index === -1) {
      setFolderStack([]);
    } else {
      setFolderStack(folderStack.slice(0, index + 1));
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const uploadedUrl = await uploadImageToCloudinary(file);
      if (uploadedUrl) {
        setBookCoverUrl(uploadedUrl);
      }
    } catch (err) {
      console.error("Failed to upload book cover:", err);
      alert("Gagal mengunggah sampul buku. Silakan coba lagi.");
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
        parentId: currentFolder?.id || null,
        visibilityType: newFolderVisibility,
        allowedClassIds: newFolderVisibility === "TargetedClasses" ? selectedClassIds : [],
      });

      setCreateFolderModalOpen(false);
      setNewFolderName("");
      setNewFolderDesc("");
      setNewFolderVisibility("Public");
      setSelectedClassIds([]);
      setAlertMessage({ type: "success", text: "Folder baru berhasil dibuat." });
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white relative">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-5">
        
        {/* ── 1. Top Search, Navigation & Action Toolbar (Direct & To-The-Point) ── */}
        <div className="bg-white border border-slate-200 rounded-none p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul buku, modul, penulis, atau kata kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2C1EE8] outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto">
              {isTeacherOrAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setCreateFolderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-none border border-slate-200 transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[#2C1EE8]" />
                    <span>+ Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateBookModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2C1EE8] hover:bg-[#2317be] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Buku</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("explorer")}
              className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer border ${
                activeTab === "explorer"
                  ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              Katalog & Modul
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab("myBorrowings")}
                className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer border ${
                  activeTab === "myBorrowings"
                    ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                Peminjaman Saya
              </button>
            )}

            {isTeacherOrAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("teacherInbox")}
                className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                  activeTab === "teacherInbox"
                    ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Inbox Guru</span>
                {pendingTeacherRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-none bg-rose-500 text-white font-mono font-bold text-[9.5px]">
                    {pendingTeacherRequestsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Global Alert Notification */}
        {alertMessage && (
          <div
            className={`p-3 rounded-none text-xs font-semibold border flex items-center justify-between gap-3 ${
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
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── TAB 1: GOOGLE DRIVE REPOSITORY EXPLORER VIEW ── */}
        {activeTab === "explorer" && (
          <div className="space-y-4">
            {/* Breadcrumb Navigation Bar */}
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-none border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-slate-600 scrollbar-none py-0.5">
                <button
                  type="button"
                  onClick={() => handleNavigateBreadcrumb(-1)}
                  className="hover:text-[#2C1EE8] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 uppercase tracking-wider"
                >
                  <Folder className="w-3.5 h-3.5 text-[#2C1EE8]" />
                  <span>Katalog Utama</span>
                </button>

                {folderStack.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => handleNavigateBreadcrumb(idx)}
                      className={`hover:text-[#2C1EE8] cursor-pointer transition-colors shrink-0 uppercase tracking-wider ${
                        idx === folderStack.length - 1 ? "text-[#2C1EE8] font-black" : ""
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {loadingData ? (
              <div className="text-center py-16 bg-white rounded-none border border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <div className="w-6 h-6 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Memuat repositori dan koleksi buku...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Section 1: Subfolders Directory */}
                {filteredFolders.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#2C1EE8]" />
                      <span>Kategori Folder ({filteredFolders.length})</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleOpenFolder(folder)}
                          className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-[#2C1EE8] rounded-none p-3.5 cursor-pointer transition-colors flex items-center justify-between group relative shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-none bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2C1EE8] shrink-0">
                              <Folder className="w-4 h-4 fill-blue-100" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#2C1EE8] transition-colors">
                                {folder.name}
                              </h4>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span className="truncate max-w-[80px]">{folder.creatorName || "Guru"}</span>
                                <span>·</span>
                                <span className="text-[#2C1EE8] font-bold">
                                  {folder.visibilityType === "Public"
                                    ? "Publik"
                                    : folder.visibilityType === "TeachersOnly"
                                    ? "Guru"
                                    : "Terbatas"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isTeacherOrAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFolder(folder.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Hapus Folder"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Books Catalog */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-[#2C1EE8]" />
                    <span>Daftar Buku & Modul ({filteredBooks.length})</span>
                  </h3>

                  {filteredBooks.length === 0 && filteredFolders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-none border border-slate-200 text-slate-400 text-xs font-medium">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      {search ? `Tidak ada buku atau folder yang cocok dengan "${search}".` : "Folder ini masih kosong. Belum ada modul atau buku yang ditambahkan."}
                    </div>
                  ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-none border border-slate-200 text-slate-400 text-xs font-medium">
                      {search ? `Tidak ada buku yang cocok dengan "${search}".` : "Belum ada buku di tingkat folder ini."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredBooks.map((book) => (
                        <div
                          key={book.id}
                          className="bg-white border border-slate-200 hover:border-[#2C1EE8] rounded-none p-3.5 flex flex-col justify-between transition-colors shadow-2xs group relative text-left"
                        >
                          <div>
                            {/* Cover Thumbnail */}
                            <div className="aspect-[16/10] bg-slate-100 rounded-none mb-3 overflow-hidden relative flex items-center justify-center border border-slate-200">
                              {book.coverImageUrl ? (
                                <img
                                  src={book.coverImageUrl}
                                  alt={book.title}
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="text-center p-3">
                                  <BookOpen className="w-8 h-8 text-blue-300 mx-auto mb-1" />
                                  <span className="text-[10px] font-mono text-slate-400 uppercase">PPLG Modul</span>
                                </div>
                              )}

                              {/* Location Badge */}
                              <span
                                className={`absolute top-2 left-2 px-2 py-0.5 rounded-none text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                                  book.locationType === "Digital"
                                    ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                                    : "bg-emerald-600 text-white border-emerald-700"
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

                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#2C1EE8] transition-colors uppercase">
                              {book.title}
                            </h4>
                            <p className="text-slate-600 text-[11px] mt-1 font-medium truncate">Penulis: {book.author}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5 line-clamp-1 font-mono">
                              Oleh: {book.creatorName || "Pengajar PPLG"}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10.5px] font-mono font-bold text-slate-600">
                              Stok: <strong className="text-slate-900">{book.availableCopies}</strong>/{book.totalCopies}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedBookForDetail(book)}
                                className="px-3 py-1 bg-slate-100 hover:bg-[#2C1EE8] text-slate-700 hover:text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer"
                              >
                                Detail
                              </button>

                              {isTeacherOrAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteBook(book.id, e)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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

        {/* ── TAB 2: MY BORROWINGS VIEW (STUDENT) ── */}
        {activeTab === "myBorrowings" && (
          <div className="bg-white border border-slate-200 rounded-none p-5 sm:p-6 space-y-4 shadow-xs text-left">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase">Riwayat Peminjaman Buku Saya</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar permohonan peminjaman buku fisik dan status persetujuan dari guru pembina.
              </p>
            </div>

            {loadingMyRequests ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
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
              <div className="space-y-2.5">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-none border border-slate-200 gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase">{req.bookTitle}</h4>
                      <p className="text-slate-600 mt-0.5 font-medium">
                        Diajukan: {new Date(req.borrowDate).toLocaleDateString("id-ID", { dateStyle: "medium" })} · Jatuh Tempo: {new Date(req.dueDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </p>
                      {req.notes && <p className="text-slate-500 text-[11px] mt-0.5">Catatan: {req.notes}</p>}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${
                          req.status === "Approved" || req.status === "1"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : req.status === "Returned" || req.status === "3"
                            ? "bg-blue-50 text-[#2C1EE8] border-blue-200"
                            : req.status === "Rejected" || req.status === "2"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {req.status === "Approved" || req.status === "1"
                          ? "Disetujui"
                          : req.status === "Returned" || req.status === "3"
                          ? "Dikembalikan"
                          : req.status === "Rejected" || req.status === "2"
                          ? "Ditolak"
                          : "Menunggu Persetujuan"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TEACHER INBOX VIEW (TEACHER / ADMIN) ── */}
        {activeTab === "teacherInbox" && isTeacherOrAdmin && (
          <div className="bg-white border border-slate-200 rounded-none p-5 sm:p-6 space-y-4 shadow-xs text-left">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase">Inbox Persetujuan Peminjaman Siswa</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar permohonan pinjam buku fisik yang ditujukan ke Anda sebagai pengunggah buku.
              </p>
            </div>

            {loadingTeacherRequests ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
                Memuat permohonan siswa...
              </div>
            ) : teacherRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                Belum ada permohonan peminjaman buku dari siswa.
              </div>
            ) : (
              <div className="space-y-2.5">
                {teacherRequests.map((req) => {
                  const isPending = req.status === "Pending" || req.status === "0";
                  const isProcessing = processingRequestId === req.id;

                  return (
                    <div
                      key={req.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-none border border-slate-200 gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase">{req.bookTitle}</h4>
                          <span
                            className={`px-2 py-0.2 rounded-none text-[9.5px] font-bold uppercase tracking-wider border ${
                              isPending
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : req.status === "Approved" || req.status === "1"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {isPending ? "Pending" : req.status}
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium font-mono">
                          Peminjam: {req.studentName} · Tgl Pinjam: {new Date(req.borrowDate).toLocaleDateString("id-ID")} · Tempo: {new Date(req.dueDate).toLocaleDateString("id-ID")}
                        </p>
                        {req.notes && <p className="text-slate-500 text-[11px]">Keperluan: {req.notes}</p>}
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleRespondBorrowRequest(req.id, false)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleRespondBorrowRequest(req.id, true)}
                            className="px-4 py-1.5 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            Setujui
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

      {/* ── MODAL CREATE FOLDER ── */}
      {createFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 uppercase">
                <FolderPlus className="w-4 h-4 text-[#2C1EE8]" />
                <span>Buat Folder Kategori Baru</span>
              </h3>
              <button
                onClick={() => setCreateFolderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Folder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Kelas XII - Cloud Computing"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:border-[#2C1EE8] outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Folder
                </label>
                <input
                  type="text"
                  placeholder="Deskripsi singkat konten materi..."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:border-[#2C1EE8] outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hak Akses / Visibilitas
                </label>
                <select
                  value={newFolderVisibility}
                  onChange={(e) => setNewFolderVisibility(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:border-[#2C1EE8] outline-none transition cursor-pointer"
                >
                  <option value="Public">🌐 Publik (Seluruh Civitas PPLG)</option>
                  <option value="TeachersOnly">🔒 Hanya Guru / Tenaga Pendidik</option>
                  <option value="TargetedClasses">🎯 Kelas Spesifik Terpilih</option>
                </select>
              </div>

              {newFolderVisibility === "TargetedClasses" && (
                <div className="space-y-1.5 pt-1">
                  <span className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Pilih Kelas Sasaran:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-none">
                    {classesList.map((cls) => {
                      const isSelected = selectedClassIds.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => toggleClassSelection(cls.id)}
                          className={`p-1.5 rounded-none text-[11px] font-bold uppercase tracking-wider border text-left transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className="truncate">{cls.name}</span>
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateFolderModalOpen(false)}
                  className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors shadow-xs cursor-pointer"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CREATE BOOK ── */}
      {createBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-xl p-5 sm:p-6 space-y-4 shadow-xl text-left my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 uppercase">
                <BookOpen className="w-4 h-4 text-[#2C1EE8]" />
                <span>Tambah Buku / Modul Baru</span>
              </h3>
              <button
                onClick={() => setCreateBookModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Judul Buku / Modul <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Belajar Pemrograman C# & .NET 8 Modern"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:border-[#2C1EE8] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Penulis <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama penulis..."
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:border-[#2C1EE8] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ISBN (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="978-602-xxx-xxx-x"
                    value={bookIsbn}
                    onChange={(e) => setBookIsbn(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:border-[#2C1EE8] outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Penerbit
                  </label>
                  <input
                    type="text"
                    placeholder="Penerbit..."
                    value={bookPublisher}
                    onChange={(e) => setBookPublisher(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:border-[#2C1EE8] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tahun Terbit
                  </label>
                  <input
                    type="number"
                    placeholder="2026"
                    value={bookPubYear}
                    onChange={(e) => setBookPubYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:border-[#2C1EE8] outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipe Keberadaan
                  </label>
                  <select
                    value={bookLocationType}
                    onChange={(e) => setBookLocationType(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:border-[#2C1EE8] outline-none transition cursor-pointer"
                  >
                    <option value="Offline">📦 Buku Fisik (Rak / Perpustakaan)</option>
                    <option value="Digital">🌐 E-Book / Literatur Digital (Link / PDF)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jumlah Salinan (Stok)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookTotalCopies}
                    onChange={(e) => setBookTotalCopies(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:border-[#2C1EE8] outline-none transition font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {bookLocationType === "Digital" ? "Tautan / Link Akses Digital" : "Lokasi Rak / Lemari Fisik"}
                  </label>
                  <input
                    type="text"
                    placeholder={bookLocationType === "Digital" ? "https://drive.google.com/..." : "Contoh: Rak B3 - Jurusan PPLG"}
                    value={bookLocationDetails}
                    onChange={(e) => setBookLocationDetails(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:border-[#2C1EE8] outline-none transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sinopsis / Ringkasan Buku
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ringkasan materi yang dimuat dalam buku..."
                    value={bookSynopsis}
                    onChange={(e) => setBookSynopsis(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:border-[#2C1EE8] outline-none transition resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unggah Sampul Buku
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-none file:border file:border-slate-200 file:text-xs file:font-bold file:uppercase file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                  />
                  {uploadingCover && (
                    <p className="text-[11px] font-bold text-[#2C1EE8] mt-1">Mengunggah gambar sampul...</p>
                  )}
                  {bookCoverUrl && (
                    <div className="mt-2 w-16 h-20 relative rounded-none overflow-hidden border border-slate-200">
                      <img src={bookCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateBookModalOpen(false)}
                  className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingCover}
                  className="px-5 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DETAIL BUKU & PEMINJAMAN ── */}
      {selectedBookForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-xl text-left my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">
                Detail Informasi Buku
              </h3>
              <button
                onClick={() => setSelectedBookForDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-24 h-32 bg-slate-100 rounded-none overflow-hidden shrink-0 border border-slate-200 relative">
                {selectedBookForDetail.coverImageUrl ? (
                  <img
                    src={selectedBookForDetail.coverImageUrl}
                    alt={selectedBookForDetail.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <span
                  className={`inline-block px-2 py-0.2 rounded-none text-[9.5px] font-bold uppercase tracking-wider border ${
                    selectedBookForDetail.locationType === "Digital"
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                      : "bg-emerald-600 text-white border-emerald-700"
                  }`}
                >
                  {selectedBookForDetail.locationType}
                </span>

                <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug uppercase">
                  {selectedBookForDetail.title}
                </h4>
                <p className="text-xs text-slate-600 font-medium">Penulis: {selectedBookForDetail.author}</p>
                {selectedBookForDetail.publisher && (
                  <p className="text-[11px] text-slate-500 font-mono">Penerbit: {selectedBookForDetail.publisher} ({selectedBookForDetail.publicationYear || "-"})</p>
                )}
                {selectedBookForDetail.isbn && (
                  <p className="text-[11px] text-slate-500 font-mono">ISBN: {selectedBookForDetail.isbn}</p>
                )}
                <p className="text-[11px] font-bold text-slate-700 font-mono">
                  Ketersediaan: {selectedBookForDetail.availableCopies} dari {selectedBookForDetail.totalCopies} Salinan
                </p>
              </div>
            </div>

            {selectedBookForDetail.synopsis && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sinopsis:</span>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">{selectedBookForDetail.synopsis}</p>
              </div>
            )}

            {selectedBookForDetail.locationDetails && (
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-none text-xs text-[#2C1EE8] font-medium flex items-center justify-between">
                <span>Lokasi: {selectedBookForDetail.locationDetails}</span>
                {selectedBookForDetail.locationType === "Digital" && (
                  <a
                    href={selectedBookForDetail.locationDetails}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold flex items-center gap-1"
                  >
                    <span>Buka Akses</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBookForDetail(null)}
                className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>

              {selectedBookForDetail.locationType === "Offline" && (
                <button
                  type="button"
                  disabled={selectedBookForDetail.availableCopies <= 0}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setIsLoginModalOpen(true);
                      return;
                    }
                    setBorrowModalOpen(true);
                  }}
                  className="px-5 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {selectedBookForDetail.availableCopies > 0 ? "Ajukan Pinjam Buku" : "Stok Habis"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL BORROW FORM ── */}
      {borrowModalOpen && selectedBookForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-md p-5 sm:p-6 space-y-4 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">
                Formulir Peminjaman Buku
              </h3>
              <button
                onClick={() => setBorrowModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBorrowSubmit} className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Buku yang Dipinjam:</span>
                <p className="font-bold text-slate-900 text-xs sm:text-sm uppercase mt-0.5">{selectedBookForDetail.title}</p>
                <p className="text-[11px] text-slate-500">Penulis: {selectedBookForDetail.author}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tanggal Mulai Pinjam
                </label>
                <input
                  type="date"
                  required
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:border-[#2C1EE8] outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Tanggal Pengembalian (Jatuh Tempo)
                  </label>
                  <span className="text-[10.5px] font-bold text-[#2C1EE8] font-mono">
                    Durasi: {calculateDurationDays()} Hari
                  </span>
                </div>
                <input
                  type="date"
                  required
                  value={dueDate}
                  min={borrowDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:border-[#2C1EE8] outline-none transition"
                />

                {/* Duration Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preset:</span>
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(3)}
                    className="px-2 py-0.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold uppercase transition-colors cursor-pointer border border-slate-200"
                  >
                    3 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(7)}
                    className="px-2 py-0.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold uppercase transition-colors cursor-pointer border border-slate-200"
                  >
                    7 Hari (Standar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowDurationPreset(14)}
                    className="px-2 py-0.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold uppercase transition-colors cursor-pointer border border-slate-200"
                  >
                    14 Hari
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Keperluan / Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Referensi pengerjaan tugas proyek akhir..."
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:border-[#2C1EE8] outline-none transition resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBorrowModalOpen(false)}
                  className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBorrow}
                  className="px-5 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingBorrow ? "Mengirim..." : "Kirim Permohonan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
}
