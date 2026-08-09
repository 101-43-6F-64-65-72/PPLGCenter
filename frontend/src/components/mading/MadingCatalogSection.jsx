"use client";

import React from "react";
import EmptyState from "@/components/common/EmptyState";

/**
 * Legacy Mading Catalog Section Component
 * Retained for backward imports, delegates to standardized EmptyState when data is unavailable.
 */
export default function MadingCatalogSection() {
  return (
    <section id="mading-catalog" className="w-full bg-white text-gray-900 py-16 sm:py-20 px-4 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <EmptyState
          title="Ups... Data Tidak Ditemukan"
          description="Belum ada publikasi mading digital yang tersedia saat ini."
        />
      </div>
    </section>
  );
}
