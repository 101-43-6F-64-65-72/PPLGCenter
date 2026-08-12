import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    sectionLabel: "EKSTRAKURIKULER",
    title: "Wadah Minat, Bakat & Kepemimpinan",
    description:
      "Kembangkan potensi non-akademik, karakter kepemimpinan, dan keahlian spesifik melalui beragam kegiatan ekstrakurikuler unggulan SMK Negeri 2 Surakarta.",
    ctaText: "Daftar Ekstrakurikuler",
    ctaLink: "/ekstrakurikuler",
    items: [
      {
        id: 1,
        name: "Paskibra (Bhakti Wira)",
        category: "Kedisiplinan & PBB",
        image:
          "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80",
        members: "120+ Siswa",
        badge: "Juara 1 Provinsi",
        description:
          "Membentuk kedisiplinan tinggi, ketahanan fisik, serta kepemimpinan yang tangguh dan berjiwa nasionalis.",
      },
      {
        id: 2,
        name: "Pramuka (Ganesha Scout)",
        category: "Kepramukaan",
        image:
          "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80",
        members: "350+ Siswa",
        badge: "Gugus Depan Tergiat",
        description:
          "Mengasah keterampilan bertahan hidup, kepemimpinan, gotong royong, dan kepedulian sosial lingkungan.",
      },
      {
        id: 3,
        name: "Robotika & Automation Club",
        category: "Teknologi & Sains",
        image:
          "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        members: "85+ Siswa",
        badge: "Juara LKS Nasional",
        description:
          "Riset Microcontroller, IoT, AI, dan perakitan robot industri siap tanding di tingkat internasional.",
      },
      {
        id: 4,
        name: "PMR & KSR Wira",
        category: "Kesehatan & Kemanusiaan",
        image:
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        members: "95+ Siswa",
        badge: "Pertolongan Pertama Terbaik",
        description:
          "Pelatihan penanganan medis darurat, donor darah, dan aksi tanggap bencana bagi masyarakat.",
      },
      {
        id: 5,
        name: "Skada Basketball & Sports",
        category: "Olahraga Prestasi",
        image:
          "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
        members: "140+ Siswa",
        badge: "Finalis DBL Surakarta",
        description:
          "Pembinaan atlet basket, futsal, dan bola voli dengan fasilitasi pelatih profesional berlisensi.",
      },
      {
        id: 6,
        name: "Software & Web Innovation",
        category: "IT & Software",
        image:
          "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        members: "110+ Siswa",
        badge: "Hackathon Winner",
        description:
          "Komunitas developer muda pembuat aplikasi web, mobile app, dan sistem informasi sekolah modern.",
      },
    ],
  };

  return NextResponse.json(data);
}
