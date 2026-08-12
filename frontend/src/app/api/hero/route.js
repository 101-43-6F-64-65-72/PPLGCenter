import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    badge: "STUDENT CENTER SMKN 2 SURAKARTA",
    headline: "Mencetak Lulusan Unggul & Ready-to-Work",
    description:
      "Pusat kegiatan siswa terpadu SMK Negeri 2 Surakarta. Akses informasi mading digital, pendaftaran ekstrakurikuler, dan layanan katalog peminjaman fasilitas sekolah secara real-time.",
    campusImage:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
    ctaPrimary: {
      text: "Jelajahi Portal",
      href: "#ekstrakurikuler",
    },
    ctaSecondary: {
      text: "Katalog Fasilitas",
      href: "#fasilitas",
    },
    features: [
      {
        id: "feat-1",
        title: "Akreditasi A",
        subtitle: "Unggul & Terpercaya",
        icon: "Award",
        badgeColor: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
      },
      {
        id: "feat-2",
        title: "Berprestasi",
        subtitle: "Tingkat Kota & Nasional",
        icon: "Trophy",
        badgeColor: "from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30",
      },
      {
        id: "feat-3",
        title: "Kurikulum Industri",
        subtitle: "Siap Kerja & Wirausaha",
        icon: "Briefcase",
        badgeColor: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
      },
    ],
  };

  return NextResponse.json(data);
}
