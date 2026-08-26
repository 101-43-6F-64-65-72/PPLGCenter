"use client";

import React, { useState, useEffect } from "react";
import { QueryClientProvider, queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import AiChatModal from "@/components/AiChatModal";
import ManualGuide from "@/components/onboarding/ManualGuide";

let ToasterComponent = () => null;
try {
  ToasterComponent = require("react-hot-toast").Toaster;
} catch (e) {
  // Safe fallback if react-hot-toast is missing in local node_modules
}

import ChangeDefaultPasswordModal from "@/components/auth/ChangeDefaultPasswordModal";
import GlobalAuthBarrier from "@/components/auth/GlobalAuthBarrier";
import useAuth from "@/hooks/useAuth";

function DefaultPasswordGuard() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener("app:show-default-password-modal", handleOpenModal);

    if (typeof window !== "undefined" && user) {
      const mustChange = localStorage.getItem("sc_must_change_password") === "true";
      const dismissed = sessionStorage.getItem("sc_dismissed_pwd_warning") === "true";
      if (mustChange && !dismissed) {
        setIsOpen(true);
      }
    }

    return () => {
      window.removeEventListener("app:show-default-password-modal", handleOpenModal);
    };
  }, [user]);

  return (
    <ChangeDefaultPasswordModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSuccess={() => setIsOpen(false)}
    />
  );
}

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalAuthBarrier>
          {children}
        </GlobalAuthBarrier>
        <AiChatModal />
        <ManualGuide />
        <DefaultPasswordGuard />
        <ToasterComponent
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "16px",
              fontWeight: "600",
              fontSize: "13px",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default Providers;
