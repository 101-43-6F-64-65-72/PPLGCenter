"use client";

import React from "react";
import ErrorFallback from "./ErrorFallback";

/**
 * Unauthorized Page Wrapper Component (Pure JavaScript / JSX)
 * Wraps universal ErrorFallback with default 401/403 authorization configuration.
 * 
 * @param {Object} props
 * @param {number|string} [props.statusCode=401]
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {string} [props.loginUrl]
 * @param {string} [props.homeUrl]
 * @param {boolean} [props.fullPage=true]
 */
export function UnauthorizedPage({
  statusCode = 401,
  title = "Ups! Halaman Ini Perlu Izin Khusus",
  subtitle = "Kamu harus masuk (login) dengan akun terdaftar untuk mengakses ekosistem dan modul ini.",
  loginUrl = "/login",
  homeUrl = "/",
  fullPage = true,
}) {
  return (
    <ErrorFallback
      statusCode={statusCode}
      title={title}
      description={subtitle}
      primaryAction={{ label: "Masuk Akun (Login)", href: loginUrl }}
      secondaryAction={{ label: "Kembali ke Beranda", href: homeUrl }}
      showHomeButton={true}
      fullPage={fullPage}
    />
  );
}

export default UnauthorizedPage;
