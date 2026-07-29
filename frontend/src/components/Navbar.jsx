"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const targetPath = targetId === "home" ? "/" : `/#${targetId}`;

    if (pathname === "/") {
      if (targetId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    router.push(targetPath);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md py-4 px-4 sm:px-8 lg:px-12 border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Side: Logo & School Name */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, "home")}
          className="flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="relative w-10 h-12 flex-shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/images/logo.png"
              alt="SMK Negeri 2 Surakarta Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-gray-900 font-bold text-lg sm:text-xl tracking-tight group-hover:text-[#2c1ee8] transition-colors">
              SMK Negeri 2
            </span>
            <span className="text-gray-800 font-normal text-base sm:text-lg">
              Sekolah Menengah Kejuruan Surakarta
            </span>
          </div>
        </a>

        <div className="flex gap-5 items-center">
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-8">
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, "home")}
              className="text-gray-900 font-medium text-base lg:text-lg hover:text-[#2c1ee8] transition-colors cursor-pointer"
            >
              Beranda
            </a>
            <a
              href="#extracurricular"
              onClick={(e) => handleNavClick(e, "extracurricular")}
              className="text-gray-800 font-medium text-base lg:text-lg hover:text-[#2c1ee8] transition-colors cursor-pointer"
            >
              Ekstrakurikuler
            </a>
            <a
              href="#mading"
              onClick={(e) => handleNavClick(e, "mading")}
              className="text-gray-800 font-medium text-base lg:text-lg hover:text-[#2c1ee8] transition-colors cursor-pointer"
            >
              Mading
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className="text-gray-800 font-medium text-base lg:text-lg hover:text-[#2c1ee8] transition-colors cursor-pointer"
            >
              Kontak
            </a>
          </nav>

          {/* Right Side: Login Button (Desktop) */}
          <div className="hidden md:block">
            <Link
              href="/login"
              className="inline-flex items-center justify-center border-2 border-[#2c1ee8] text-[#2c1ee8] hover:bg-[#2c1ee8] hover:text-white font-semibold text-base lg:text-lg px-8 py-2.5 rounded-full transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-95"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-100 flex flex-col gap-4 pt-4 px-2">
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, "home")}
            className="text-gray-900 font-medium text-base py-1"
          >
            Beranda
          </a>
          <a
            href="#extracurricular"
            onClick={(e) => handleNavClick(e, "extracurricular")}
            className="text-gray-800 font-medium text-base py-1"
          >
            Ekstrakurikuler
          </a>
          <a
            href="#mading"
            onClick={(e) => handleNavClick(e, "mading")}
            className="text-gray-800 font-medium text-base py-1"
          >
            Mading
          </a>
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, "contact")}
            className="text-gray-800 font-medium text-base py-1"
          >
            Kontak
          </a>
          <Link
            href="/login"
            className="w-full text-center border-2 border-[#2c1ee8] text-[#2c1ee8] font-semibold text-base py-2.5 rounded-full mt-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </header>
  );
}
