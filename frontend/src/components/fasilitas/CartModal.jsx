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
      newErrors.activityName = "Nama kegiatan wajib diisi.";
    }
    if (!description.trim()) {
      newErrors.description = "Deskripsi kegiatan wajib diisi.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const membersSummary = selectedMembers.map((m) => `${m.fullName} (${m.className || "PPLG"})`).join(", ");
    let fullPurpose = `[Peminjam Kolektif: ${selectedMembers.length} Siswa - ${membersSummary}] ${activityName.trim()}: ${description.trim()}`;
    if (fullPurpose.length > 500) {
      fullPurpose = fullPurpose.substring(0, 497) + "...";
    }

    const payloadList = cartItems.map((item) => {
      let startSlotTime = "07:00";
      let endSlotTime = "17:00";

      if (item.slotTime) {
        const startMatch = item.slotTime.match(/(\d{2})[.:](\d{2})/);
        const endMatch = item.slotTime.match(/s\.d\s*(\d{2})[.:](\d{2})|-.*?(\d{2})[.:](\d{2})/);
        if (startMatch) startSlotTime = `${startMatch[1]}:${startMatch[2]}`;
        if (endMatch) {
          const h = endMatch[1] || endMatch[3];
          const m = endMatch[2] || endMatch[4];
          if (h && m) endSlotTime = `${h}:${m}`;
        }
      }

      const startLocalDate = new Date(`${item.date}T${startSlotTime}:00`);
      const endLocalDate = new Date(`${item.date}T${endSlotTime}:00`);

      return {
        facilityId: item.facilityId,
        purpose: fullPurpose,
        startTime: startLocalDate.toISOString(),
        endTime: endLocalDate.toISOString(),
      };
    });

    const results = await Promise.all(
      payloadList.map((payload) => bookingService.createBooking(payload))
    );

    const hasFailure = results.some((r) => !r.success);

    if (!hasFailure) {
      setStep(3);
      onClearCart && onClearCart();
      onSuccessSubmit && onSuccessSubmit();
    } else {
      const errorMsg = results.find((r) => !r.success)?.message || "Beberapa fasilitas gagal diajukan.";
      setErrors({ submit: errorMsg });
    }

    setIsSubmitting(false);
  };

  const handleCloseAll = () => {
    setStep(1);
    setSelectedMembers([]);
    setActivityName("");
    setDescription("");
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseAll}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="relative bg-white w-full max-w-2xl rounded-none shadow-xl z-10 p-5 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 text-slate-900 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#2C1EE8]" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase">
                {step === 3 ? "Pengajuan Selesai" : step === 2 ? "Formulir Peminjaman Kolektif" : "Daftar Keranjang Peminjaman"}
              </h3>
            </div>

            <button
              onClick={handleCloseAll}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          {step === 3 ? (
            /* STEP 3: SUCCESS */
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-none flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 uppercase">
                Pengajuan Kolektif Berhasil!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Pengajuan peminjaman kolektif untuk kegiatan <strong>&quot;{activityName}&quot;</strong> telah berhasil dikirim dan menunggu verifikasi Bapak/Ibu Guru & Admin.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="px-6 py-2.5 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: CART ITEMS LIST */
            <div className="space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-none flex items-center justify-center mx-auto border border-slate-200">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase">Daftar Pinjaman Masih Kosong</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Pilih fasilitas sarana yang ingin dipinjam, lalu klik &quot;+ Tambah&quot;.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Item Terpilih ({cartItems.length}):</span>
                    <button
                      onClick={onClearCart}
                      className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Kosongkan</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div
                        key={item.cartId}
                        className="flex items-center gap-3 bg-white hover:bg-slate-50 p-2.5 rounded-none border border-slate-200 transition-colors"
                      >
                        <div className="w-12 h-12 relative rounded-none overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                          <Image
                            src={item.facilityImage || "/images/tempat/lapangansmkn2ska.jpg"}
                            alt={item.facilityTitle}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase truncate">
                            {item.facilityTitle}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-[#2C1EE8]" />
                            <span className="text-[11px] font-mono font-bold text-[#2C1EE8] bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-none truncate">
                              {item.date} · {item.slotTime}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveFromCart(item.cartId)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCloseAll}
                      className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={handleNextToForm}
                      className="px-6 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <span>Lanjut Formulir</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* STEP 2: FORM */
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#2C1EE8] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke daftar pinjaman</span>
              </button>

              {/* Cart Items Summary Pills */}
              <div className="bg-slate-50 p-2.5 rounded-none border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fasilitas Terpilih:
                </span>
                <div className="flex flex-wrap gap-1">
                  {cartItems.map((item) => (
                    <span key={item.cartId} className="inline-flex items-center gap-1 text-[11px] font-bold bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded-none">
                      <span className="text-[#2C1EE8]">{item.facilityTitle}</span>
                      <span className="text-slate-400 font-mono">({item.slotTime})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Error Notice */}
              {errors.submit && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-none flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
                {/* 1. Batch Member Selection */}
                <div className="space-y-1">
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
                      <span>Pilih Teman ({selectedMembers.length})</span>
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-slate-800 border border-slate-200 rounded-none text-[11px] font-medium"
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
                        Klik di sini untuk memilih siswa yang ikut meminjam
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
                    placeholder="Contoh: Classmeeting & Pentas Seni SMKN 2"
                    value={activityName}
                    onChange={(e) => {
                      setActivityName(e.target.value);
                      if (errors.activityName) setErrors({ ...errors, activityName: null });
                    }}
                    className={`w-full px-3 py-2 rounded-none border bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#2C1EE8] transition ${
                      errors.activityName ? "border-rose-400" : "border-slate-200"
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
                      Deskripsi & Keterangan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {description.length}/400
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={400}
                    placeholder="Jelaskan secara ringkas keperluan peminjaman..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors({ ...errors, description: null });
                    }}
                    className={`w-full px-3 py-2 rounded-none border bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#2C1EE8] transition resize-none ${
                      errors.description ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Mengirim..." : "Kirim Pengajuan Kolektif"}</span>
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
