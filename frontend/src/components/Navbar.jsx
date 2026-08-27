"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { User, LogOut, ChevronDown, Menu, X } from "lucide-react";
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
  const isPplgTeacher =
    userRole === "teacher" &&
    (position.includes("pengembangan perangkat lunak dan gim") || position.includes("pplg"));
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
    router.push("/login");
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 font-sans transition-all duration-200 select-none">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* ─── Left Side: Official Brand & Logo SMKN 2 Surakarta ─── */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, primaryNavItems[0])}
            className="flex items-center gap-2.5 group cursor-pointer shrink-0"
          >
            <div className="relative w-7 h-9 shrink-0 overflow-visible">
              <Image
                src="/images/logo.png"
                alt="SMK Negeri 2 Surakarta Logo"
                fill
                sizes="36px"
                className="object-contain transition-transform duration-200 group-hover:scale-105"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-black font-black text-xs sm:text-sm tracking-tight uppercase group-hover:text-[#2c1ee8] transition-colors whitespace-nowrap">
                PPLG Center
              </span>
              <span className="text-slate-500 font-bold text-[9px] sm:text-[10px] tracking-wider uppercase whitespace-nowrap">
                SMK Negeri 2 Surakarta
              </span>
            </div>
          </Link>

          {/* ─── Desktop Navigation Links (Compact & Direct) ─── */}
          <nav id="nav-primary" className="hidden lg:flex items-center gap-1">
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
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                    isActive
                      ? "text-black border-[#2c1ee8]"
                      : "text-slate-600 border-transparent hover:text-black hover:border-slate-300"
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
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-1 ${
                  isSecondaryActive || isDropdownOpen
                    ? "text-black border-[#2c1ee8]"
                    : "text-slate-600 border-transparent hover:text-black hover:border-slate-300"
                }`}
              >
                <span>Lainnya</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-black" : "text-slate-500"
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-black p-1 shadow-lg z-50">
                  {secondaryNavItems.map((item) => {
                    const isActive =
                      item.path === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.path);
                    const isAdminItem = item.path === "/admin" || item.path === "/cctv";

                    return (
                      <React.Fragment key={item.name}>
                        {item.path === "/cctv" && (
                          <div className="my-1 border-t border-slate-200" />
                        )}
                        <Link
                          href={item.path}
                          onClick={(e) => handleNavClick(e, item)}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            isActive
                              ? "bg-[#2c1ee8] text-white"
                              : "text-black hover:bg-slate-100"
                          }`}
                        >
                          <span>{item.name}</span>
                          {isAdminItem && (
                            <span
                              className={`text-[9px] uppercase px-1.5 py-0.5 font-black ${
                                isActive ? "bg-white text-black" : "bg-black text-white"
                              }`}
                            >
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

          {/* ─── Right Side Auth Actions & Mobile Toggle ─── */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Desktop Auth Controls */}
            <div className="hidden lg:flex items-center gap-2.5">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div data-ai-target="notif_button">
                    <NotificationBell />
                  </div>
                  <Link
                    id="profile-nav-btn"
                    href="/profile"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                  >
                    <User className="w-3.5 h-3.5 text-[#2c1ee8]" />
                    <span className="max-w-[130px] truncate">
                      {user?.fullName || user?.name?.split(" ")[0] || "PROFIL"}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-1.5 border border-slate-300 hover:border-red-600 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    title="Keluar Sesi"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  data-ai-target="login_button"
                  onClick={handleOpenLogin}
                  className="inline-flex items-center justify-center bg-[#2c1ee8] hover:bg-[#2317be] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider px-4 py-1.5 transition-colors cursor-pointer shrink-0"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Header Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              {isAuthenticated && (
                <div data-ai-target="notif_button_mobile">
                  <NotificationBell />
                </div>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 border border-slate-300 bg-slate-100 hover:bg-slate-200 text-black cursor-pointer transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Mobile Drawer Menu (Full Responsive) ─── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1.5 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
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
                  className={`font-bold text-xs uppercase tracking-wider py-2 px-3 transition-colors cursor-pointer flex items-center justify-between border ${
                    isActive
                      ? "bg-[#2c1ee8] text-white border-[#2c1ee8]"
                      : "bg-slate-50 text-black border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Mobile "Lainnya" Accordion */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setMobileDropdownOpen((prev) => !prev)}
                className={`font-bold text-xs uppercase tracking-wider py-2 px-3 transition-colors cursor-pointer flex items-center justify-between w-full border ${
                  isSecondaryActive || mobileDropdownOpen
                    ? "bg-slate-100 text-black border-slate-400"
                    : "bg-slate-50 text-black border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Lainnya</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    mobileDropdownOpen ? "rotate-180 text-black" : "text-slate-500"
                  }`}
                />
              </button>

              {mobileDropdownOpen && (
                <div className="ml-2 pl-2.5 my-1 border-l-2 border-[#2c1ee8] flex flex-col gap-1 py-1">
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
                        className={`font-bold text-xs uppercase tracking-wider py-1.5 px-2.5 transition-colors cursor-pointer flex items-center justify-between border ${
                          isActive
                            ? "bg-[#2c1ee8] text-white border-[#2c1ee8]"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{item.name}</span>
                        {isAdminItem && (
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 font-black ${
                              isActive ? "bg-white text-black" : "bg-black text-white"
                            }`}
                          >
                            Admin
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Auth Actions */}
            <div className="pt-2 mt-1 border-t border-slate-200 flex flex-col gap-1.5">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="font-bold text-xs uppercase tracking-wider py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-black flex items-center gap-2 cursor-pointer min-w-0"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-3.5 h-3.5 text-[#2c1ee8] shrink-0" />
                    <span className="truncate">Profil ({user?.fullName || user?.name || "Akun"})</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left font-bold text-xs uppercase tracking-wider py-2 px-3 border border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Sesi</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenLogin();
                  }}
                  className="w-full text-center bg-[#2c1ee8] hover:bg-[#2317be] text-white font-bold text-xs uppercase tracking-wider py-2.5 cursor-pointer transition-colors"
                >
                  Login
                </button>
              )}
            </div>
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
