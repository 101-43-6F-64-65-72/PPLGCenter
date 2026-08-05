"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import useAuth from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/userRoles";
import { Shield, LogOut } from "@/components/common/Icons";
import Button from "@/components/ui/Button";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-28">
          <ProfileContent />
        </main>
      </div>
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, role, logout } = useAuth();
  const fileInputRef = useRef(null);

  // Development preview only.
  // Remove when backend authentication is fully integrated.
  const previewUser = {
    name: "Administrator",
    email: "admin@studentcenter.id",
    identifier: "admin@studentcenter.id",
    avatar: "",
  };
  const currentUser = user ?? previewUser;

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formName, setFormName] = useState(null);
  const [formIdentifier, setFormIdentifier] = useState(null);
  const [address, setAddress] = useState("");

  const name = formName ?? (currentUser.fullName || currentUser.name || "Administrator");
  const identifier = formIdentifier ?? (currentUser.email || currentUser.identifier || "admin@studentcenter.id");

  React.useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!user && process.env.NODE_ENV !== "development") return null;

  const roleLabel = ROLE_LABELS[role] || role || "Siswa";
  const profileTitle = name.trim() ? name : "Nama Profile";

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setAvatarPreview((previousPreview) => {
      if (previousPreview) {
        URL.revokeObjectURL(previousPreview);
      }

      return URL.createObjectURL(file);
    });
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
        <div className="relative h-56 sm:h-60">
          <Image
            src="/images/tempat/halamandepansmkn2ska.jpg"
            alt="Profile Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-5">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-indigo-50 shadow-md sm:h-32 sm:w-32">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Preview avatar" fill className="object-cover" unoptimized />
                ) : currentUser.avatar ? (
                  <Image src={currentUser.avatar} alt={currentUser.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-3xl font-bold text-[#2C1EE8] sm:text-4xl">
                    {currentUser.name?.charAt(0) || "U"}
                  </div>
                )}

                <button
                  type="button"
                  onClick={openFilePicker}
                  className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-white text-[#2C1EE8] shadow-lg transition hover:scale-105 hover:bg-[#2C1EE8] hover:text-white"
                  aria-label="Ubah foto profil"
                >
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {profileTitle}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-[#2C1EE8]">
                    <Shield className="h-3.5 w-3.5" />
                    {roleLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-500 sm:text-base">
                  Email / NIS: <span className="font-semibold text-gray-900">{identifier}</span>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={logout}
              leftIcon={<LogOut className="h-4 w-4" />}
              className="border-red-200! text-red-600! hover:bg-red-50! hover:border-red-300!"
            >
              Keluar Sesi
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profil Saya</h2>
          <p className="mt-1 text-sm text-gray-500">Perbarui informasi dasar akun Anda.</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Nama</label>
            <input
              value={name}
              onChange={(event) => setFormName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              placeholder="Masukkan nama"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">NIS</label>
            <input
              value={identifier}
              onChange={(event) => setFormIdentifier(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              placeholder="Masukkan NIS"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Alamat</label>
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows="4"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              placeholder="Masukkan alamat"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {}} // TODO: connect PUT /profile
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#2C1EE8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2215C5]"
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}