"use client";

import React, { useEffect } from "react";
import ErrorFallback from "@/components/ErrorFallback";

/**
 * Next.js App Router Root Error Boundary (Pure JavaScript)
 * Intercepts unhandled runtime errors in page route segments and displays ErrorFallback.
 * 
 * @param {Object} props
 * @param {Error & { digest?: string }} props.error
 * @param {Function} props.reset
 */
export default function GlobalRouteError({ error, reset }) {
  useEffect(() => {
    // Log exception to dev console or external telemetry
    console.error("Unhandled Route Exception:", error);
  }, [error]);

  return (
    <ErrorFallback
      statusCode={500}
      title="Terjadi Kesalahan Server"
      description={
        error?.message ||
        "Maaf, terjadi kendala teknis yang tidak terduga saat memproses halaman ini."
      }
      error={error}
      primaryAction={{
        label: "Coba Lagi (Reset)",
        onClick: () => reset(),
      }}
      secondaryAction={{
        label: "Kembali ke Beranda",
        href: "/",
      }}
      showHomeButton={true}
      fullPage={true}
    />
  );
}
