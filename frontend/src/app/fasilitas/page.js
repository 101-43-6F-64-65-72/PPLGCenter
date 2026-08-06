"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FacilitySection from "@/components/fasilitas/FacilitySection";
import ScheduleModal from "@/components/fasilitas/ScheduleModal";
import CartModal from "@/components/fasilitas/CartModal";
import { Search, ShoppingBag } from "lucide-react";
import facilityService from "@/services/facilityService";

export default function FasilitasPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("semua"); // 'semua' | 'tempat' | 'barang' | 'tersedia'
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Facility & Equipment Data State
  const [placesData, setPlacesData] = useState([]);
  const [itemsData, setItemsData] = useState([]);

  // Cart System States
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch facilities from endpoint via service
  useEffect(() => {
    let isMounted = true;
    async function loadFacilityData() {
      setIsLoading(true);
      const res = await facilityService.getFacilities();
      if (isMounted && res) {
        if (res.places) setPlacesData(res.places);
        if (res.items) setItemsData(res.items);
      }
      if (isMounted) setIsLoading(false);
    }
    loadFacilityData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = (facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFacility(null);
  };

  const handleAddToCart = (item) => {
    setCartItems((prev) => [...prev, item]);
  };

  const handleRemoveFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Filter places
  const filteredPlaces = placesData.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "barang") return false;
    if (activeTab === "tersedia" && item.status !== "tersedia") return false;
    return matchesSearch;
  });

  // Filter items
  const filteredItems = itemsData.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "tempat") return false;
    if (activeTab === "tersedia" && item.status !== "tersedia") return false;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans relative">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Page Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-24">
        {/* Page Banner Header */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Katalog Fasilitas & Peralatan
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mt-2">
                Jelajahi tempat dan sarana prasarana sekolah. Cek ketersediaan dan ajukan peminjaman secara mandiri dengan cepat.
              </p>
            </div>

            {/* Top Action Bar (Cart Drawer Trigger) */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#2c1ee8] text-white hover:bg-[#2218a3] transition-all cursor-pointer shadow-md active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Daftar Pinjaman ({cartItems.length})</span>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm animate-pulse">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari tempat atau barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2c1ee8] focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 text-sm transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "semua", label: "Semua" },
                { id: "tempat", label: "Tempat" },
                { id: "barang", label: "Barang" },
                { id: "tersedia", label: "Tersedia" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
                      ? "bg-[#2c1ee8] text-white shadow-md shadow-blue-500/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 1: TEMPAT */}
        {(activeTab === "semua" || activeTab === "tempat" || activeTab === "tersedia") && (
          <FacilitySection
            title="TEMPAT"
            type="facility"
            items={filteredPlaces}
            isLoading={isLoading}
            onItemAction={(item) => handleOpenModal(item)}
            onSeeAllClick={() => setActiveTab("tempat")}
          />
        )}

        {/* SECTION 2: BARANG */}
        {(activeTab === "semua" || activeTab === "barang" || activeTab === "tersedia") && (
          <FacilitySection
            title="BARANG"
            type="item"
            items={filteredItems}
            isLoading={isLoading}
            onItemAction={(item) => handleOpenModal(item)}
            onSeeAllClick={() => setActiveTab("barang")}
          />
        )}
      </main>

      {/* Floating Bottom Cart Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce-short">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-extrabold text-sm sm:text-base rounded-full shadow-2xl shadow-blue-600/40 border border-blue-400/30 transition-all active:scale-95 cursor-pointer"
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
    </div>
  );
}

