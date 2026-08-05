"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import { Check, X, ArrowLeft, Clock, Building2, FileText, Send, ShieldCheck, Users, AlertCircle, ShoppingBag, Plus } from "lucide-react";
import facilityService from "@/services/facilityService";

export default function ScheduleModal({ isOpen, onClose, facility, onAddToCart }) {
  const [step, setStep] = useState(1); // 1: Slot selection, 2: Borrowing Form
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [organization, setOrganization] = useState("");
  const [customOrg, setCustomOrg] = useState("");
  const [activityName, setActivityName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

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
    }
  }

  if (!isOpen || !facility) return null;

  const defaultSlots = [
    { id: 1, time: "07:00 - 09:00", status: "Tidak tersedia", available: false },
    { id: 2, time: "09:00 - 11:00", status: "Penuh", available: false },
    { id: 3, time: "11:00 - 12:00", status: "Tersedia", available: true },
    { id: 4, time: "12:00 - 13:00", status: "Tersedia", available: true },
    { id: 5, time: "13:00 - 14:00", status: "Tersedia", available: true },
  ];

  const slotsToDisplay = facility.slots || defaultSlots;

  // Selected time text formatted string
  const selectedSlotsToDisplay = slotsToDisplay.filter((s) => selectedSlots.includes(s.id));
  const selectedTimesFormatted = selectedSlotsToDisplay.map((s) => s.time).join(", ");

  const registeredOrganizations = [
    "OSIS SMKN 2 Surakarta",
    "PRAMUKA (Gudep SMKN 2)",
    "PMR (Palang Merah Remaja)",
    "PASKIBRA",
    "ROHIS / IRMAS",
    "ROHKRIS",
    "TEATER & KESENIAN",
    "EKSTRAKURIKULER OLAHRAGA",
    "PERWAKILAN KELAS / JURUSAN",
    "Lainnya (Ketik Manual)",
  ];

  const toggleSlot = (slotId) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter((id) => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const handleAddToCartClick = () => {
    if (selectedSlots.length === 0) return;
    if (onAddToCart) {
      onAddToCart({
        cartId: `${facility.id}-${selectedSlots.sort().join("-")}-${Date.now()}`,
        facilityId: facility.id,
        facilityTitle: facility.title,
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
  };

  const handleNextToForm = () => {
    if (selectedSlots.length === 0) return;
    setStep(2);
  };

  const handleFormSubmit = (e) => {
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

    // Send payload to backend endpoint via facilityService
    facilityService.createBooking({
      facilityId: facility.id,
      facilityTitle: facility.title,
      organization: finalOrg,
      activityName: activityName.trim(),
      slots: selectedSlots,
      slotFormatted: selectedTimesFormatted,
      description: description.trim(),
    }).catch((err) => {
      console.warn("Async booking sync warning:", err);
    });

    setIsSuccess(true);
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
                <span>Form ini telah diteruskan ke <strong>Guru</strong> dan <strong>Super Admin</strong> untuk proses verifikasi. Status pengajuan dapat dipantau secara berkala.</span>
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
                  <h2 className="text-4xl sm:text-5xl font-black text-gray-900 uppercase tracking-tight leading-none mb-6">
                    {facility.title || "LAPANGAN"}
                  </h2>

                  {/* Slot Rows List */}
                  <div className="space-y-3.5 mb-8">
                    {slotsToDisplay.map((slot) => {
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
                    })}
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
                      disabled={selectedSlots.length === 0}
                      className={`flex-1 px-5 py-3.5 font-bold text-sm rounded-2xl border transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                        selectedSlots.length > 0
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
                      disabled={selectedSlots.length === 0}
                      className={`flex-1 px-5 py-3.5 font-bold text-sm rounded-2xl shadow-md transition-all duration-200 cursor-pointer ${
                        selectedSlots.length > 0
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
                  Formulir ini akan diteruskan ke <strong>Guru</strong> dan <strong>Super Admin</strong> untuk persetujuan utama (peninjauan OSIS bersifat opsional).
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
                    <span className="text-xs text-gray-500">Fasilitas / Barang:</span>
                    <p className="text-base font-extrabold text-gray-900">{facility.title}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs text-gray-500">Jam Terpilih:</span>
                    <p className="text-sm font-bold text-[#2c1ee8] bg-blue-100/70 px-3 py-1 rounded-xl inline-block">
                      {selectedTimesFormatted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Form Fields */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* 1. Nama Organisasi Terdaftar */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nama Organisasi Terdaftar <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={organization}
                      onChange={(e) => {
                        setOrganization(e.target.value);
                        if (errors.organization) setErrors({ ...errors, organization: null });
                      }}
                      className={`w-full px-4 py-3 rounded-2xl border bg-gray-50/50 focus:bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2c1ee8]/20 transition-all appearance-none cursor-pointer ${
                        errors.organization ? "border-rose-400 focus:border-rose-500" : "border-gray-200 focus:border-[#2c1ee8]"
                      }`}
                    >
                      <option value="" disabled>-- Pilih Organisasi / Ekstrakurikuler --</option>
                      {registeredOrganizations.map((org) => (
                        <option key={org} value={org}>
                          {org}
                        </option>
                      ))}
                    </select>
                    <Users className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {organization === "Lainnya (Ketik Manual)" && (
                    <input
                      type="text"
                      placeholder="Masukkan nama organisasi/kelas anda..."
                      value={customOrg}
                      onChange={(e) => setCustomOrg(e.target.value)}
                      className="mt-2.5 w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/20"
                    />
                  )}
                  {errors.organization && (
                    <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.organization}
                    </p>
                  )}
                </div>

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

                {/* 3. Deskripsi Kegiatan */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Deskripsi Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
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
                    className="px-6 py-3 rounded-2xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Batal / Ubah Jam
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Pengajuan</span>
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

