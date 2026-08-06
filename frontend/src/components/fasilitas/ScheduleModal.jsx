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
} from "lucide-react";
import bookingService from "@/services/bookingService";
import OrganizationSelect from "@/components/common/OrganizationSelect";

export default function ScheduleModal({ isOpen, onClose, facility, onAddToCart }) {
  const [step, setStep] = useState(1); // 1: Slot selection, 2: Borrowing Form
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState([]);
  const [extracurriculars, setExtracurriculars] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [conflictMessage, setConflictMessage] = useState("");

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [organization, setOrganization] = useState("");
  const [customOrg, setCustomOrg] = useState("");
  const [activityName, setActivityName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dynamic slot availability from bookingService
  const fetchAvailability = useCallback(async () => {
    if (!facility) return;
    setIsLoadingSlots(true);
    setFetchError("");
    setConflictMessage("");

    const res = await bookingService.getSlotAvailability(facility, selectedDate);
    if (res.success) {
      setSlots(res.slots);
      // Remove any selected slot that is no longer available
      const availableIds = res.slots.filter((s) => s.available).map((s) => s.id);
      setSelectedSlots((prev) => prev.filter((id) => availableIds.includes(id)));
    } else {
      setFetchError(res.message || "Gagal memuat jadwal ketersediaan.");
    }
    setIsLoadingSlots(false);
  }, [facility, selectedDate]);

  // Load availability & extracurriculars when modal opens
  useEffect(() => {
    if (isOpen && facility) {
      fetchAvailability();
    }
  }, [isOpen, facility, selectedDate, fetchAvailability]);

  useEffect(() => {
    async function loadExtracurriculars() {
      try {
        const res = await extracurricularService.getExtracurriculars();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setExtracurriculars(res.data);
        }
      } catch (err) {
        // Safe catch
      }
    }
    loadExtracurriculars();
  }, []);

  // Reset state on modal open/close
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setStep(1);
      setSelectedSlots([]);
      setOrganization("");
      setCustomOrg("");
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
  const selectedSlotsToDisplay = slotsToDisplay.filter((s) => selectedSlots.includes(s.id));
  const selectedTimesFormatted = selectedSlotsToDisplay.map((s) => s.time).join(", ");



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

    const res = await bookingService.getSlotAvailability(facility, selectedDate);
    if (res.success) {
      setSlots(res.slots);
      const availableIds = res.slots.filter((s) => s.available).map((s) => s.id);
      const invalidSelected = selectedSlots.filter((id) => !availableIds.includes(id));

      if (invalidSelected.length > 0) {
        setSelectedSlots((prev) => prev.filter((id) => availableIds.includes(id)));
        setConflictMessage("Maaf, salah satu slot yang Anda pilih telah dipesan oleh pengguna lain. Jadwal telah diperbarui.");
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

    const finalOrg = organization === "Lainnya (Ketik Manual)" ? customOrg.trim() : organization;
    if (!finalOrg) {
      newErrors.organization = "Nama organisasi terdaftar wajib dipilih atau diisi";
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
    const lastSlot = selectedSlotsToDisplay[selectedSlotsToDisplay.length - 1] || firstSlot;

    const startHour = firstSlot?.startHour ?? 7;
    const endHour = lastSlot?.endHour ?? (startHour + 1);

    const startTimeIso = new Date(`${selectedDate}T${String(startHour).padStart(2, "0")}:00:00Z`).toISOString();
    const endTimeIso = new Date(`${selectedDate}T${String(endHour).padStart(2, "0")}:00:00Z`).toISOString();

    const res = await bookingService.createBooking({
      facilityId: facility.id,
      purpose: `${finalOrg} - ${activityName.trim()}: ${description.trim()}`,
      startTime: startTimeIso,
      endTime: endTimeIso,
    });

    if (res.success) {
      setIsSuccess(true);
      await fetchAvailability();
    } else {
      setErrors({ submit: res.message || "Gagal menyimpan pengajuan booking." });
    }
    setIsSubmitting(false);
  };

  const finalOrgDisplay = organization === "Lainnya (Ketik Manual)" ? customOrg : organization;

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

        {/* Modal Main Content Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden z-10 border border-gray-100 p-6 sm:p-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Close X Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer z-20"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            <div className="py-12 text-center space-y-5 max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-50 text-[#2c1ee8] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  Pengajuan Peminjaman Berhasil!
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Permohonan peminjaman <strong>{facility.title}</strong> oleh <strong>{finalOrgDisplay}</strong> untuk kegiatan <strong>&quot;{activityName}&quot;</strong> telah berhasil dikirim.
                </p>
              </div>

              <div className="p-4 bg-blue-50/80 rounded-2xl text-xs text-[#2c1ee8] font-medium border border-blue-100 flex items-center gap-3 text-left">
                <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                <span>Form ini telah diteruskan ke <strong>Guru</strong> dan <strong>Admin</strong> untuk proses verifikasi. Status pengajuan dapat dipantau secara berkala.</span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Selesai
              </button>
            </div>
          ) : step === 1 ? (
            /* STEP 1: TIME SLOT SELECTION */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* LEFT COLUMN: Title & Slot List */}
              <div className="md:col-span-7 flex flex-col justify-between h-full">
                <div>
                  <h2 className="text-4xl sm:text-5xl font-black text-gray-900 uppercase tracking-tight leading-none mb-4">
                    {facility.title || "LAPANGAN"}
                  </h2>

                  {/* Date Selector Bar */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-200/80">
                    <label htmlFor="bookingDate" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#2c1ee8]" />
                      <span>Tanggal Peminjaman:</span>
                    </label>
                    <input
                      id="bookingDate"
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#2c1ee8] cursor-pointer"
                    />
                  </div>

                  {/* Conflict Notice */}
                  {conflictMessage && (
                    <div className="mb-4 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                      <span>{conflictMessage}</span>
                    </div>
                  )}

                  {/* Error & Retry State */}
                  {fetchError && (
                    <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold space-y-2">
                      <p>{fetchError}</p>
                      <button
                        onClick={fetchAvailability}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Coba Lagi</span>
                      </button>
                    </div>
                  )}

                  {/* Slot Rows List */}
                  <div className="space-y-3.5 mb-8">
                    {isLoadingSlots ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                      ))
                    ) : slotsToDisplay.length > 0 ? (
                      slotsToDisplay.map((slot) => {
                        const isSelected = selectedSlots.includes(slot.id);

                        if (!slot.available) {
                          return (
                            <div key={slot.id} className="flex items-center gap-3.5">
                              <div className="w-7 h-7 rounded-full border-2 border-rose-500/80 flex items-center justify-center text-rose-500 flex-shrink-0">
                                <X className="w-4 h-4 stroke-[3]" />
                              </div>
                              <div className="flex-1 bg-[#ff8a8a] text-gray-900 font-medium px-5 py-3 rounded-xl flex items-center justify-between text-sm sm:text-base shadow-sm">
                                <span className="font-semibold">{slot.time}</span>
                                <span className="font-medium text-gray-800">{slot.status}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={slot.id} className="flex items-center gap-3.5">
                            <button
                              type="button"
                              onClick={() => toggleSlot(slot.id)}
                              className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[#2c1ee8] bg-[#2c1ee8] text-white shadow-sm"
                                  : "border-gray-400 bg-white hover:border-[#2c1ee8]"
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                            </button>

                            <div
                              onClick={() => toggleSlot(slot.id)}
                              className={`flex-1 font-medium px-5 py-3 rounded-xl flex items-center justify-between text-sm sm:text-base cursor-pointer transition-all shadow-sm ${
                                isSelected
                                  ? "bg-[#2c1ee8] text-white font-bold shadow-md"
                                  : "bg-blue-100 hover:bg-blue-200 text-gray-900"
                              }`}
                            >
                              <span className="font-semibold">{slot.time}</span>
                              <span className="font-medium">{slot.status}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded-2xl">
                        Tidak ada slot waktu tersedia pada tanggal ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2">
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
                      disabled={selectedSlots.length === 0 || isLoadingSlots}
                      className={`flex-1 px-5 py-3.5 font-bold text-sm rounded-2xl border transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                        selectedSlots.length > 0 && !isLoadingSlots
                          ? "border-[#2c1ee8] text-[#2c1ee8] bg-blue-50/60 hover:bg-blue-100/80 active:scale-95 shadow-sm"
                          : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah ({selectedSlots.length} Slot)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextToForm}
                      disabled={selectedSlots.length === 0 || isLoadingSlots}
                      className={`flex-1 px-5 py-3.5 font-bold text-sm rounded-2xl shadow-md transition-all duration-200 cursor-pointer ${
                        selectedSlots.length > 0 && !isLoadingSlots
                          ? "bg-[#2c1ee8] hover:bg-[#2218a3] text-white active:scale-95 shadow-blue-500/25"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <span>Pinjam Langsung</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Facility Image */}
              <div className="md:col-span-5 h-[340px] sm:h-[400px] relative rounded-[28px] overflow-hidden shadow-lg border border-black/5">
                <Image
                  src={facility.imageSrc || "/images/tempat/lapangansmkn2ska.jpg"}
                  alt={facility.title || "Facility Image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>
            </div>
          ) : (
            /* STEP 2: BORROWING FORM */
            <div className="space-y-6">
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#2c1ee8] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali pilih jam</span>
                </button>
                <div className="text-right">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                    Form Peminjaman Fasilitas
                  </h2>
                  <p className="text-xs text-gray-500">Lengkapi data pengajuan di bawah ini</p>
                </div>
              </div>

              {/* Forward Notice to Guru & Super Admin */}
              <div className="p-3.5 bg-blue-50/90 rounded-2xl border border-blue-100 flex items-start gap-3 text-xs text-[#2c1ee8] font-medium">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm font-bold mb-0.5">Informasi Alur Pengajuan:</strong>
                  Formulir ini akan diteruskan ke <strong>Guru</strong> dan <strong>Admin</strong> untuk persetujuan utama (peninjauan OSIS bersifat opsional).
                </div>
              </div>

              {/* Selected Slot Information Box */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-[#2c1ee8]" />
                  <span>Informasi Jam & Fasilitas yang Dipilih</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div>
                    <span className="text-xs text-gray-500">Fasilitas / Tempat:</span>
                    <p className="text-base font-extrabold text-gray-900">{facility.title}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs text-gray-500">Jam Terpilih ({selectedDate}):</span>
                    <p className="text-sm font-bold text-[#2c1ee8] bg-blue-100/70 px-3 py-1 rounded-xl inline-block">
                      {selectedTimesFormatted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Server Submit Error Notice */}
              {errors.submit && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* Main Form Fields */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <OrganizationSelect
                  value={organization}
                  customValue={customOrg}
                  onChange={(val) => {
                    setOrganization(val);
                    if (errors.organization) setErrors({ ...errors, organization: null });
                  }}
                  onCustomChange={(val) => setCustomOrg(val)}
                  error={errors.organization}
                  label="Nama Organisasi Terdaftar"
                />

                {/* 2. Nama Kegiatan */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nama Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Latihan Rutin Basket / Rapat Anggaran OSIS"
                    value={activityName}
                    onChange={(e) => {
                      setActivityName(e.target.value);
                      if (errors.activityName) setErrors({ ...errors, activityName: null });
                    }}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50/50 focus:bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all ${
                      errors.activityName ? "border-rose-400 focus:border-rose-500" : "border-gray-200 focus:border-[#2c1ee8]"
                    }`}
                  />
                  {errors.activityName && (
                    <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.activityName}
                    </p>
                  )}
                </div>

                {/* 3. Deskripsi / Tujuan Peminjaman (Purpose) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      Tujuan & Deskripsi Peminjaman <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {description.length}/500 karakter
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={400}
                    placeholder="Jelaskan secara ringkas peruntukan peminjaman, jumlah perkiraan peserta, atau kebutuhan khusus..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors({ ...errors, description: null });
                    }}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50/50 focus:bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all resize-none ${
                      errors.description ? "border-rose-400 focus:border-rose-500" : "border-gray-200 focus:border-[#2c1ee8]"
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
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-2xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Batal / Ubah Jam
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
