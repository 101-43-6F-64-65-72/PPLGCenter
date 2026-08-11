"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { User, LogOut } from "@/components/common/Icons";
import LoginModal from "@/features/auth/components/LoginModal";
import NotificationBell from "@/components/notification/NotificationBell";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, role, logout } = useAuth();

  const userRole = (role || user?.role || "").toLowerCase();

  const baseNavItems = [
    { name: "Beranda", path: "/" },
    { name: "Fasilitas", path: "/fasilitas" },
    { name: "Ekstrakurikuler", path: "/ekstrakurikuler" },
    { name: "Mading", path: "/mading" },
    { name: "Kalender", path: "/kalender" },
  ];

  // Add Proposal menu only for authenticated users
  if (isAuthenticated) {
    baseNavItems.push({ name: "Proposal", path: "/proposal" });
    // Phase 6: Pemilos & OSIS Structure
    baseNavItems.push({ name: "PEMILOS", path: "/pemilos" });
    baseNavItems.push({ name: "Struktur OSIS", path: "/osis/structure" });
  }

  if (isAuthenticated) {
    if (userRole === "admin") {
      baseNavItems.push({ name: "Panel Admin", path: "/admin" });
    } else if (userRole === "osis") {
      baseNavItems.push({ name: "Panel OSIS", path: "/osis" });
      baseNavItems.push({ name: "Rekrutmen OSIS", path: "/osis/recruitment" });
    } else if (userRole === "teacher") {
      baseNavItems.push({ name: "Panel Guru", path: "/guru" });
    }
  }

  const navItems = baseNavItems;

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (item.path === "/") {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/");
      }
      return;
    }

    if (item.path === "/ekstrakurikuler") {
      if (pathname === "/ekstrakurikuler") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/ekstrakurikuler");
      }
      return;
    }

    if (item.path === "/mading") {
      if (pathname === "/mading") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/mading");
      }
      return;
    }

    if (item.path === "/proposal") {
      if (pathname === "/proposal") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/proposal");
      }
      return;
    }

    if (item.path === "/osis") {
      if (pathname === "/osis") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/osis");
      }
      return;
    }

    router.push(item.path);
  };

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLogin = () => {
    setIsLoginModalOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    router.push("/profile");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md py-3 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 shadow-2xs transition-all duration-200">
        <div className="w-full max-w-[1536px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Left Side: Logo & School Name */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, navItems[0])}
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0"
          >
            <div className="relative h-9 w-7.5 sm:h-10 sm:w-8 shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="SMK Negeri 2 Surakarta Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-slate-900 font-bold text-sm sm:text-base tracking-tight group-hover:text-[#2c1ee8] transition-colors whitespace-nowrap">
                Student Center
              </span>
              <span className="text-slate-500 font-medium text-[10px] sm:text-xs whitespace-nowrap">
                SMK Negeri 2 Surakarta
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 shrink min-w-0">
            {navItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`font-semibold text-xs xl:text-sm transition-all cursor-pointer py-1.5 px-3 whitespace-nowrap rounded-lg ${
                    isActive
                      ? "text-[#2c1ee8] bg-blue-50 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Auth Actions & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Auth */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-[#2c1ee8] hover:bg-blue-100/80 font-semibold text-xs xl:text-sm transition-all border border-blue-100 cursor-pointer shrink-0"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="max-w-[90px] sm:max-w-[120px] xl:max-w-[150px] truncate">
                      {user?.fullName || user?.name?.split(" ")[0] || "Profil"}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    title="Keluar Sesi"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenLogin}
                  className="inline-flex items-center justify-center bg-[#2c1ee8] hover:bg-blue-700 text-white font-semibold text-xs xl:text-sm px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                >
                  Login
                </button>
              )}
            </div>

            {/* Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none cursor-pointer rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 pb-4 border-t border-gray-100 flex flex-col gap-2 pt-3 px-2 max-h-[75vh] overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`font-semibold text-sm py-2 px-3 rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? "text-[#2c1ee8] bg-blue-50 font-bold"
                      : "text-gray-800 hover:text-[#2c1ee8] hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <Link
                  href="/profile"
                  className="font-semibold text-sm py-2 px-3 rounded-xl text-gray-800 hover:text-[#2c1ee8] hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-[#2c1ee8]" />
                  Profil Saya ({user?.fullName || user?.name})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left font-semibold text-sm py-2 px-3 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar Sesi
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenLogin();
                }}
                className="w-full text-center border-2 border-[#2c1ee8] text-[#2c1ee8] font-semibold text-sm py-2.5 rounded-full mt-2 cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        )}
      </header>

      {/* Overlap Login Modal Overlay Component */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLogin}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
