"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import ChatDrawer from "@/components/chat/ChatDrawer";

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-16">
          <div className="mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
              💬 PESAN LANGSUNG & CHAT
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">Pusat Komunikasi & Pesan Direct</h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Kirim pesan langsung secara terkontrol antara Guru, Siswa, dan Admin sekolah.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <div className="text-4xl">📬</div>
            <h2 className="text-lg font-bold text-slate-100">Layanan Chat Aktif</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Gunakan panel pesan di sebelah kanan untuk berkirim pesan dengan Guru atau Admin.
            </p>
            <button
              onClick={() => setIsOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              Buka Panel Chat
            </button>
          </div>

          <ChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
