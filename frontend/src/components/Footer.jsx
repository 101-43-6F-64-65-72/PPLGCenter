"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Youtube,
  Facebook,
  ArrowUpRight,
  Heart,
} from "lucide-react";

export default function Footer({ data }) {
  const footerData = data || {
    schoolName: "Student Center SMKN 2 Surakarta",
    tagline: "Unggul, Berkarakter & Siap Kerja",
    description:
      "Platform terpadu informasi kegiatan siswa, pendaftaran ekstrakurikuler, mading digital, dan reservasi fasilitas sekolah SMK Negeri 2 Surakarta.",
    contact: {
      address: "Jl. Yosodipuro No. 105, Mangkubumen, Banjarsari, Surakarta, Jawa Tengah 57139",
      phone: "(0271) 714422",
      email: "info@smkn2surakarta.sch.id",
      hours: "Senin - Jumat: 07.00 - 15.30 WIB",
    },
    quickLinks: [
      { name: "Beranda", href: "#beranda" },
      { name: "Ekstrakurikuler", href: "#ekstrakurikuler" },
      { name: "Mading Digital", href: "#mading" },
      { name: "Fasilitas Sekolah", href: "#fasilitas" },
      { name: "Kalender Akademik", href: "/kalender" },
    ],
    servicesLinks: [
      { name: "Portal Siswa", href: "/login" },
      { name: "Peminjaman Alat & Lab", href: "/fasilitas" },
      { name: "Pendaftaran Ekskul", href: "/ekstrakurikuler" },
      { name: "Submit Karya Mading", href: "/mading" },
      { name: "Pengajuan Surat OSIS", href: "/proposal" },
    ],
    socials: [
      { name: "Instagram", href: "https://instagram.com/smkn2surakarta", icon: "Instagram" },
      { name: "YouTube", href: "https://youtube.com/smkn2surakarta", icon: "Youtube" },
      { name: "Facebook", href: "https://facebook.com/smkn2surakarta", icon: "Facebook" },
      { name: "Email", href: "mailto:info@smkn2surakarta.sch.id", icon: "Mail" },
    ],
    copyright: "© 2026 Student Center SMK Negeri 2 Surakarta. All Rights Reserved.",
  };

  const getSocialIcon = (iconName) => {
    switch (iconName) {
      case "Instagram":
        return <Instagram className="w-5 h-5" />;
      case "Youtube":
        return <Youtube className="w-5 h-5" />;
      case "Facebook":
        return <Facebook className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[150px] bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <span className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                    S2
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  Student Center
                </h3>
                <p className="text-xs text-blue-400 font-semibold tracking-wide">
                  SMK Negeri 2 Surakarta
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {footerData.description}
            </p>

            {/* Social Links */}
            <div className="pt-2 flex items-center gap-3">
              {footerData.socials?.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-800 hover:border-blue-500 transition-all duration-300 shadow-md"
                >
                  {getSocialIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800/80 pb-2">
              Navigasi Halaman
            </h4>
            <ul className="space-y-2.5 text-sm">
              {footerData.quickLinks?.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 group"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800/80 pb-2">
              Layanan Siswa
            </h4>
            <ul className="space-y-2.5 text-sm">
              {footerData.servicesLinks?.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 group"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800/80 pb-2">
              Kontak Sekolah
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                <span>{footerData.contact?.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{footerData.contact?.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{footerData.contact?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{footerData.contact?.hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{footerData.copyright}</p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>untuk SMKN 2 Surakarta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}