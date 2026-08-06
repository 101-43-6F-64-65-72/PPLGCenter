"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  X,
  Trash2,
  Clock,
  ShieldCheck,
  Users,
  AlertCircle,
  Check,
  ShoppingBag,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import bookingService from "@/services/bookingService";
import OrganizationSelect from "@/components/common/OrganizationSelect";

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onRemoveFromCart,
  onClearCart,
  onSuccessSubmit
}) {
  const [step, setStep] = useState(1); // 1: Cart Items List, 2: Bulk Form, 3: Success
  const [organization, setOrganization] = useState("");
  const [customOrg, setCustomOrg] = useState("");
  const [activityName, setActivityName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;



  const handleNextToForm = () => {
    if (cartItems.length === 0) return;
    setStep(2);
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

    let fullPurpose = `[${finalOrg}] ${activityName.trim()}: ${description.trim()}`;
    if (fullPurpose.length > 500) {
      fullPurpose = fullPurpose.substring(0, 497) + "...";
    }

    const slotHours = {
      1: { start: 7, end: 9 },
      2: { start: 9, end: 11 },
      3: { start: 11, end: 12 },
      4: { start: 12, end: 13 },
      5: { start: 13, end: 14 },
      6: { start: 14, end: 15 },
      7: { start: 15, end: 17 },
    };

    try {
      for (const item of cartItems) {
        const selectedDate = item.bookingDate || new Date().toISOString().split("T")[0];
        const selectedSlots = item.selectedSlots || [1];
        const firstSlotId = selectedSlots[0];
        const lastSlotId = selectedSlots[selectedSlots.length - 1] || firstSlotId;

        const startHour = slotHours[firstSlotId]?.start ?? 7;
        const endHour = slotHours[lastSlotId]?.end ?? (startHour + 1);

        const startTimeIso = new Date(`${selectedDate}T${String(startHour).padStart(2, "0")}:00:00Z`).toISOString();
        const endTimeIso = new Date(`${selectedDate}T${String(endHour).padStart(2, "0")}:00:00Z`).toISOString();

        await bookingService.createBooking({
          facilityId: item.facilityId,
          purpose: fullPurpose,
          startTime: startTimeIso,
          endTime: endTimeIso,
        });
      }
      setStep(3);
    } catch (err) {
      setErrors({ submit: "Gagal memproses beberapa pengajuan dalam keranjang." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    if (step === 3) {
      onClearCart();
    }
    setStep(1);
    setOrganization("");
    setCustomOrg("");
    setActivityName("");
    setDescription("");
    setErrors({});
    onClose();
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
          onClick={handleCloseAll}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
        />

        {/* Cart Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden z-10 border border-gray-100 p-6 sm:p-8 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2c1ee8] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  Daftar Peminjaman Fasilitas
                </h2>
                <p className="text-xs text-gray-500">
                  {cartItems.length} fasilitas terpilih untuk diajukan sekaligus
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseAll}
              className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              aria-label="Tutup daftar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content depending on Step */}
          <div className="flex-1 overflow-y-auto py-4">
            {step === 3 ? (
              /* STEP 3: SUCCESS STATE */
              <div className="py-8 text-center space-y-5 max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-50 text-[#2c1ee8] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    Pengajuan Kolektif Berhasil!
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Pengajuan <strong>{cartItems.length} fasilitas</strong> oleh <strong>{finalOrgDisplay}</strong> untuk kegiatan <strong>&quot;{activityName}&quot;</strong> telah berhasil dikirim.
                  </p>
                </div>

                {/* Items summary list */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-left space-y-2 text-xs">
                  <span className="font-bold text-gray-500 uppercase tracking-wider block">Daftar Peminjaman Kolektif:</span>
                  {cartItems.map((item, idx) => (
                    <div key={item.cartId || idx} className="flex justify-between items-center py-1 border-b border-gray-200/60 last:border-0">
                      <span className="font-extrabold text-gray-800">• {item.facilityTitle}</span>
                      <span className="text-[#2c1ee8] font-bold bg-blue-100/70 px-2 py-0.5 rounded-lg">{item.slotFormatted}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-blue-50/90 rounded-2xl text-xs text-[#2c1ee8] font-medium border border-blue-100 flex items-center gap-3 text-left">
                  <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                  <span>Pengajuan ini telah diteruskan secara otomatis ke <strong>Guru</strong> dan <strong>Admin</strong> untuk proses verifikasi.</span>
                </div>

                <button
                  onClick={handleCloseAll}
                  className="w-full py-3.5 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : step === 1 ? (
              /* STEP 1: CART ITEMS LIST */
              <div className="space-y-4">
                {cartItems.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Daftar Pinjaman Masih Kosong</h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                      Pilih fasilitas tempat yang ingin dipinjam dari katalog, lalu klik &quot;+ Tambah&quot;.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
                      <span>Daftar item terpilih:</span>
                      <button
                        onClick={onClearCart}
                        className="text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Kosongkan Daftar</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div
                          key={item.cartId}
                          className="flex items-center gap-4 bg-gray-50 hover:bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200/80 transition-all"
                        >
                          <div className="w-16 h-16 relative rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                            <Image
                              src={item.imageSrc || "/images/tempat/lapangansmkn2ska.jpg"}
                              alt={item.facilityTitle}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-gray-900 text-base uppercase truncate">
                              {item.facilityTitle}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3.5 h-3.5 text-[#2c1ee8]" />
                              <span className="text-xs font-bold text-[#2c1ee8] bg-blue-100/70 px-2 py-0.5 rounded-md truncate">
                                {item.slotFormatted}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => onRemoveFromCart(item.cartId)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus dari keranjang"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* STEP 2: BULK BORROWING FORM (1x INPUT FOR ALL ITEMS) */
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#2c1ee8] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke daftar pinjaman</span>
                </button>

                {/* Info Notice to Guru & Super Admin */}
                <div className="p-3.5 bg-blue-50/90 rounded-2xl border border-blue-100 flex items-start gap-3 text-xs text-[#2c1ee8] font-medium">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold mb-0.5">Pengajuan 1-Kali (Kolektif):</strong>
                    Formulir di bawah ini mencakup <strong>{cartItems.length} fasilitas</strong> yang telah Anda pilih dan akan diteruskan ke <strong>Guru</strong> & <strong>Admin</strong>.
                  </div>
                </div>

                {/* Cart Items Summary Pills */}
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
                  <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">
                    Fasilitas & Jam Terpilih:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cartItems.map((item) => (
                      <span key={item.cartId} className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-gray-200 text-gray-800 px-3 py-1.5 rounded-xl shadow-sm">
                        <span className="text-[#2c1ee8]">{item.facilityTitle}</span>
                        <span className="text-gray-400">({item.slotFormatted})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Submit Error Notice */}
                {errors.submit && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errors.submit}</span>
                  </div>
                )}

                {/* Single Form for All Cart Items */}
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
                      placeholder="Contoh: Classmeeting & Pentas Seni SMKN 2"
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
                      placeholder="Jelaskan secara ringkas peruntukan peminjaman seluruh fasilitas di keranjang..."
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

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-2xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Batal / Kelola Daftar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? "Mengirim..." : "Kirim Pengajuan Kolektif"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer Action when step 1 */}
          {step === 1 && cartItems.length > 0 && (
            <div className="border-t border-gray-100 pt-4 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-gray-500">
                Total Item: <strong className="text-gray-900 text-sm font-black">{cartItems.length}</strong>
              </div>
              <button
                onClick={handleNextToForm}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#2c1ee8] hover:bg-[#2218a3] text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Lanjut Isi Form (1x Input)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
