"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Check,
  X,
  ArrowLeft,
  Clock,
  Send,
  ShieldCheck,
  Users,
  AlertCircle,
  Plus,
  Calendar,
  RotateCcw,
  UserPlus,
  Box,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import bookingService from "@/services/bookingService";
import StudentBatchPickerModal from "@/components/fasilitas/StudentBatchPickerModal";
import DesktopComputerViewer3D from "@/components/common/DesktopComputerViewer3D";
import { resolve3DModelUrl } from "@/config/storage3dModels";

export default function ScheduleModal({
  isOpen,
  onClose,
  facility,
  onAddToCart,
}) {
  const [step, setStep] = useState(1); // 1: Slot selection, 2: Borrowing Form
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [conflictMessage, setConflictMessage] = useState("");

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const model3dUrl = resolve3DModelUrl(facility);

  const [activeRightTab, setActiveRightTab] = useState(
    model3dUrl ? "3d" : "image",
  );

  useEffect(() => {
    if (facility) {
      const mUrl = resolve3DModelUrl(facility);
      setActiveRightTab(mUrl ? "3d" : "image");
    }
  }, [facility]);

  // Fetch dynamic slot availability from bookingService
  const fetchAvailability = useCallback(async () => {
    if (!facility) return;
    setIsLoadingSlots(true);
    setFetchError("");
    setConflictMessage("");

    const res = await bookingService.getSlotAvailability(
      facility,
      selectedDate,
    );
    if (res.success) {
      setSlots(res.slots);
      // Remove any selected slot that is no longer available
      const availableIds = res.slots
        .filter((s) => s.available)
        .map((s) => s.id);
      setSelectedSlots((prev) =>
        prev.filter((id) => availableIds.includes(id)),
      );
    } else {
      setFetchError(res.message || "Gagal memuat jadwal ketersediaan.");
    }
    setIsLoadingSlots(false);
  }, [facility, selectedDate]);

  // Load availability when modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen && facility) {
      queueMicrotask(() => {
        if (isMounted) fetchAvailability();
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, facility, selectedDate, fetchAvailability]);

  // Reset state on modal open/close
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setStep(1);
      setSelectedSlots([]);
      setSelectedMembers([]);
      setBatchPickerOpen(false);
      setActivityName("");
      setDescription("");
      setErrors({});
      setIsSuccess(false);
      setAddedToast(false);
      setFetchError("");
      setConflictMessage("");
    }
  }

  if (!isOpen || !facility) return null;

  // Real mock default slots if backend returns empty or loading
  const defaultSlotsFallback = [
    { id: 1, time: "07.00 - 08.30 WIB", available: true, status: "Tersedia" },
    { id: 2, time: "08.30 - 10.00 WIB", available: true, status: "Tersedia" },
    { id: 3, time: "10.15 - 11.45 WIB", available: true, status: "Tersedia" },
    { id: 4, time: "12.30 - 14.00 WIB", available: true, status: "Tersedia" },
    { id: 5, time: "14.00 - 15.30 WIB", available: true, status: "Tersedia" },
    { id: 6, time: "15.30 - 17.00 WIB", available: true, status: "Tersedia" },
  ];

  const slotsToDisplay =
    slots && slots.length > 0 ? slots : defaultSlotsFallback;

  // Toggle selection of single or multiple slots
  const toggleSlot = (id) => {
    setConflictMessage("");
    setSelectedSlots((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  // Format selected times preview text
  const selectedTimesFormatted =
    selectedSlots.length > 0
      ? slotsToDisplay
          .filter((s) => selectedSlots.includes(s.id))
          .map((s) => s.time)
          .join(", ")
      : "";

  // Advance to Step 2: Form
  const handleNextToForm = () => {
    if (selectedSlots.length === 0) {
      setConflictMessage("Wajib memilih minimal 1 slot jam peminjaman.");
      return;
    }
    setConflictMessage("");
    setStep(2);
  };

  // Add selected slots to cart (quick schedule reservation)
  const handleAddToCartClick = () => {
    if (selectedSlots.length === 0) return;
    const selectedSlotItems = slotsToDisplay.filter((s) =>
      selectedSlots.includes(s.id),
    );

    selectedSlotItems.forEach((slotItem) => {
      onAddToCart({
        cartId: `${facility.id}_${selectedDate}_${slotItem.id}_${Date.now()}_${Math.random()}`,
        facilityId: facility.id,
        facilityTitle: facility.title,
        facilityImage: facility.imageSrc,
        date: selectedDate,
        slotId: slotItem.id,
        slotTime: slotItem.time,
      });
    });

    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      onClose();
    }, 1200);
  };

  // Submit direct booking form with representative & batch students
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (selectedMembers.length === 0) {
      newErrors.members = "Wajib memilih minimal 1 siswa / teman yang ikut meminjam fasilitas.";
    }
    if (!activityName.trim()) {
      newErrors.activityName = "Nama kegiatan wajib diisi.";
    }
    if (!description.trim()) {
      newErrors.description = "Deskripsi & keperluan wajib diisi.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const chosenSlotObjs = slotsToDisplay.filter((s) =>
      selectedSlots.includes(s.id),
    );

    let startSlotTime = "07:00";
    let endSlotTime = "17:00";

    if (chosenSlotObjs.length > 0) {
      const times = chosenSlotObjs.map((s) => s.time);
      const firstTimeStr = times[0];
      const lastTimeStr = times[times.length - 1];

      const startMatch = firstTimeStr.match(/(\d{2})[.:](\d{2})/);
      const endMatch = lastTimeStr.match(/s\.d\s*(\d{2})[.:](\d{2})|-.*?(\d{2})[.:](\d{2})/);

      if (startMatch) {
        startSlotTime = `${startMatch[1]}:${startMatch[2]}`;
      }
      if (endMatch) {
        const h = endMatch[1] || endMatch[3];
        const m = endMatch[2] || endMatch[4];
        if (h && m) endSlotTime = `${h}:${m}`;
      }
    }

    const startLocalDate = new Date(`${selectedDate}T${startSlotTime}:00`);
    const endLocalDate = new Date(`${selectedDate}T${endSlotTime}:00`);

    if (startLocalDate < new Date()) {
      setErrors({
        submit:
          "Waktu awal peminjaman tidak boleh di masa lalu. Silakan pilih tanggal atau jam di masa mendatang.",
      });
      setIsSubmitting(false);
      return;
    }

    const membersSummary = selectedMembers.map((m) => `${m.fullName} (${m.className || "PPLG"})`).join(", ");
    let fullPurpose = `[Peminjam: ${selectedMembers.length} Siswa - ${membersSummary}] ${activityName.trim()}: ${description.trim()}`;
    if (fullPurpose.length > 500) {
      fullPurpose = fullPurpose.substring(0, 497) + "...";
    }

    const res = await bookingService.createBooking({
      facilityId: facility.id,
      purpose: fullPurpose,
      startTime: startLocalDate.toISOString(),
      endTime: endLocalDate.toISOString(),
    });

    if (res.success) {
      setIsSuccess(true);
      await fetchAvailability();
    } else {
      setErrors({
        submit: res.message || "Gagal menyimpan pengajuan peminjaman.",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="relative bg-white w-full max-w-4xl rounded-none shadow-xl z-10 p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200 text-slate-900 text-left"
        >
          {isSuccess ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-none flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 uppercase">
                Pengajuan Peminjaman Berhasil Dikirim!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Pengajuan peminjaman bersama teman sekelas telah tercatat dan sedang menunggu verifikasi Bapak/Ibu Guru & Admin.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                >
                  Tutup Selesai
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Slot Selection */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Slot Selection Controls */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#2C1EE8] uppercase tracking-wider">
                      Langkah 1 Dari 2
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 uppercase mt-0.5">
                      Pilih Jam Peminjaman
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {conflictMessage && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-none text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{conflictMessage}</span>
                  </div>
                )}

                {fetchError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-none text-xs font-medium flex items-center justify-between">
                    <span>{fetchError}</span>
                    <button
                      onClick={fetchAvailability}
                      className="px-2 py-0.5 bg-rose-600 text-white rounded-none text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Coba Lagi</span>
                    </button>
                  </div>
                )}

                {/* Date Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pilih Tanggal:
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#2C1EE8] focus:bg-white outline-none transition cursor-pointer"
                  />
                </div>

                {/* Slots List */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daftar Slot Waktu:
                  </label>

                  <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                    {isLoadingSlots ? (
                      <div className="py-10 text-center text-xs text-slate-400 font-medium">
                        <div className="w-5 h-5 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Memeriksa ketersediaan jadwal...
                      </div>
                    ) : slotsToDisplay.length > 0 ? (
                      slotsToDisplay.map((slot) => {
                        const isSelected = selectedSlots.includes(slot.id);
                        if (!slot.available) {
                          return (
                            <div
                              key={slot.id}
                              className="p-2.5 rounded-none border border-slate-100 bg-slate-50 text-slate-400 flex items-center justify-between text-xs opacity-60 cursor-not-allowed"
                            >
                              <span className="font-bold">{slot.time}</span>
                              <span className="text-[9.5px] font-bold uppercase bg-slate-200 px-2 py-0.5 rounded-none">
                                {slot.status || "Penuh"}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={slot.id}
                            onClick={() => toggleSlot(slot.id)}
                            className={`p-2.5 rounded-none border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-blue-50/80 border-[#2C1EE8]"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-none border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-[#2C1EE8] border-[#2C1EE8] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="text-xs font-bold text-slate-900">
                                {slot.time}
                              </span>
                            </div>
                            <span className="text-[9.5px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none">
                              Tersedia
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-5 text-center text-xs text-slate-400 bg-slate-50 rounded-none border border-slate-200">
                        Tidak ada slot waktu yang tersedia pada tanggal ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {addedToast && (
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-none text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200">
                      <Check className="w-4 h-4" />
                      <span>Berhasil ditambahkan ke daftar peminjaman!</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddToCartClick}
                      disabled={
                        selectedSlots.length === 0 ||
                        isLoadingSlots ||
                        facility.isActive === false ||
                        facility.status === "tidak tersedia"
                      }
                      className={`flex-1 px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-none border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedSlots.length > 0 &&
                        !isLoadingSlots &&
                        facility.isActive !== false &&
                        facility.status !== "tidak tersedia"
                          ? "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                          : "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-[#2C1EE8]" />
                      <span>Tambah ({selectedSlots.length} Slot)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextToForm}
                      disabled={
                        selectedSlots.length === 0 ||
                        isLoadingSlots ||
                        facility.isActive === false ||
                        facility.status === "tidak tersedia"
                      }
                      className={`flex-1 px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-xs ${
                        selectedSlots.length > 0 &&
                        !isLoadingSlots &&
                        facility.isActive !== false &&
                        facility.status !== "tidak tersedia"
                          ? "bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <span>Lanjut Formulir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Facility Image / 3D Model Viewer */}
              <div className="md:col-span-5 h-[320px] sm:h-[380px] relative rounded-none overflow-hidden border border-slate-200 bg-slate-50 flex flex-col shadow-2xs">
                {model3dUrl && (
                  <div className="hidden sm:flex items-center gap-1 p-2 bg-white border-b border-slate-200 shrink-0 z-20">
                    <button
                      type="button"
                      onClick={() => setActiveRightTab("image")}
                      className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 border ${
                        activeRightTab === "image"
                          ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-transparent"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab("3d")}
                      className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 border ${
                        activeRightTab === "3d"
                          ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-transparent"
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>3D Model</span>
                    </button>
                  </div>
                )}

                <div className="flex-1 relative w-full h-full overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeRightTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full relative"
                    >
                      {model3dUrl && activeRightTab === "3d" ? (
                        <DesktopComputerViewer3D
                          glbPath={model3dUrl}
                          title={facility.title || facility.name}
                          subtitle={facility.location}
                          compact={true}
                          hideControls={true}
                          hideToolbar={true}
                          lightMode={true}
                          className="h-full rounded-none border-none shadow-none bg-slate-50"
                        />
                      ) : (
                        <Image
                          src={facility.imageSrc || "/images/tempat/lapangansmkn2ska.jpg"}
                          alt={facility.title || "Facility Image"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                          priority
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: BORROWING FORM */
            <div className="space-y-4">
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#2C1EE8] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali pilih jam</span>
                </button>
                <div className="text-right">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase">
                    Form Peminjaman Fasilitas
                  </h2>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-none flex items-start gap-2.5 text-xs text-[#2C1EE8] font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">
                    Sistem Perwakilan Peminjaman Siswa:
                  </strong>
                  Anda dapat memilih teman sekelas (atau lintas kelas PPLG) yang bersama-sama meminjam fasilitas ini dalam 1 pengajuan batch.
                </div>
              </div>

              {/* Selected Slot Information Box */}
              <div className="bg-slate-50 p-3.5 rounded-none border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-[#2C1EE8]" />
                  <span>Informasi Jam & Fasilitas</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-0.5">
                  <div>
                    <span className="text-[11px] text-slate-400">Fasilitas / Tempat:</span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{facility.title}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400">Jam Terpilih ({selectedDate}):</span>
                    <p className="text-xs font-mono font-bold text-[#2C1EE8] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-none inline-block ml-1">
                      {selectedTimesFormatted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Server Submit Error Notice */}
              {errors.submit && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-none text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* Main Form Fields */}
              <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
                {/* 1. Batch Member Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold uppercase tracking-wider">
                      Daftar Siswa / Teman Peminjam <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBatchPickerOpen(true)}
                      className="px-3 py-1 bg-blue-50 text-[#2C1EE8] border border-blue-200 rounded-none text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Pilih Teman / Kelas ({selectedMembers.length})</span>
                    </button>
                  </div>

                  {errors.members && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.members}
                    </p>
                  )}

                  {selectedMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-none border border-slate-200">
                      {selectedMembers.map((m) => (
                        <span
                          key={m.userId || m.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white text-slate-800 border border-slate-200 rounded-none text-[11px] font-medium"
                        >
                          <span>{m.fullName}</span>
                          <span className="text-[10px] text-[#2C1EE8] font-mono font-bold">({m.className || "PPLG"})</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMembers(
                                selectedMembers.filter((item) => (item.id || item.userId) !== (m.id || m.userId))
                              )
                            }
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => setBatchPickerOpen(true)}
                      className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-none text-center text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors flex flex-col items-center gap-1"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-xs text-slate-700">
                        Klik di sini untuk memilih teman atau kelas yang ikut meminjam
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Nama Kegiatan */}
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Nama Kegiatan / Keperluan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kerja Kelompok Project Web PPLG / Latihan UKK"
                    value={activityName}
                    onChange={(e) => {
                      setActivityName(e.target.value);
                      if (errors.activityName)
                        setErrors({ ...errors, activityName: null });
                    }}
                    className={`w-full px-3 py-2 rounded-none border bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#2C1EE8] transition ${
                      errors.activityName
                        ? "border-rose-400"
                        : "border-slate-200"
                    }`}
                  />
                  {errors.activityName && (
                    <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.activityName}
                    </p>
                  )}
                </div>

                {/* 3. Deskripsi */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-bold uppercase tracking-wider">
                      Deskripsi & Keterangan Tambahan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {description.length}/400
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={400}
                    placeholder="Jelaskan kebutuhan perangkat khusus, perkiraan jumlah komputer yang dipakai, dll..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description)
                        setErrors({ ...errors, description: null });
                    }}
                    className={`w-full px-3 py-2 rounded-none border bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#2C1EE8] transition resize-none ${
                      errors.description
                        ? "border-rose-400"
                        : "border-slate-200"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        {/* Student Batch Picker Modal */}
        <StudentBatchPickerModal
          isOpen={batchPickerOpen}
          onClose={() => setBatchPickerOpen(false)}
          initialSelected={selectedMembers}
          onSave={(users) => {
            setSelectedMembers(users);
            if (errors.members) setErrors({ ...errors, members: null });
          }}
        />
      </div>
    </AnimatePresence>
  );
}
