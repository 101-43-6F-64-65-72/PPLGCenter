"use client";

import React from "react";
import { QueryClientProvider, queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

export default Providers;
