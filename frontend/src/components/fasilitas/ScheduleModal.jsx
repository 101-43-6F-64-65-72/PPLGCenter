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

  const slotsToDisplay = slots;
  const selectedSlotsToDisplay = slotsToDisplay.filter((s) =>
    selectedSlots.includes(s.id),
  );
  const selectedTimesFormatted = selectedSlotsToDisplay
    .map((s) => s.time)
    .join(", ");

  const toggleSlot = (slotId) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter((id) => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  // Validate that selected slots are still available before proceeding
  const validateBeforeAction = async (onValidated) => {
    setIsLoadingSlots(true);
    setConflictMessage("");

    const res = await bookingService.getSlotAvailability(
      facility,
      selectedDate,
    );
    if (res.success) {
      setSlots(res.slots);
      const availableIds = res.slots
        .filter((s) => s.available)
        .map((s) => s.id);
      const invalidSelected = selectedSlots.filter(
        (id) => !availableIds.includes(id),
      );

      if (invalidSelected.length > 0) {
        setSelectedSlots((prev) =>
          prev.filter((id) => availableIds.includes(id)),
        );
        setConflictMessage(
          "Maaf, salah satu slot yang Anda pilih telah dipesan oleh pengguna lain. Jadwal telah diperbarui.",
        );
        setIsLoadingSlots(false);
        return;
      }

      setIsLoadingSlots(false);
      onValidated();
    } else {
      setFetchError(res.message || "Gagal memverifikasi ketersediaan slot.");
      setIsLoadingSlots(false);
    }
  };

  const handleAddToCartClick = () => {
    if (selectedSlots.length === 0) return;
    validateBeforeAction(() => {
      if (onAddToCart) {
        onAddToCart({
          cartId: `${facility.id}-${selectedSlots.sort().join("-")}-${Date.now()}`,
          facilityId: facility.id,
          facilityTitle: facility.title,
          bookingDate: selectedDate,
          imageSrc: facility.imageSrc,
          selectedSlots: selectedSlots,
          slotFormatted: selectedTimesFormatted,
        });
      }
      setAddedToast(true);
      setTimeout(() => {
        setAddedToast(false);
        onClose();
      }, 1200);
    });
  };

  const handleNextToForm = () => {
    if (selectedSlots.length === 0) return;
    validateBeforeAction(() => {
      setStep(2);
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (selectedMembers.length === 0) {
      newErrors.members = "Wajib memilih minimal 1 siswa / teman yang ikut meminjam fasilitas.";
    }
    if (!activityName.trim()) {
      newErrors.activityName = "Nama kegiatan wajib diisi";
    }
    if (!description.trim()) {
      newErrors.description = "Deskripsi kegiatan wajib diisi";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const firstSlot = selectedSlotsToDisplay[0];
    const lastSlot =
      selectedSlotsToDisplay[selectedSlotsToDisplay.length - 1] || firstSlot;

    const startHour = firstSlot?.startHour ?? 7;
    const endHour = lastSlot?.endHour ?? startHour + 1;

    const startLocalDate = new Date(
      `${selectedDate}T${String(startHour).padStart(2, "0")}:00:00`,
    );
    const endLocalDate = new Date(
      `${selectedDate}T${String(endHour).padStart(2, "0")}:00:00`,
    );

    if (isNaN(startLocalDate.getTime()) || isNaN(endLocalDate.getTime())) {
      setErrors({ submit: "Format tanggal atau jam peminjaman tidak valid." });
      setIsSubmitting(false);
      return;
    }

    if (startLocalDate < new Date()) {
      setErrors({
        submit:
          "Waktu awal peminjaman tidak boleh di masa lalu. Silakan pilih tanggal atau jam di masa mendatang.",
      });
      setIsSubmitting(false);
      return;
    }

    // Format representative + batch students text
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl z-10 overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200 text-slate-900"
        >
          {isSuccess ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Pengajuan Peminjaman Berhasil Dikirim!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Pengajuan peminjaman bersama teman sekelas telah tercatat dan sedang menunggu verifikasi Bapak/Ibu Guru & Admin.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 bg-[#2C1EE8] hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Tutup Selesai
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Slot Selection */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Slot Selection Controls */}
              <div className="md:col-span-7 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-mono font-extrabold text-[#2C1EE8] uppercase tracking-wider">
                      Langkah 1 Dari 2
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      Pilih Jam Peminjaman
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {conflictMessage && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{conflictMessage}</span>
                  </div>
                )}

                {fetchError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center justify-between">
                    <span>{fetchError}</span>
                    <button
                      onClick={fetchAvailability}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Coba Lagi</span>
                    </button>
                  </div>
                )}

                {/* Date Input */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pilih Tanggal:
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#2C1EE8] focus:bg-white transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Slots List */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Daftar Slot Waktu:
                  </label>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {isLoadingSlots ? (
                      <div className="py-12 text-center text-xs text-slate-400 font-medium">
                        <div className="w-6 h-6 border-2 border-[#2C1EE8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Memeriksa ketersediaan jadwal...
                      </div>
                    ) : slotsToDisplay.length > 0 ? (
                      slotsToDisplay.map((slot) => {
                        const isSelected = selectedSlots.includes(slot.id);
                        if (!slot.available) {
                          return (
                            <div
                              key={slot.id}
                              className="p-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 flex items-center justify-between text-xs opacity-60 cursor-not-allowed"
                            >
                              <span className="font-bold">{slot.time}</span>
                              <span className="text-[10px] font-black uppercase bg-slate-200 px-2 py-0.5 rounded-md">
                                {slot.status || "Penuh"}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={slot.id}
                            onClick={() => toggleSlot(slot.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-blue-50/80 border-[#2C1EE8] shadow-2xs"
                                : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/80"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? "bg-[#2C1EE8] border-[#2C1EE8] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-slate-900">
                                {slot.time}
                              </span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              Tersedia
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                        Tidak ada slot waktu yang tersedia pada tanggal ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {addedToast && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200 animate-fade-in">
                      <Check className="w-4 h-4" />
                      <span>Berhasil ditambahkan ke daftar peminjaman!</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddToCartClick}
                      disabled={
                        selectedSlots.length === 0 ||
                        isLoadingSlots ||
                        facility.isActive === false ||
                        facility.status === "tidak tersedia"
                      }
                      className={`flex-1 px-4 py-3 font-bold text-xs rounded-2xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedSlots.length > 0 &&
                        !isLoadingSlots &&
                        facility.isActive !== false &&
                        facility.status !== "tidak tersedia"
                          ? "border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs"
                          : "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <Plus className="w-4 h-4 text-[#2C1EE8]" />
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
                      className={`flex-1 px-5 py-3 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-sm ${
                        selectedSlots.length > 0 &&
                        !isLoadingSlots &&
                        facility.isActive !== false &&
                        facility.status !== "tidak tersedia"
                          ? "bg-[#2C1EE8] hover:bg-blue-700 text-white"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <span>Lanjut Formulir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Facility Image / 3D Model Viewer */}
              <div className="md:col-span-5 h-[340px] sm:h-[400px] relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col shadow-2xs">
                {model3dUrl && (
                  <div className="flex items-center gap-1.5 p-3 bg-white border-b border-slate-200 shrink-0 z-20">
                    <button
                      type="button"
                      onClick={() => setActiveRightTab("image")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeRightTab === "image"
                          ? "bg-[#2C1EE8] text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab("3d")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeRightTab === "3d"
                          ? "bg-[#2C1EE8] text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
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
            <div className="space-y-6">
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#2C1EE8] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali pilih jam</span>
                </button>
                <div className="text-right">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Form Peminjaman Fasilitas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lengkapi daftar siswa peminjam & tujuan kegiatan
                  </p>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-start gap-3 text-xs text-[#2C1EE8] font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">
                    Sistem Perwakilan Peminjaman Siswa:
                  </strong>
                  Anda dapat memilih teman sekelas (atau lintas kelas PPLG) yang bersama-sama meminjam fasilitas ini dalam 1 pengajuan batch.
                </div>
              </div>

              {/* Selected Slot Information Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-[#2C1EE8]" />
                  <span>Informasi Jam & Fasilitas</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div>
                    <span className="text-xs text-slate-500">Fasilitas / Tempat:</span>
                    <p className="text-sm font-black text-slate-900">{facility.title}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs text-slate-500">Jam Terpilih ({selectedDate}):</span>
                    <p className="text-xs font-black text-[#2C1EE8] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl inline-block mt-0.5">
                      {selectedTimesFormatted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Server Submit Error Notice */}
              {errors.submit && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* Main Form Fields */}
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {/* 1. Batch Member Selection (Peminjam / Teman yang Diwakilkan) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-extrabold uppercase tracking-wider">
                      Daftar Siswa / Teman Peminjam <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBatchPickerOpen(true)}
                      className="px-3.5 py-1.5 bg-blue-50 text-[#2C1EE8] border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      {selectedMembers.map((m) => (
                        <span
                          key={m.userId || m.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-800 border border-slate-200 rounded-xl text-[11px] font-bold shadow-2xs"
                        >
                          <span>{m.fullName}</span>
                          <span className="text-[10px] text-[#2C1EE8] font-mono">({m.className || "PPLG"})</span>
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
                      className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-slate-500 cursor-pointer hover:bg-slate-100/80 transition-all flex flex-col items-center gap-1"
                    >
                      <Users className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-xs text-slate-700">
                        Klik di sini untuk memilih teman atau kelas yang ikut meminjam
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Mendukung pemilihan multi-user dan opsi &quot;Pilih Semua&quot; per kelas (X, XI, XII PPLG A & B).
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Nama Kegiatan */}
                <div>
                  <label className="block text-slate-700 font-extrabold uppercase tracking-wider mb-1">
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
                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white text-xs font-medium focus:outline-hidden focus:border-[#2C1EE8] transition-all ${
                      errors.activityName
                        ? "border-rose-400 focus:border-rose-500"
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

                {/* 3. Deskripsi / Tujuan Peminjaman */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-extrabold uppercase tracking-wider">
                      Deskripsi & Keterangan Tambahan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {description.length}/400 karakter
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
                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white text-xs font-medium focus:outline-hidden focus:border-[#2C1EE8] transition-all resize-none ${
                      errors.description
                        ? "border-rose-400 focus:border-rose-500"
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
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Batal / Ubah Jam
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-7 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
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
