import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    sectionLabel: "MADING DIGITAL",
    title: "Informasi, Karya & Pengumuman Sekolah",
    description:
      "Portal berita sekolah modern. Temukan pengumuman resmi akademik, prestasi terbaru siswa, artikel inspiratif, dan galeri karya kreatif terpopuler.",
    ctaText: "Jelajahi Seluruh Mading Digital",
    ctaLink: "/mading",
    items: [
      {
        id: 1,
        title: "Pelaksanaan Uji Kompetensi Keahlian (UKK) Berstandar Industri 2026",
        date: "10 Agustus 2026",
        category: "Pengumuman",
        author: "Tim Kurikulum",
        image:
          "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
        summary:
          "Panduan teknis, jadwal penguji eksternal dari mitra industri, dan kisi-kisi persiapannya bagi seluruh siswa kelas XII.",
      },
      {
        id: 2,
        title: "Prestasi Gemilang: Tim Skada Robotics Meraih Gold Medal LKS 2026",
        date: "08 Agustus 2026",
        category: "Prestasi",
        author: "Humas SMKN 2",
        image:
          "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        summary:
          "Inovasi arm robot sorter otomatis buatan siswa jurusan Mekatronika berhasil menyisihkan 34 perwakilan sekolah nasional.",
      },
      {
        id: 3,
        title: "Pendaftaran Open Recruitment Pengurus OSIS & MPK Periode 2026/2027",
        date: "05 Agustus 2026",
        category: "OSIS",
        author: "Pengurus OSIS",
        image:
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
        summary:
          "Kesempatan bagi siswa kelas X dan XI untuk mengasah jiwa kepemimpinan dan berorganisasi dalam membangun Student Center.",
      },
      {
        id: 4,
        title: "Karya Siswa: Desain User Interface Website Student Center Versi 3.0",
        date: "02 Agustus 2026",
        category: "Karya Kreatif",
        author: "Jurusan RPL",
        image:
          "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
        summary:
          "Eksplorasi estetika modern glassmorphism dan animasi GSAP ScrollTrigger hasil karya kolaborasi tim Rekayasa Perangkat Lunak.",
      },
    ],
  };

  return NextResponse.json(data);
}
