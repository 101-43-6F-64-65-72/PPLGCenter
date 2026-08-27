"use client";

import React, { useState, useEffect } from "react";
import { X, RotateCcw, Loader2 } from "lucide-react";
import profileService from "@/services/profileService";

const CURATED_TECH_OPTIONS = [
  { id: "react", name: "React", category: "Frontend", color: "#0284C7" },
  { id: "laravel", name: "Laravel", category: "Backend", color: "#E11D48" },
  { id: "python", name: "Python", category: "Language", color: "#CA8A04" },
  { id: "nodejs", name: "Node.js", category: "Runtime", color: "#16A34A" },
  { id: "docker", name: "Docker", category: "DevOps", color: "#2563EB" },
];

export default function EmailOtpVerificationModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccess,
}) {
  const [step, setStep] = useState("input-email"); // 'input-email' | 'challenge' | 'success'
  const [email, setEmail] = useState(initialEmail);
  const [selectedSlots, setSelectedSlots] = useState([null, null, null]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || "");
      setSelectedSlots([null, null, null]);
      setError("");
      setStep(initialEmail ? "challenge-ready" : "input-email");
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleRequestOtp = async (targetEmail) => {
    const emailToUse = (targetEmail || email || "").trim();
    if (!emailToUse || !emailToUse.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await profileService.requestNotificationOtp(emailToUse);
      const data = res?.data?.data || res?.data;
      setCooldown(data?.cooldownSeconds || 60);
      setSelectedSlots([null, null, null]);
      setStep("challenge");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Gagal mengirim kode verifikasi.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTech = (tech) => {
    setError("");
    const existingIdx = selectedSlots.findIndex((s) => s?.id === tech.id);
    if (existingIdx !== -1) {
      handleRemoveSlot(existingIdx);
      return;
    }

    const firstEmptyIdx = selectedSlots.findIndex((s) => s === null);
    if (firstEmptyIdx !== -1) {
      const newSlots = [...selectedSlots];
      newSlots[firstEmptyIdx] = tech;
      setSelectedSlots(newSlots);
    }
  };

  const handleRemoveSlot = (index) => {
    setError("");
    const newSlots = [...selectedSlots];
    newSlots[index] = null;
    setSelectedSlots(newSlots);
  };

  const handleReset = () => {
    setSelectedSlots([null, null, null]);
    setError("");
  };

  const handleVerify = async () => {
    if (selectedSlots.some((s) => s === null)) {
      setError("Pilih 3 urutan teknologi sesuai email Anda.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const techStackPayload = selectedSlots.map((s) => s.id);
      const res = await profileService.verifyNotificationOtp(email, techStackPayload);
      const data = res?.data?.data || res?.data;

      if (data?.success || res?.status === 200) {
        setStep("success");
        if (onSuccess) {
          onSuccess(email);
        }
      }
    } catch (err) {
      const errData = err?.response?.data;
      const msg = errData?.message || errData?.error || "Urutan tidak sesuai. Silakan coba lagi.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-md bg-white rounded-none border border-slate-200 shadow-xl overflow-hidden my-8 text-left">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Verifikasi Email Notifikasi
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">

          {/* STEP 1: Input Email */}
          {(step === "input-email" || step === "challenge-ready") && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="nama@email.com"
                  className="w-full rounded-none border border-slate-200 bg-slate-50 py-2 px-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-[#2C1EE8]"
                />
              </div>

              {error && (
                <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRequestOtp(email)}
                disabled={isLoading || !email}
                className="w-full py-2.5 px-4 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-none transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  "Kirim Kode Verifikasi"
                )}
              </button>
            </div>
          )}

          {/* STEP 2: 3-Slot Selection */}
          {step === "challenge" && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Kode verifikasi dikirim ke: <strong className="text-slate-800 font-mono">{email}</strong></span>
                <button
                  type="button"
                  onClick={() => setStep("input-email")}
                  className="text-xs font-bold text-[#2C1EE8] hover:text-[#2013ce] uppercase tracking-wider cursor-pointer"
                >
                  Ubah
                </button>
              </div>

              {/* 3 Active Sequence Slots */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pilih 3 urutan sesuai email:
                  </span>
                  {selectedSlots.some((s) => s !== null) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition uppercase cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {selectedSlots.map((slot, index) => {
                    const isFilled = slot !== null;
                    return (
                      <div
                        key={index}
                        onClick={() => isFilled && handleRemoveSlot(index)}
                        className={`h-14 rounded-none border transition-all flex flex-col items-center justify-center p-1.5 text-center select-none ${
                          isFilled
                            ? "bg-white border-[#2C1EE8] shadow-xs cursor-pointer hover:border-rose-400"
                            : "bg-slate-50 border-dashed border-slate-200 text-slate-400"
                        }`}
                      >
                        <span className="text-[9.5px] font-bold font-mono text-slate-400 uppercase">
                          Slot #{index + 1}
                        </span>
                        {isFilled ? (
                          <span className="font-bold text-xs text-slate-900 mt-0.5 uppercase">
                            {slot.name}
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-mono text-slate-400 uppercase">
                            Kosong
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5 Tech Buttons */}
              <div className="grid grid-cols-5 gap-1.5 select-none pt-1">
                {CURATED_TECH_OPTIONS.map((tech) => {
                  const slotIndex = selectedSlots.findIndex((s) => s?.id === tech.id);
                  const isSelected = slotIndex !== -1;

                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => handleSelectTech(tech)}
                      className={`py-2 px-1 rounded-none border transition-all text-center relative cursor-pointer ${
                        isSelected
                          ? "border-[#2C1EE8] bg-blue-50 font-bold text-[#2C1EE8]"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-none bg-[#2C1EE8] text-white text-[9px] font-bold font-mono flex items-center justify-center">
                          {slotIndex + 1}
                        </div>
                      )}
                      <div className="text-[11px] truncate font-bold uppercase">{tech.name}</div>
                    </button>
                  );
                })}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isLoading || selectedSlots.some((s) => s === null)}
                  className="w-full py-2.5 px-4 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-none transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    "Verifikasi & Hubungkan"
                  )}
                </button>

                <div className="text-center">
                  {cooldown > 0 ? (
                    <span className="text-xs font-mono text-slate-400">
                      Kirim ulang ({cooldown}s)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp(email)}
                      disabled={isLoading}
                      className="text-xs font-bold text-[#2C1EE8] hover:text-[#2013ce] uppercase tracking-wider cursor-pointer"
                    >
                      Kirim Ulang Kode
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Success */}
          {step === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-tight text-slate-900">
                  Email Notifikasi Berhasil Terhubung
                </h4>
                <p className="text-xs text-slate-600 font-mono font-semibold">
                  {email}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition cursor-pointer shadow-xs"
              >
                Selesai
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
