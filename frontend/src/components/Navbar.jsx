"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { User, LogOut } from "@/components/common/Icons";
import LoginModal from "@/features/auth/components/LoginModal";

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
    { name: "Proposal", path: "/proposal" },
  ];

  if (isAuthenticated) {
    if (userRole === "admin") {
      baseNavItems.push({ name: "Panel Admin", path: "/admin" });
    } else if (userRole === "osis") {
      baseNavItems.push({ name: "Panel OSIS", path: "/osis" });
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md py-3.5 px-4 sm:px-6 lg:px-8 xl:px-12 border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          {/* Left Side: Logo & School Name */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, navItems[0])}
            className="flex items-center gap-3 group cursor-pointer shrink-0"
          >
            <div className="relative h-10 w-8.5 sm:h-11 sm:w-9 shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="SMK Negeri 2 Surakarta Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-gray-900 font-extrabold text-base sm:text-lg xl:text-xl tracking-tight group-hover:text-[#2c1ee8] transition-colors whitespace-nowrap">
                Student Center SMKN 2
              </span>
              <span className="text-gray-500 font-medium text-[11px] sm:text-xs xl:text-sm whitespace-nowrap">
                SMK Negeri 2 Surakarta
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 lg:gap-6 xl:gap-8">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-4 xl:gap-6">
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
                    className={`font-semibold text-xs lg:text-sm xl:text-base transition-colors cursor-pointer relative py-1 px-1.5 xl:px-2.5 whitespace-nowrap ${
                      isActive
                        ? "text-[#2c1ee8]"
                        : "text-gray-700 hover:text-[#2c1ee8]"
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c1ee8] rounded-full"></span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Auth Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#2c1ee8] hover:bg-blue-100 font-semibold text-xs lg:text-sm transition-all shadow-2xs border border-blue-200/60 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="max-w-[120px] truncate">{user?.fullName || user?.name?.split(" ")[0] || "Profil"}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                    title="Keluar Sesi"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenLogin}
                  className="inline-flex items-center justify-center border-2 border-[#2c1ee8] text-[#2c1ee8] hover:bg-[#2c1ee8] hover:text-white font-semibold text-xs lg:text-sm xl:text-base px-5 py-1.5 xl:px-6 xl:py-2 rounded-full transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 focus:outline-none cursor-pointer"
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
          <div className="md:hidden mt-3 pb-4 border-t border-gray-100 flex flex-col gap-3 pt-3 px-2">
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
                  className={`font-semibold text-base py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "text-[#2c1ee8] bg-blue-50"
                      : "text-gray-800 hover:text-[#2c1ee8]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="font-semibold text-base py-1.5 px-2 rounded-lg text-gray-800 hover:text-[#2c1ee8] flex items-center gap-2 cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-[#2c1ee8]" />
                  Profil Saya ({user?.name})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left font-semibold text-base py-1.5 px-2 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar Sesi
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenLogin();
                }}
                className="w-full text-center border-2 border-[#2c1ee8] text-[#2c1ee8] font-semibold text-base py-2.5 rounded-full mt-2 cursor-pointer"
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
