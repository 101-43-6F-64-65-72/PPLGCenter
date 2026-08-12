import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    sectionLabel: "FASILITAS SEKOLAH",
    title: "Katalog & Peminjaman Fasilitas",
    description:
      "Akses mudah ke berbagai fasilitas unggulan sekolah. Dari laboratorium berteknologi tinggi hingga ruang serbaguna, semua siap digunakan untuk mendukung kegiatan akademik & ekstrakurikuler.",
    ctaText: "Jelajahi Fasilitas",
    ctaLink: "/fasilitas",
    items: [
      {
        id: 1,
        name: "Laboratorium Komputer & Server Networking",
        label: "Lab Komputer Utama",
        gradient: "from-blue-600 via-indigo-700 to-slate-900",
        accentBg: "bg-blue-500/20 text-blue-300 border-blue-400/30",
        image:
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80",
        capacity: "40 PC High Spec (Intel i7 & RTX)",
        status: "Tersedia Dipinjam",
        specs: ["High-speed Fiber Optic 1Gbps", "Full AC & Smart Projector", "Cisco Networking Racks"],
      },
      {
        id: 2,
        name: "Bengkel Otomotif & Machining CNC Industri",
        label: "Workshop Otomotif SKADA",
        gradient: "from-indigo-600 via-purple-700 to-slate-950",
        accentBg: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
        image:
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
        capacity: "Standar Industri Manufacturing",
        status: "Tersedia Dipinjam",
        specs: ["Mesin Bubut CNC Lathe", "Dyno Tester Vehicle", "Peralatan Safety Lengkap"],
      },
      {
        id: 3,
        name: "Auditorium & Multi-Purpose Grand Hall",
        label: "Aula Utama SMKN 2 Surakarta",
        gradient: "from-sky-600 via-blue-800 to-indigo-950",
        accentBg: "bg-sky-500/20 text-sky-300 border-sky-400/30",
        image:
          "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80",
        capacity: "Kapasitas 800 Orang",
        status: "Reservasi H-3",
        specs: ["Sound System Line Array 10KW", "Stage Video Wall LED 8x4m", "Central AC & Backstage Room"],
      },
      {
        id: 4,
        name: "Perpustakaan Digital & Co-Working Hub",
        label: "Perpustakaan Terpadu",
        gradient: "from-emerald-600 via-teal-800 to-slate-900",
        accentBg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
        image:
          "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=80",
        capacity: "Quiet Area & Discussion Pods",
        status: "Buka Setiap Hari Jam Kerja",
        specs: ["10,000+ E-Book Catalog", "Individual Quiet Pods", "Free Coffee & Charging Stations"],
      },
    ],
  };

  return NextResponse.json(data);
}
