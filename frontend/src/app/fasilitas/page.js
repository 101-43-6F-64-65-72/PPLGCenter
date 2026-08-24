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
import { Search, ShoppingBag, X, Clock, Building2, Trash2, Filter, ChevronDown } from "lucide-react";
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
    return "Ruang serbaguna utama berkapasitas besar dengan panggung, sound system pro, pendingin ruangan (AC), dan pencahayaan panggung. Sangat ideal untuk seminar, rapat pleno, perpisahan, dan pergelaran seni siswa.";
  }
  if (text.includes("lapangan") || text.includes("basket") || text.includes("futsal") || text.includes("voli") || text.includes("olahraga")) {
    return "Stadion & lapangan sarana olahraga outdoor serbaguna berlantai standar nasional dengan garis lapangan basket, voli, dan futsal. Dilengkapi tribun penonton, papan skor digital, dan pencahayaan malam.";
  }
  if (text.includes("lab") || text.includes("komputer") || text.includes("laboratorium") || text.includes("pplg") || text.includes("tjkt")) {
    return "Laboratorium komputer modern dengan 36+ PC spesifikasi tinggi, koneksi internet serat optik kecepatan tinggi, pendingin ruangan, dan proyektor presentasi untuk kebutuhan ujian berbasis komputer & workshop praktikum.";
  }
  if (text.includes("halaman") || text.includes("taman") || text.includes("depan") || text.includes("area")) {
    return "Area ruang terbuka hijau dan lapangan utama SMKN 2 Surakarta. Tempat serbaguna untuk pelaksanaan upacara bendera, bazar UMKM siswa, expo ekstrakurikuler, dan kegiatan outdoor.";
  }
  if (text.includes("perpustakaan") || text.includes("baca")) {
    return "Ruang literasi ber-AC yang nyaman dengan ribuan koleksi buku referensi akademik, literatur digital, meja belajar diskusi kelompok, serta area baca terpisah.";
  }
  return "Fasilitas dan sarana prasarana resmi SMK Negeri 2 Surakarta yang dirancang mendukung kegiatan pembelajaran, keorganisasian siswa, dan kegiatan operasional sekolah secara optimal.";
};

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
        // Normalize: res.data may be PagedResult { items, totalCount } or flat array
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Page Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        {/* Top Direct Action & Filter Toolbar */}
        <div className="bg-white px-5 py-3.5 sm:py-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Search & Category Filter Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari fasilitas, aula, lab, atau peralatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2C1EE8] focus:outline-hidden text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative shrink-0 min-w-[170px]">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2C1EE8] pointer-events-none" />
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:border-[#2C1EE8] focus:outline-hidden text-xs font-bold text-slate-700 cursor-pointer transition-all shadow-2xs"
              >
                <option value="semua">Semua Kategori</option>
                <option value="aula">Aula & Ruang</option>
                <option value="lapangan">Lapangan</option>
                <option value="lab">Laboratorium</option>
                <option value="barang">Peralatan & Barang</option>
                <option value="tersedia">Hanya Tersedia</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setIsLoginModalOpen(true);
                  return;
                }
                fetchMyBookings();
                setIsMyBookingsOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#2C1EE8]" />
              <span>Peminjaman Saya</span>
            </button>

            <button
              onClick={() => {
                fetchPublicBookings();
                setIsPublicBookingsOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2C1EE8] text-white hover:bg-[#2013ce] transition shadow-xs cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Daftar Pinjaman</span>
            </button>
          </div>
        </div>

        {/* Featured 3D Facility Showcase Slider with Smooth Collapse/Expand Transition */}
        <AnimatePresence>
          {!isFilterActive && !isUnauthorized && (placesData.length > 0 || isLoading) && (
            <motion.div
              key="featured-3d-showcase"
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{
                opacity: 1,
                height: "auto",
                scale: 1,
                transition: {
                  height: { duration: 0.45, ease: [0.25, 1, 0.5, 1] },
                  opacity: { duration: 0.3, delay: 0.1 },
                  scale: { duration: 0.35, ease: "easeOut" },
                },
              }}
              exit={{
                opacity: 0,
                height: 0,
                scale: 0.97,
                transition: {
                  opacity: { duration: 0.2, ease: "easeIn" },
                  scale: { duration: 0.25, ease: "easeIn" },
                  height: { duration: 0.4, ease: [0.25, 1, 0.5, 1], delay: 0.05 },
                },
              }}
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

        {/* SECTION: TEMPAT / FASILITAS */}
        {isUnauthorized ? (
          <LoginRequiredFallback featureName="Katalog Fasilitas" />
        ) : (
          <FacilitySection
            title="Daftar Sarana & Prasarana"
            type="facility"
            items={filteredPlaces}
            isLoading={isLoading}
            onItemAction={(item) => handleOpenModal(item)}
            onOpen3D={(url, title) => {
              setActive3DPath(url);
              setActive3DTitle(title);
              setIs3DModalOpen(true);
            }}
          />
        )}
      </main>

      <Footer />

      {/* Floating Bottom Cart Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-[#2c1ee8] hover:bg-[#2013ce] text-white font-extrabold text-sm sm:text-base rounded-full shadow-2xl shadow-blue-600/40 border border-blue-400/30 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                {cartItems.length}
              </span>
            </div>
            <span>Daftar Peminjaman ({cartItems.length})</span>
          </button>
        </div>
      )}

      {/* Interactive Schedule Booking Modal */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        facility={selectedFacility}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Modal (Bulk Checkout Form) */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* My Bookings History Modal */}
      {isMyBookingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[85vh] flex flex-col font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2c1ee8] flex items-center justify-center font-black">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Peminjaman Fasilitas Saya</h3>
                  <p className="text-xs text-gray-500">Pantau status pengajuan peminjaman tempat Anda secara real-time</p>
                </div>
              </div>
              <button
                onClick={() => setIsMyBookingsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-2">
              {loadingMyBookings ? (
                <div className="space-y-3 py-1">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 animate-pulse space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="w-32 h-4 bg-slate-200 rounded-md" />
                        <div className="w-20 h-5 bg-slate-200 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="w-1/2 h-3.5 bg-slate-100 rounded-md" />
                        <div className="w-3/4 h-3.5 bg-slate-100 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : myBookingsData.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="font-extrabold text-gray-700 text-sm">Belum ada peminjaman aktif</p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Anda belum mengajukan peminjaman tempat. Pilih fasilitas dari katalog untuk mulai mengajukan.
                  </p>
                </div>
              ) : (
                myBookingsData.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/50 hover:bg-gray-50 transition space-y-2">
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                      <div>
                        <h4 className="font-black text-gray-900 text-sm uppercase">{b.facilityTitle}</h4>
                        <span className="text-[11px] text-gray-400 font-medium">Tanggal: {b.date}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                          b.status?.includes("Disetujui")
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : b.status?.includes("Ditolak")
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong className="text-gray-800">Jam:</strong> <span className="text-[#2c1ee8] font-bold">{b.slotFormatted}</span></p>
                      <p><strong className="text-gray-800">Kegiatan:</strong> {b.activityName}</p>
                      {b.description && <p className="text-gray-500 italic text-[11px]">&quot;{b.description}&quot;</p>}
                    </div>

                    {b.status?.includes("Menunggu") && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Apakah Anda yakin ingin membatalkan pengajuan peminjaman ini?")) return;
                            try {
                              await bookingService.cancelBooking?.(b.id);
                              fetchMyBookings();
                            } catch (err) {
                              alert("Gagal membatalkan peminjaman.");
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Batalkan Pengajuan
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Public Borrowings Transparency Schedule Modal (Daftar Pinjaman Semua) */}
      {isPublicBookingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[85vh] flex flex-col font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#2c1ee8] flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Daftar Jadwal Peminjaman Fasilitas</h3>
                  <p className="text-xs text-gray-500">Transparansi jadwal peminjaman tempat oleh seluruh organisasi & siswa</p>
                </div>
              </div>
              <button
                onClick={() => setIsPublicBookingsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-1">
              {loadingPublicBookings ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white animate-pulse">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">Fasilitas / Tempat</th>
                        <th className="p-3.5">Tanggal & Waktu</th>
                        <th className="p-3.5">Organisasi Peminjam</th>
                        <th className="p-3.5">Status Peminjaman</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx}>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-slate-200 rounded-md shrink-0" />
                              <div className="w-28 h-4 bg-slate-200 rounded-md" />
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-1.5">
                              <div className="w-20 h-3.5 bg-slate-200 rounded-md" />
                              <div className="w-24 h-4 bg-slate-100 rounded-md" />
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <div className="w-24 h-3.5 bg-slate-200 rounded-md" />
                              <div className="w-32 h-3 bg-slate-100 rounded-md" />
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="w-20 h-6 bg-slate-100 rounded-full" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : publicBookingsData.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="font-extrabold text-gray-700 text-sm">Belum Ada Peminjaman Terdaftar</p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Saat ini belum ada jadwal peminjaman fasilitas yang tercatat di sistem.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="p-3.5">Fasilitas / Tempat</th>
                        <th className="p-3.5">Tanggal & Waktu (Jam)</th>
                        <th className="p-3.5">Organisasi Peminjam</th>
                        <th className="p-3.5">Status Peminjaman</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {publicBookingsData.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70 transition">
                          {/* 1. Nama Fasilitas */}
                          <td className="p-3.5 font-extrabold text-gray-900">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#2c1ee8] flex-shrink-0" />
                              <span className="uppercase">{b.facilityTitle}</span>
                            </div>
                          </td>

                          {/* 2. Tanggal / Waktu */}
                          <td className="p-3.5 text-gray-700">
                            <div className="space-y-0.5">
                              <span className="block font-bold text-gray-900">{b.date}</span>
                              <span className="inline-block bg-blue-50 text-[#2c1ee8] px-2 py-0.5 rounded font-extrabold text-[11px]">
                                {b.slotFormatted}
                              </span>
                            </div>
                          </td>

                          {/* 3. Nama Organisasi */}
                          <td className="p-3.5 font-bold text-gray-800">
                            <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg">
                              {b.organization}
                            </span>
                          </td>

                          {/* 4. Status */}
                          <td className="p-3.5">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${
                                b.status?.includes("Disetujui")
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : b.status?.includes("Ditolak")
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal Prompt for Unauthenticated Users */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

