"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import ChatDrawer from "@/components/chat/ChatDrawer";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AuthGuard allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
      <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-16 space-y-6">
          <PageHeader
            icon={MessageSquare}
            title="Pusat Komunikasi & Pesan Direct"
            description="Kirim pesan langsung secara terkontrol antara Guru, Siswa, dan Admin sekolah."
            badge={<Badge variant="info">Pesan & Chat</Badge>}
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsOpen(true)}
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Buka Panel Chat
              </Button>
            }
          />

          <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2c1ee8] flex items-center justify-center mx-auto border border-blue-100">
              <MessageSquare className="w-8 h-8 text-[#2c1ee8]" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Layanan Chat & Pesan Direct</h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto font-medium">
              Gunakan panel pesan untuk berkirim pesan langsung dengan Guru, Pembina, atau Admin sekolah.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsOpen(true)}
            >
              Buka Panel Chat
            </Button>
          </div>

          <ChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
