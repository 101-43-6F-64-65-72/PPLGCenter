"use client";

import React, { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import LoginModal from "@/features/auth/components/LoginModal";

export default function GlobalAuthBarrier({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before hydration on client, render initial layout
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {/* 1. Underlying Website Content (Blurred & interaction disabled when not authenticated) */}
      <div
        className={`transition-all duration-300 ${
          !isAuthenticated
            ? "filter blur-sm pointer-events-none select-none overflow-hidden max-h-screen"
            : ""
        }`}
        aria-hidden={!isAuthenticated}
      >
        {children}
      </div>

      {/* 2. Mandatory Login Modal Overlay */}
      {!isAuthenticated && (
        <LoginModal
          isOpen={true}
          mandatory={true}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}
