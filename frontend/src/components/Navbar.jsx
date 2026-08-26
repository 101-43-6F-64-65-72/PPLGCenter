"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { User, LogOut, ChevronDown } from "@/components/common/Icons";
import LoginModal from "@/features/auth/components/LoginModal";
import NotificationBell from "@/components/notification/NotificationBell";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, role, logout } = useAuth();

  const userRole = (role || user?.role || "").toLowerCase();
  const position = (user?.position || "").toLowerCase();
  const isPplgTeacher = userRole === "teacher" && (position.includes("pengembangan perangkat lunak dan gim") || position.includes("pplg"));
  const isAdminOrPplgTeacher = userRole === "admin" || isPplgTeacher;

  // Primary visible items on desktop
  const primaryNavItems = [
    { name: "Beranda", path: "/" },
    { name: "Kelas & Jadwal", path: "/kelas" },
    { name: "Pengumuman", path: "/pengumuman" },
    { name: "Fasilitas", path: "/fasilitas" },
  ];

  // Secondary items contained in "Lainnya" dropdown
  const secondaryNavItems = [
    { name: "Kuis Harian", path: "/kuis" },
    { name: "Perpustakaan", path: "/perpustakaan" },
    { name: "Komunitas PPLG", path: "/komunitas" },
    { name: "Kalender", path: "/kalender" },
    { name: "Umpan Balik", path: "/umpan-balik" },
  ];

  if (isAuthenticated && isAdminOrPplgTeacher) {
    secondaryNavItems.push({ name: "CCTV", path: "/cctv" });
    secondaryNavItems.push({ name: "Panel Admin", path: "/admin" });
  }

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const isSecondaryActive = secondaryNavItems.some((item) =>
    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)
  );

  useEffect(() => {
    if (isSecondaryActive) {
      setMobileDropdownOpen(true);
    }
  }, [isSecondaryActive, pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    const handleOpenLoginEvent = () => setIsLoginModalOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("app:open-login", handleOpenLoginEvent);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (typeof window !== "undefined") {
        window.removeEventListener("app:open-login", handleOpenLoginEvent);
      }
    };
  }, []);

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setIsDropdownOpen(false);

    if (item.path === "/") {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/");
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md py-2.5 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(15,23,42,0.04)] transition-all duration-200">
        <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Left Side: Logo & School Name */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, primaryNavItems[0])}
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0"
          >
            <div className="relative h-9 w-7.5 sm:h-10 sm:w-8 shrink-0 transition-transform duration-300 group-hover:scale-105">
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
              <span className="text-slate-900 font-bold text-sm sm:text-base tracking-tight group-hover:text-blue-600 transition-colors whitespace-nowrap">
                PPLG Center
              </span>
              <span className="text-slate-500 font-medium text-[10px] sm:text-xs whitespace-nowrap">
                SMK Negeri 2 Surakarta
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav id="nav-primary" className="hidden lg:flex items-center gap-1 shrink min-w-0 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
            {primaryNavItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`font-semibold text-xs lg:text-sm transition-all duration-150 cursor-pointer py-1.5 px-3 whitespace-nowrap rounded-lg ${
                    isActive
                      ? "text-slate-900 bg-white shadow-xs font-bold border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* "Lainnya" Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`font-semibold text-xs lg:text-sm transition-all duration-150 cursor-pointer py-1.5 px-3 whitespace-nowrap rounded-lg flex items-center gap-1 ${
                  isSecondaryActive || isDropdownOpen
                    ? "text-slate-900 bg-white shadow-xs font-bold border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <span>Lainnya</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-slate-900" : "text-slate-500"
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 lg:left-0 lg:right-auto mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {secondaryNavItems.map((item) => {
                    const isActive =
                      item.path === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.path);
                    const isAdminItem = item.path === "/admin" || item.path === "/cctv";

                    return (
                      <React.Fragment key={item.name}>
                        {item.path === "/cctv" && (
                          <div className="my-1 border-t border-slate-100" />
                        )}
                        <Link
                          href={item.path}
                          onClick={(e) => handleNavClick(e, item)}
                          className={`flex items-center justify-between px-3.5 py-2 text-xs lg:text-sm font-medium transition-colors cursor-pointer ${
                            isActive
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span>{item.name}</span>
                          {isAdminItem && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </Link>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Side Auth Actions & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Auth (Hidden on mobile screens) */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div data-ai-target="notif_button">
                    <NotificationBell />
                  </div>
                  <Link
                    id="profile-nav-btn"
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-xs lg:text-sm transition-all border border-slate-200 cursor-pointer shrink-0"
                  >
                    <User className="w-3.5 h-3.5 text-[#2c1ee8]" />
                    <span className="max-w-[140px] truncate">
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
                  data-ai-target="login_button"
                  onClick={handleOpenLogin}
                  className="inline-flex items-center justify-center bg-[#2c1ee8] hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs lg:text-sm px-5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs active:scale-[0.97]"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Header Controls (Visible on mobile/tablet) */}
            <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
              {isAuthenticated && (
                <div data-ai-target="notif_button_mobile">
                  <NotificationBell />
                </div>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none cursor-pointer rounded-xl bg-slate-100 hover:bg-slate-200/80 transition-colors border border-slate-200/60"
                aria-label="Toggle Navigation Menu"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2.5 pb-4 border-t border-slate-100 flex flex-col gap-1 pt-3 px-2 max-h-[75vh] overflow-y-auto">
            {/* Primary Mobile Links */}
            {primaryNavItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`font-semibold text-sm py-2.5 px-3 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "text-slate-900 bg-slate-100 font-bold border border-slate-200/80"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Mobile Dropdown for "Lainnya" */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setMobileDropdownOpen((prev) => !prev)}
                className={`font-semibold text-sm py-2.5 px-3 rounded-xl transition-colors cursor-pointer flex items-center justify-between w-full text-left ${
                  isSecondaryActive || mobileDropdownOpen
                    ? "text-slate-900 bg-slate-100/90 font-bold border border-slate-200/80"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Lainnya</span>
                  {isSecondaryActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mobileDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                  }`}
                />
              </button>

              {mobileDropdownOpen && (
                <div className="ml-3 pl-3 my-1 border-l-2 border-blue-500/30 flex flex-col gap-1 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {secondaryNavItems.map((item) => {
                    const isActive =
                      item.path === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.path);
                    const isAdminItem = item.path === "/admin" || item.path === "/cctv";

                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        onClick={(e) => handleNavClick(e, item)}
                        className={`font-medium text-xs sm:text-sm py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                          isActive
                            ? "text-blue-700 bg-blue-50 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <span>{item.name}</span>
                        {isAdminItem && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  href="/profile"
                  className="font-semibold text-sm py-2 px-3 rounded-xl text-slate-800 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-blue-600" />
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
                className="w-full text-center bg-[#2c1ee8] hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl mt-2 cursor-pointer shadow-xs"
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
