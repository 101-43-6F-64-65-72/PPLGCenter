import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    schoolName: "Student Center SMKN 2 Surakarta",
    tagline: "Unggul, Berkarakter & Siap Kerja",
    description:
      "Platform terpadu informasi kegiatan siswa, pendaftaran ekstrakurikuler, mading digital, dan reservasi fasilitas sekolah SMK Negeri 2 Surakarta.",
    contact: {
      address: "Jl. Yosodipuro No. 105, Mangkubumen, Banjarsari, Surakarta, Jawa Tengah 57139",
      phone: "(0271) 714422",
      email: "info@smkn2surakarta.sch.id",
      hours: "Senin - Jumat: 07.00 - 15.30 WIB",
    },
    quickLinks: [
      { name: "Beranda", href: "#beranda" },
      { name: "Ekstrakurikuler", href: "#ekstrakurikuler" },
      { name: "Mading Digital", href: "#mading" },
      { name: "Fasilitas Sekolah", href: "#fasilitas" },
      { name: "Kalender Akademik", href: "/kalender" },
    ],
    servicesLinks: [
      { name: "Portal Siswa", href: "/login" },
      { name: "Peminjaman Alat & Lab", href: "/fasilitas" },
      { name: "Pendaftaran Ekskul", href: "/ekstrakurikuler" },
      { name: "Submit Karya Mading", href: "/mading" },
      { name: "Pengajuan Surat OSIS", href: "/proposal" },
    ],
    socials: [
      { name: "Instagram", href: "https://instagram.com/smkn2surakarta", icon: "Instagram" },
      { name: "YouTube", href: "https://youtube.com/smkn2surakarta", icon: "Youtube" },
      { name: "Facebook", href: "https://facebook.com/smkn2surakarta", icon: "Facebook" },
      { name: "Email", href: "mailto:info@smkn2surakarta.sch.id", icon: "Mail" },
    ],
    copyright: "© 2026 Student Center SMK Negeri 2 Surakarta. Developed with Pride for SKADA.",
  };

  return NextResponse.json(data);
}
