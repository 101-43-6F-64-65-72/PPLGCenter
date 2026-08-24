"use client";

import React, { useState } from "react";
import EmailOtpVerificationModal from "./EmailOtpVerificationModal";
import profileService from "@/services/profileService";

export default function NotificationEmailSection({
  user,
  onProfileUpdated,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const emailNotif = user?.emailNotif || user?.notificationEmail || null;
  const isVerified = Boolean(emailNotif && (user?.emailVerifiedAt || user?.isEmailNotifVerified));

  const handleDelete = async () => {
    setIsDeleting(true);
    setFeedback({ type: "", text: "" });
    try {
      await profileService.deleteNotificationEmail();
      setFeedback({ type: "success", text: "Email notifikasi berhasil dihapus." });
      setDeleteConfirm(false);
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Gagal menghapus email notifikasi.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = (newEmail) => {
    setFeedback({ type: "success", text: `Email notifikasi (${newEmail}) berhasil diverifikasi.` });
    if (onProfileUpdated) {
      onProfileUpdated();
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs font-sans">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
              Email Notifikasi
            </h3>
            {isVerified ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-slate-900 font-mono">
                  {emailNotif}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Terhubung
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-1">
                Belum ada email notifikasi yang terhubung.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isVerified ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  Ganti Email
                </button>

                {!deleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    Hapus
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                    >
                      {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
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
                className="px-5 py-2.5 rounded-xl bg-[#2C1EE8] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
              >
                Hubungkan Email
              </button>
            )}
          </div>
        </div>

        {/* Feedback message if any */}
        {feedback.text && (
          <div
            className={`mt-4 p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback({ type: "", text: "" })}
              className="opacity-60 hover:opacity-100 font-bold px-1"
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
        initialEmail={emailNotif || user?.email || ""}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
