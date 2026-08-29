"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FacilitySection from "@/components/fasilitas/FacilitySection";
import ScheduleModal from "@/components/fasilitas/ScheduleModal";
import CartModal from "@/components/fasilitas/CartModal";
import LoginRequiredFallback from "@/components/common/LoginRequiredFallback";
import LoginModal from "@/features/auth/components/LoginModal";
import VerticalFacilitySlider from "@/components/facilities/VerticalFacilitySlider";
import { Search, ShoppingBag, X, Clock, Building2, Trash2, Filter, ChevronDown, Layers } from "lucide-react";
import facilityService from "@/services/facilityService";
import bookingService from "@/services/bookingService";
import useAuth from "@/hooks/useAuth";
import { resolveImageUrl } from "@/lib/utils";

const getCategoryMatchingImage = (item) => {
  const rawImage = item.imageUrl || item.image || item.photo;
  if (rawImage) {
    return resolveImageUrl(rawImage);
  }
  const text = `${item?.category || ""} ${item?.name || item?.Name || ""}`.toLowerCase();
  if (text.includes("halaman") || text.includes("area") || text.includes("depan") || text.includes("taman")) {
    return "/images/tempat/halamandepansmkn2ska.jpg";
  }
  if (text.includes("lapangan") || text.includes("olahraga") || text.includes("stadion") || text.includes("basket") || text.includes("futsal")) {
    return "/images/tempat/lapangansmkn2ska.jpg";
  }
  if (text.includes("aula") || text.includes("ruang utama") || text.includes("hall") || text.includes("auditorium")) {
    return "/images/tempat/aulasmkn2ska.jpg";
  }
  if (text.includes("lab") || text.includes("komputer") || text.includes("laboratorium") || text.includes("bengkel")) {
    return "/images/tempat/labsmkn2ska.jpeg";
  }
  return "/images/tempat/halamandepansmkn2ska.jpg";
};

const getDefaultFacilityDescription = (title = "", category = "", existingDesc = "") => {
  if (existingDesc && existingDesc.trim().length > 15) {
    return existingDesc.trim();
  }
  const text = `${title} ${category}`.toLowerCase();

  if (text.includes("aula") || text.includes("hall") || text.includes("auditorium")) {
    return "Ruang serbaguna utama untuk seminar, rapat pleno, dan pergelaran siswa.";
  }
  if (text.includes("lapangan") || text.includes("basket") || text.includes("futsal") || text.includes("voli") || text.includes("olahraga")) {
    return "Lapangan olahraga serbaguna untuk basket, voli, dan futsal.";
  }
  if (text.includes("lab") || text.includes("komputer") || text.includes("laboratorium") || text.includes("pplg") || text.includes("tjkt")) {
    return "Lab komputer dengan 36 PC, internet berkecepatan tinggi, dan proyektor.";
  }
  if (text.includes("halaman") || text.includes("taman") || text.includes("depan") || text.includes("area")) {
    return "Area terbuka untuk upacara, bazar, dan kegiatan luar ruangan.";
  }
  if (text.includes("perpustakaan") || text.includes("baca")) {
    return "Ruang literasi dan area belajar mandiri atau diskusi kelompok.";
  }
  return "Fasilitas penunjang kegiatan pembelajaran dan praktikum.";
};

const FACILITY_CATEGORIES = [
  { key: "semua", label: "Semua Kategori" },
  { key: "aula", label: "Aula & Ruang" },
  { key: "lapangan", label: "Lapangan" },
  { key: "lab", label: "Laboratorium" },
  { key: "barang", label: "Peralatan & Barang" },
  { key: "tersedia", label: "Hanya Tersedia" },
];

