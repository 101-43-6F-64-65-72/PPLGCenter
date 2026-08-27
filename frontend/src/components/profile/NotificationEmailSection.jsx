"use client";

import React, { useState, useEffect, useCallback } from "react";
import EmailOtpVerificationModal from "./EmailOtpVerificationModal";
import profileService from "@/services/profileService";
import { Mail, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

export default function NotificationEmailSection({
  user,
  onProfileUpdated,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  // Read initial cache from localStorage to prevent flash of unlinked state
  const [currentEmailNotif, setCurrentEmailNotif] = useState(() => {
    if (user?.emailNotif || user?.notificationEmail) {
      return user.emailNotif || user.notificationEmail;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem("sc_cached_email_notif") || null;
    }
    return null;
  });

  const [isVerified, setIsVerified] = useState(() => {
    const email = user?.emailNotif || user?.notificationEmail;
    if (email && (user?.emailVerifiedAt || user?.isEmailNotifVerified)) {
      return true;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem("sc_cached_email_notif_verified") === "true";
    }
    return false;
  });

  const [isCheckingLiveStatus, setIsCheckingLiveStatus] = useState(!user?.emailNotif && !currentEmailNotif);

  // Sync state automatically with latest authenticated user object
  useEffect(() => {
    const liveEmail = user?.emailNotif || user?.notificationEmail || null;
    const liveVerified = Boolean(liveEmail && (user?.emailVerifiedAt || user?.isEmailNotifVerified));

    if (liveEmail) {
      setCurrentEmailNotif(liveEmail);
      setIsVerified(liveVerified);
      if (typeof window !== "undefined") {
        localStorage.setItem("sc_cached_email_notif", liveEmail);
        localStorage.setItem("sc_cached_email_notif_verified", liveVerified ? "true" : "false");
      }
    }
  }, [user]);

  // Live direct verification check on mount (no manual refresh needed)
  const verifyLiveStatus = useCallback(async () => {
    try {
      setIsCheckingLiveStatus(true);
      const res = await profileService.getProfile();
      const userData = res?.data?.data || res?.data || res?.user;

      if (userData) {
        const liveEmail = userData.emailNotif || userData.notificationEmail || null;
        const liveVerified = Boolean(liveEmail && (userData.emailVerifiedAt || userData.isEmailNotifVerified));

        setCurrentEmailNotif(liveEmail);
        setIsVerified(liveVerified);

        if (typeof window !== "undefined") {
          if (liveEmail) {
            localStorage.setItem("sc_cached_email_notif", liveEmail);
            localStorage.setItem("sc_cached_email_notif_verified", liveVerified ? "true" : "false");
          } else {
            localStorage.removeItem("sc_cached_email_notif");
            localStorage.removeItem("sc_cached_email_notif_verified");
          }
        }
      }
    } catch (err) {
      console.warn("Silent notification email check failed:", err?.message);
    } finally {
      setIsCheckingLiveStatus(false);
    }
  }, []);

  useEffect(() => {
    verifyLiveStatus();
  }, [verifyLiveStatus]);

  const handleDelete = async () => {
    setIsDeleting(true);
    setFeedback({ type: "", text: "" });
    try {
      await profileService.deleteNotificationEmail();
      setFeedback({ type: "success", text: "Email notifikasi berhasil dihapus." });
      setDeleteConfirm(false);
      setCurrentEmailNotif(null);
      setIsVerified(false);

      if (typeof window !== "undefined") {
        localStorage.removeItem("sc_cached_email_notif");
        localStorage.removeItem("sc_cached_email_notif_verified");
      }

      if (onProfileUpdated) {
        await onProfileUpdated();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Gagal menghapus email notifikasi.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = async (newEmail) => {
    setCurrentEmailNotif(newEmail);
    setIsVerified(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("sc_cached_email_notif", newEmail);
      localStorage.setItem("sc_cached_email_notif_verified", "true");
    }

    setFeedback({ type: "success", text: `Email notifikasi (${newEmail}) berhasil diverifikasi dan terhubung.` });
    
    // Automatically refresh full user profile in background
    if (onProfileUpdated) {
      await onProfileUpdated();
    }
    await verifyLiveStatus();
  };

  return (
    <>
      <div className="bg-white rounded-none border border-slate-200 p-4 sm:p-5 shadow-xs font-sans text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#2C1EE8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Notifikasi Akun
              </h3>
            </div>

            {isCheckingLiveStatus && !currentEmailNotif ? (
              /* Loading State: Prevents premature "Hubungkan Email" button while checking */
              <div className="flex items-center gap-2 mt-1">
                <RefreshCw className="w-3.5 h-3.5 text-[#2C1EE8] animate-spin shrink-0" />
                <span className="text-xs text-slate-500 font-medium">
                  Memeriksa status email notifikasi akun...
                </span>
              </div>
            ) : isVerified && currentEmailNotif ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                  {currentEmailNotif}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-none text-[9.5px] font-bold font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Terhubung</span>
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Belum ada email notifikasi yang terhubung untuk menerima info penting.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isCheckingLiveStatus && !currentEmailNotif ? (
              <button
                type="button"
                disabled
                className="px-3.5 py-1.5 rounded-none bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider border border-slate-200 flex items-center gap-1.5 cursor-not-allowed"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Memuat...</span>
              </button>
            ) : isVerified && currentEmailNotif ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Ganti Email
                </button>

                {!deleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-2.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer"
              >
                Hubungkan Email
              </button>
            )}
          </div>
        </div>

        {/* Feedback message if any */}
        {feedback.text && (
          <div
            className={`mt-3 p-2.5 rounded-none flex items-center justify-between text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback({ type: "", text: "" })}
              className="opacity-60 hover:opacity-100 font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Tech Stack Challenge OTP Modal */}
      <EmailOtpVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialEmail={currentEmailNotif || user?.email || ""}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
