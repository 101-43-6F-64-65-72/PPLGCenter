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
      <div className="bg-white rounded-none border border-slate-200 p-4 sm:p-5 shadow-xs font-sans text-left">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Email Notifikasi Akun
            </h3>
            {isVerified ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {emailNotif}
                </span>
                <span className="inline-flex px-1.5 py-0.2 rounded-none text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Terhubung
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Belum ada email notifikasi yang terhubung untuk menerima info penting.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isVerified ? (
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
                      className="px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                    >
                      {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-2.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 cursor-pointer"
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
                className="px-4 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2013ce] text-white font-bold uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer"
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
