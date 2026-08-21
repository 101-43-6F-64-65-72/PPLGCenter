"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const quickLinks = [
  { label: "Beranda", href: "/" },
  { label: "Pengumuman Resmi", href: "/pengumuman" },
  { label: "Fasilitas", href: "/fasilitas" },
  { label: "Kalender Akademik", href: "/kalender" },
];

const contactInfo = [
  {
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
    ),
    text: "Jl. Ahmad Yani No. 374, Banjarsari, Surakarta, Jawa Tengah 57134",
  },
  {
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 2.007a14.28 14.28 0 0 1-5.918-5.918l2.007-1.514c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
        />
      </svg>
    ),
    text: "(0271) 714200",
  },
  {
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
        />
      </svg>
    ),
    text: "info@smkn2surakarta.sch.id",
  },
  {
    icon: (
      <svg
        className="w-5 h-5 flex-shrink-0 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253"
        />
      </svg>
    ),
    text: "www.smkn2surakarta.sch.id",
    href: "https://www.smkn2surakarta.sch.id",
  },
];

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/smkn2surakarta?igsh=cHB6MDQ1aTlrd3Jm",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@smknegeri2surakarta1952?si=WJovtcQGO6J07QFi",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1EcqkNdk4r/",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#090d16] border-t border-slate-800/80 text-white relative">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        {/* Main Grid: 4 columns */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1: Brand Info */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Logo SMKN 2 Surakarta"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold text-white tracking-tight">
                  Student Center
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  SMKN 2 Surakarta
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 text-left font-normal">
              Portal informasi dan layanan digital terpadu untuk memudahkan
              siswa SMKN 2 Surakarta dalam mengakses mading, ekstrakurikuler,
              fasilitas sekolah, dan pengajuan kegiatan dalam satu platform.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">Tautan Cepat</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">Kontak Kami</h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              {contactInfo.map((contact, index) => (
                <li key={index} className="flex items-start gap-3">
                  {contact.icon}
                  {contact.href ? (
                    <a
                      href={contact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors leading-relaxed"
                    >
                      {contact.text}
                    </a>
                  ) : (
                    <span className="text-slate-400 leading-relaxed">
                      {contact.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Follow Us / Social Media */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">Ikuti Kami</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Dapatkan berita terbaru dan aktivitas sekolah melalui media sosial
              resmi kami.
            </p>
            <div className="flex gap-3 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white shadow-xs"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-14 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; 2026 Student Center SMK Negeri 2 Surakarta. Semua Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Portal Resmi Kesiswaan</span>
            <span>•</span>
            <span>SMK Negeri 2 Surakarta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