export default function FasilitasPage() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("semua"); // 'semua' | 'aula' | 'lapangan' | 'lab' | 'tersedia'
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Facility Places State from REST API
  const [placesData, setPlacesData] = useState([]);

  // Cart System States
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // My Bookings System States (Private to User)
  const [myBookingsData, setMyBookingsData] = useState([]);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [loadingMyBookings, setLoadingMyBookings] = useState(false);

  // All Public Borrowings System States (Transparency Schedule for All Students)
  const [publicBookingsData, setPublicBookingsData] = useState([]);
  const [isPublicBookingsOpen, setIsPublicBookingsOpen] = useState(false);
  const [loadingPublicBookings, setLoadingPublicBookings] = useState(false);

  const fetchMyBookings = async () => {
    setLoadingMyBookings(true);
    try {
      const res = await bookingService.getBookings({ pageSize: 100 });
      setMyBookingsData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load my bookings", err);
      setMyBookingsData([]);
    } finally {
      setLoadingMyBookings(false);
    }
  };

  const fetchPublicBookings = async () => {
    setLoadingPublicBookings(true);
    try {
      const res = await bookingService.getPublicBookings({ pageSize: 100 });
      setPublicBookingsData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load public bookings", err);
      setPublicBookingsData([]);
    } finally {
      setLoadingPublicBookings(false);
    }
  };

  // Fetch facilities directly from /api/facilities endpoint
  useEffect(() => {
    let isMounted = true;
    async function loadFacilityData() {
      setIsLoading(true);
      setIsUnauthorized(false);
      try {
        const res = await facilityService.getFacilities({ pageSize: 100 });
        const rawData = res?.data ?? res;
        const items = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.items)
          ? rawData.items
          : [];

        if (isMounted) {
          const mapped = items.map((item) => {
            const facilityTitle = item.name || item.Name || "Fasilitas Sekolah";
            const facilityCategory = item.category || item.Category || "Umum";
            const rawDesc = item.description || item.Description || "";
            const infoDescription = getDefaultFacilityDescription(facilityTitle, facilityCategory, rawDesc);
            const isFacilityActive = item.isActive ?? item.IsActive ?? true;
            const extracted3d = item.model3dUrl || item.Model3dUrl || item.model3DUrl || item.Model3DUrl || item.model3d_url || item.Model3d_url || null;

            return {
              id: item.id || item.Id,
              title: facilityTitle,
              name: facilityTitle,
              location: item.location || item.Location || "SMKN 2 Surakarta",
              capacity: item.capacity ?? item.Capacity ?? 30,
              category: facilityCategory,
              description: infoDescription,
              isActive: isFacilityActive,
              status: isFacilityActive ? "tersedia" : "tidak tersedia",
              time: isFacilityActive ? "07.00 s.d 17.00 WIB" : "Tutup / Nonaktif",
              imageSrc: getCategoryMatchingImage(item),
              model3dUrl: extracted3d,
              managerTeacherName: item.managerTeacherName || item.ManagerTeacherName || "",
            };
          });
          setPlacesData(mapped);
        }
      } catch (err) {
        const checkUnauth =
          err?.statusCode === 401 ||
          err?.response?.status === 401 ||
          err?.message?.includes("Sesi") ||
          err?.message?.includes("Unauthorized") ||
          err?.message?.includes("login");
        if (isMounted) {
          if (checkUnauth) setIsUnauthorized(true);
          setPlacesData([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadFacilityData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = (facility) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFacility(null);
  };

  const handleAddToCart = (item) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setCartItems((prev) => [...prev, item]);
  };

  const handleRemoveFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Filter facilities/places based on search query and category tab
  const filteredPlaces = placesData.filter((item) => {
    const titleStr = (item?.title || item?.name || "").toString();
    const locationStr = (item?.location || "").toString();
    const categoryStr = (item?.category || "").toString();
    const combinedText = `${titleStr} ${locationStr} ${categoryStr}`.toLowerCase();

    const matchesSearch = combinedText.includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === "tersedia") return item?.status === "tersedia";
    if (activeTab === "aula") return combinedText.includes("aula") || combinedText.includes("ruang");
    if (activeTab === "lapangan") return combinedText.includes("lapangan") || combinedText.includes("olahraga");
    if (activeTab === "lab") return combinedText.includes("lab") || combinedText.includes("komputer") || combinedText.includes("laboratorium");
    if (activeTab === "barang") return combinedText.includes("barang") || combinedText.includes("peralatan") || combinedText.includes("alat") || combinedText.includes("proyektor") || combinedText.includes("printer") || combinedText.includes("kamera") || combinedText.includes("multimedia") || combinedText.includes("cctv") || combinedText.includes("sound") || combinedText.includes("speaker") || combinedText.includes("micro") || combinedText.includes("headset") || combinedText.includes("vr") || combinedText.includes("ps5") || combinedText.includes("gpu");
    return true;
  });

  const isFilterActive = activeTab !== "semua" || searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white relative">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Page Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-5">
        
        {/* ── 1. Top Search, Filter & Action Bar (Direct & To-The-Point) ── */}
        <div className="bg-white border border-slate-200 rounded-none p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari fasilitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 rounded-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2C1EE8] outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsLoginModalOpen(true);
                    return;
                  }
                  fetchMyBookings();
                  setIsMyBookingsOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-none border border-slate-200 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#2C1EE8]" />
                <span>Peminjaman Saya</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchPublicBookings();
                  setIsPublicBookingsOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2C1EE8] hover:bg-[#2317be] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Jadwal Pinjaman</span>
              </button>
            </div>
          </div>

          {/* Horizontal Category Filter Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FACILITY_CATEGORIES.map((cat) => {
              const isSelected = activeTab === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveTab(cat.key)}
                  className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer border ${
                    isSelected
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Featured 3D Facility Showcase Slider (Collapsible when filtering) ── */}
        <AnimatePresence>
          {!isFilterActive && !isUnauthorized && (placesData.length > 0 || isLoading) && (
            <motion.div
              key="featured-3d-showcase"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <VerticalFacilitySlider
                items={placesData}
                isLoading={isLoading}
                onBookFacility={(item) => handleOpenModal(item)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3. Main Facilities Grid Section ── */}
        {isUnauthorized ? (
          <div className="py-12 bg-white border border-slate-200 rounded-none shadow-xs">
            <LoginRequiredFallback
              title="Silakan Masuk Untuk Mengakses Layanan Fasilitas"
              description="Informasi peminjaman dan inventaris sarana prasarana sekolah hanya dapat diakses oleh civitas akademika SMK Negeri 2 Surakarta yang terautentikasi."
              onLoginClick={() => setIsLoginModalOpen(true)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Daftar Fasilitas & Sarana</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({filteredPlaces.length} Sarana)
                </span>
              </h2>

              {isFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("semua");
                  }}
                  className="text-xs font-bold text-[#2C1EE8] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            <FacilitySection
              title="SARANA & INVENTARIS"
              items={filteredPlaces}
              isLoading={isLoading}
              onItemAction={(item) => handleOpenModal(item)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* SCHEDULE BOOKING MODAL */}
      {isModalOpen && selectedFacility && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          facility={selectedFacility}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* CART MODAL (QUICK SUMMARY) */}
      {isCartOpen && (
        <CartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
        />
      )}

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* ── MY BOOKINGS MODAL DRAWER (Sharp & Clean) ── */}
      {isMyBookingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-2xl max-h-[85vh] flex flex-col shadow-lg">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2C1EE8]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Riwayat Peminjaman Saya
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMyBookingsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingMyBookings ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Memuat data peminjaman...
                </div>
              ) : myBookingsData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  Belum ada riwayat peminjaman sarana prasarana.
                </div>
              ) : (
                myBookingsData.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {b.facilityName || b.facility?.name || "Fasilitas"}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-none bg-blue-50 text-[#2C1EE8] border border-blue-200">
                        {b.status || "Pending"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Waktu: {b.bookingDate || b.startTime} {b.endTime ? `s.d ${b.endTime}` : ""}
                    </p>
                    {b.purpose && (
                      <p className="text-xs text-slate-600 font-medium">
                        Keperluan: {b.purpose}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMyBookingsOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLIC BORROWINGS MODAL DRAWER (Sharp & Clean) ── */}
      {isPublicBookingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-2xl max-h-[85vh] flex flex-col shadow-lg">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2C1EE8]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Jadwal Pinjaman Fasilitas Publik
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPublicBookingsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingPublicBookings ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Memuat jadwal publik...
                </div>
              ) : publicBookingsData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  Belum ada jadwal peminjaman sarana publik yang aktif.
                </div>
              ) : (
                publicBookingsData.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-none space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {b.facilityName || b.facility?.name || "Fasilitas"}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.status || "Terjadwal"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Peminjam: {b.userName || b.borrowerName || "Siswa / Guru"} · {b.bookingDate || b.startTime}
                    </p>
                    {b.purpose && (
                      <p className="text-xs text-slate-600 font-medium">
                        Keperluan: {b.purpose}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPublicBookingsOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
