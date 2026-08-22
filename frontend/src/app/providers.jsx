"use client";

import React from "react";
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

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <AiChatModal />
        <ManualGuide />
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
