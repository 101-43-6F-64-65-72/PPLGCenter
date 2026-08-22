"use client";

import React from "react";
import ErrorFallback from "@/components/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      statusCode={404}
      title="Halaman Tidak Ditemukan"
      description="Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan."
      primaryAction={{ label: "Kembali ke Beranda", href: "/" }}
      secondaryAction={{ label: "Lihat Pengumuman", href: "/pengumuman" }}
      fullPage={true}
    />
  );
}
