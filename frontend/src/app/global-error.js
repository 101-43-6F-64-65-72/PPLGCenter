"use client";

import React, { useEffect } from "react";
import ErrorFallback from "@/components/ErrorFallback";

/**
 * Next.js App Router Global Error Boundary (Pure JavaScript)
 * Intercepts errors occurring within the Root Layout itself.
 * Must include <html> and <body> tags.
 * 
 * @param {Object} props
 * @param {Error & { digest?: string }} props.error
 * @param {Function} props.reset
 */
export default function GlobalLayoutError({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled Layout Level Exception:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-gray-50 text-slate-900 font-sans antialiased min-h-screen flex flex-col justify-center items-center p-4">
        <ErrorFallback
          statusCode={500}
          title="Terjadi Kesalahan Sistem Utama"
          description={
            error?.message ||
            "Sistem mengalami kendala kritis pada kerangka utama aplikasi."
          }
          error={error}
          primaryAction={{
            label: "Muat Ulang Aplikasi",
            onClick: () => reset(),
          }}
          secondaryAction={{
            label: "Kembali ke Beranda",
            href: "/",
          }}
          showHomeButton={true}
          fullPage={false}
        />
      </body>
    </html>
  );
}
