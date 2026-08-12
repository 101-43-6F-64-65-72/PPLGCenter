"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { User, LogOut } from "@/components/common/Icons";
import LoginModal from "@/features/auth/components/LoginModal";
import NotificationBell from "@/components/notification/NotificationBell";
import { Menu, X, ChevronRight, Sparkles } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, role, logout } = useAuth();

  const userRole = (role || user?.role || "").toLowerCase();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const baseNavItems = [
    { name: "Beranda", path: "#beranda", route: "/" },
    { name: "Fasilitas", path: "#fasilitas", route: "/fasilitas" },
    { name: "Ekstrakurikuler", path: "#ekstrakurikuler", route: "/ekstrakurikuler" },
    { name: "Mading", path: "#mading", route: "/mading" },
    { name: "Kalender", path: "/kalender", route: "/kalender" },
  ];

  if (isAuthenticated) {
    baseNavItems.push({ name: "Proposal", path: "/proposal", route: "/proposal" });
    baseNavItems.push({ name: "PEMILOS", path: "/pemilos", route: "/pemilos" });
  }

  if (isAuthenticated) {
    if (userRole === "admin") {
      baseNavItems.push({ name: "Panel Admin", path: "/admin", route: "/admin" });
    } else if (userRole === "osis") {
      baseNavItems.push({ name: "Panel OSIS", path: "/osis", route: "/osis" });
    } else if (userRole === "teacher") {
      baseNavItems.push({ name: "Panel Guru", path: "/guru", route: "/guru" });
    }
  }

  const handleNavClick = (e, item) => {
    setMobileMenuOpen(false);

    if (item.path.startsWith("#")) {
      if (pathname === "/") {
        e.preventDefault();
        const element = document.querySelector(item.path);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        router.push("/" + item.path);
      }
    }
  };

  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "osis") return "/osis";
    if (userRole === "teacher") return "/guru";
    return "/dashboard";
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-900/90 backdrop-blur-md py-3 shadow-xl border-b border-white/10"
            : "bg-gradient-to-b from-slate-950/90 via-slate-900/70 to-transparent py-5 border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <span className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                    S2
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                    Student Center
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    SKADA
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium tracking-wide">
                  SMK Negeri 2 Surakarta
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-inner">
              {baseNavItems.map((item) => {
                const isActive =
                  pathname === item.route ||
                  (item.path.startsWith("#") && pathname === "/");
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Auth / Action */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <Link
                    href={getDashboardPath()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    <span>{user?.name || "Dashboard"}</span>
                  </Link>
                  <button
                    onClick={logout}
                    title="Keluar"
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-semibold rounded-xl group bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-600 hover:text-white text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 active:scale-95"
                >
                  <span className="relative px-5 py-2 transition-all ease-in duration-75 bg-slate-950/40 rounded-[10px] group-hover:bg-opacity-0 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                    Login Portal
                  </span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              {isAuthenticated && <NotificationBell />}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/80 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 mt-3 animate-in fade-in slide-in-from-top-4 duration-200">
            {baseNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                onClick={(e) => handleNavClick(e, item)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <span>{item.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-800">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    href={getDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30"
                  >
                    <span>Masuk Dashboard ({user?.name || "Profil"})</span>
                    <User className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-400 font-medium border border-red-500/20"
                  >
                    <span>Keluar dari Akun</span>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Login Portal Student Center</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </>
  );
}
