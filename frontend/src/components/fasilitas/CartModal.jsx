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
  ChevronRight,
  Send,
  UserPlus
} from "lucide-react";
import bookingService from "@/services/bookingService";
import StudentBatchPickerModal from "@/components/fasilitas/StudentBatchPickerModal";

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onRemoveFromCart,
  onClearCart,
  onSuccessSubmit
}) {
  const [step, setStep] = useState(1); // 1: Cart Items List, 2: Bulk Form, 3: Success
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
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

    const membersSummary = selectedMembers.map((m) => `${m.fullName} (${m.className || "PPLG"})`).join(", ");
    let fullPurpose = `[Peminjam: ${selectedMembers.length} Siswa - ${membersSummary}] ${activityName.trim()}: ${description.trim()}`;
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
      const now = new Date();
      for (const item of cartItems) {
        const selectedDate = item.bookingDate || new Date().toISOString().split("T")[0];
        const selectedSlots = item.selectedSlots || [1];
        const firstSlotId = selectedSlots[0];
        const lastSlotId = selectedSlots[selectedSlots.length - 1] || firstSlotId;

        const startHour = slotHours[firstSlotId]?.start ?? 7;
        const endHour = slotHours[lastSlotId]?.end ?? (startHour + 1);

        const startLocalDate = new Date(`${selectedDate}T${String(startHour).padStart(2, "0")}:00:00`);
        const endLocalDate = new Date(`${selectedDate}T${String(endHour).padStart(2, "0")}:00:00`);

        if (isNaN(startLocalDate.getTime()) || isNaN(endLocalDate.getTime())) {
          setErrors({ submit: `Format tanggal atau jam untuk ${item.facilityTitle || "fasilitas"} tidak valid.` });
          setIsSubmitting(false);
          return;
        }

        if (startLocalDate < now) {
          setErrors({ submit: `Peminjaman untuk ${item.facilityTitle || "fasilitas"} memiliki waktu di masa lalu. Silakan pilih jadwal di masa mendatang.` });
          setIsSubmitting(false);
          return;
        }

        const res = await bookingService.createBooking({
          facilityId: item.facilityId,
          purpose: fullPurpose,
          startTime: startLocalDate.toISOString(),
          endTime: endLocalDate.toISOString(),
        });

        if (!res.success) {
          setErrors({ submit: res.message || "Gagal memproses beberapa pengajuan dalam keranjang." });
          setIsSubmitting(false);
          return;
        }
      }
      setStep(3);
    } catch (err) {
      setErrors({ submit: err?.message || "Gagal memproses beberapa pengajuan dalam keranjang." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    if (step === 3) {
      onClearCart();
    }
    setStep(1);
    setSelectedMembers([]);
    setBatchPickerOpen(false);
    setActivityName("");
    setDescription("");
    setErrors({});
    onClose();
  };

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
                      placeholder="Contoh: Classmeeting & Pentas Seni SMKN 2"
                      value={activityName}
                      onChange={(e) => {
                        setActivityName(e.target.value);
                        if (errors.activityName) setErrors({ ...errors, activityName: null });
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white text-xs font-medium focus:outline-hidden focus:border-[#2C1EE8] transition-all ${
                        errors.activityName ? "border-rose-400 focus:border-rose-500" : "border-slate-200"
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
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-slate-700 font-extrabold uppercase tracking-wider">
                        Tujuan & Deskripsi Peminjaman <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {description.length}/400 karakter
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
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 focus:bg-white text-xs font-medium focus:outline-hidden focus:border-[#2C1EE8] transition-all resize-none ${
                        errors.description ? "border-rose-400 focus:border-rose-500" : "border-slate-200"
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
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Batal / Kelola Daftar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-7 py-2.5 bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-slate-500">
                Total Item: <strong className="text-slate-900 text-sm font-black">{cartItems.length}</strong>
              </div>
              <button
                onClick={handleNextToForm}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <span>Lanjut Isi Form (1x Input)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
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
