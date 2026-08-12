"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  ArrowUpRight,
  ArrowUp,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const quickLinks = [
  { label: "Beranda", href: "/" },
  { label: "Fasilitas Sekolah", href: "/fasilitas" },
  { label: "Ekstrakurikuler", href: "/ekstrakurikuler" },
  { label: "Mading Digital", href: "/mading" },
  { label: "Pengajuan Proposal", href: "/proposal" },
  { label: "Kalender Akademik", href: "/kalender" },
];

const contactInfo = [
  {
    icon: MapPin,
    text: "Jl. Ahmad Yani No. 374, Banjarsari, Surakarta, Jawa Tengah 57134",
  },
  {
    icon: Phone,
    text: "(0271) 714200",
  },
  {
    icon: Mail,
    text: "info@smkn2surakarta.sch.id",
  },
  {
    icon: Globe,
    text: "www.smkn2surakarta.sch.id",
    href: "https://www.smkn2surakarta.sch.id",
  },
];

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/smkn2surakarta?igsh=cHB6MDQ1aTlrd3Jm",
    icon: Instagram,
    hoverBg: "hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@smknegeri2surakarta1952?si=WJovtcQGO6J07QFi",
    icon: Youtube,
    hoverBg: "hover:bg-red-600",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1EcqkNdk4r/",
    icon: Facebook,
    hoverBg: "hover:bg-blue-600",
  },
];

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative bg-gradient-to-b from-[#060a12] via-[#090e1a] to-[#04070e] text-white border-t border-white/10 font-sans overflow-hidden selection:bg-[#2c1ee8] selection:text-white">
      {/* Ambient Glowing Spotlights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2c1ee8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner / Callout Glass Card */}
      <div className="relative max-w-7xl mx-auto px-6 pt-12 sm:px-8 lg:px-12 z-10">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-[#2c1ee8]/30 border border-white/15 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2 text-center sm:text-left z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-black uppercase tracking-wider text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Portal Terpadu Kesiswaan
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              SMK Negeri 2 Surakarta
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Platform layanan digital terintegrasi untuk mengakses fasilitas, mading sekolah, ekstrakurikuler, dan kalender kegiatan dalam satu genggaman.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md shadow-md"
            >
              <span>Kembali ke Atas</span>
              <ArrowUp className="w-4 h-4 text-blue-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Grid Container */}
      <div className="relative max-w-7xl mx-auto px-6 py-14 sm:px-8 lg:px-12 z-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          
          {/* Column 1: Brand Info & Status */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="relative h-12 w-12 flex items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-inner backdrop-blur-md shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Logo SMKN 2 Surakarta"
                  width={38}
                  height={38}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base sm:text-lg font-black text-white tracking-tight">
                  Student Center
                </span>
                <span className="text-xs text-blue-300 font-bold">
                  SMK Negeri 2 Surakarta
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-300 text-left font-normal">
              Solusi portal digital modern kesiswaan SMKN 2 Surakarta. Memudahkan koordinasi kegiatan, peminjaman sarana prasarana, serta publikasi karya siswa.
            </p>

            {/* Operational System Badge */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md text-[11px] font-mono text-slate-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>System Operational • v2.4</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 rounded-full bg-[#2c1ee8]" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-extrabold">
                Navigasi Cepat
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group text-slate-300 hover:text-white transition-colors duration-200 inline-flex items-center gap-2 font-medium"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#2c1ee8] group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
                    <span className="group-hover:text-blue-200 transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 rounded-full bg-[#2c1ee8]" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-extrabold">
                Kontak Sekolah
              </h4>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm">
              {contactInfo.map((contact, index) => {
                const IconComponent = contact.icon;
                return (
                  <li key={index} className="flex items-start gap-3 text-slate-300 group">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-300 shrink-0 mt-0.5 group-hover:bg-[#2c1ee8]/30 group-hover:border-[#2c1ee8]/50 transition-colors">
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    {contact.href ? (
                      <a
                        href={contact.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors leading-relaxed font-medium inline-flex items-center gap-1"
                      >
                        <span>{contact.text}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-300" />
                      </a>
                    ) : (
                      <span className="leading-relaxed font-medium">{contact.text}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 4: Social Media & Official Portal */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-1 rounded-full bg-[#2c1ee8]" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-extrabold">
                Media Sosial Resmi
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Ikuti kabar perkembangan karya, kejuaraan, dan dokumentasi kegiatan terbaru siswa SMKN 2 Surakarta.
            </p>

            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((social) => {
                const SocialIcon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className={`w-10 h-10 rounded-2xl bg-white/5 border border-white/15 text-slate-300 flex items-center justify-center transition-all duration-200 hover:text-white hover:scale-110 hover:shadow-lg active:scale-95 cursor-pointer backdrop-blur-md ${social.hoverBg}`}
                  >
                    <SocialIcon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>

            <div className="pt-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-300 font-medium">
                  Portal Terverifikasi Kesiswaan SMKN 2 Surakarta
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Rights */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="font-medium text-center sm:text-left">
            © {new Date().getFullYear()} Student Center SMK Negeri 2 Surakarta. Hak Cipta Dilindungi.
          </p>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="hover:text-white transition">Banjarsari, Surakarta</span>
            <span>•</span>
            <span className="hover:text-white transition">Jawa Tengah</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
