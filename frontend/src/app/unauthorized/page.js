import React from "react";
import UnauthorizedPage from "@/components/UnauthorizedPage";

export const metadata = {
  title: "Akses Terbatas (401 / 403) | PPLG Center",
  description: "Halaman ini memerlukan izin khusus atau login akun terdaftar.",
};

export default function Page() {
  return <UnauthorizedPage />;
}
