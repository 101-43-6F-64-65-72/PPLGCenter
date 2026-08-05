"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// TODO: Integrasi data detail ekstrakurikuler dari backend
// TODO: Integrasi jadwal latihan dari backend
// TODO: Integrasi foto ekstrakurikuler
// TODO: Integrasi data pembina ekstrakurikuler

const extracurricularDetails = {
  basket: {
    name: "Basket",
    category: "Olahraga",
    maxMember: 30,
    description:
      "Ekstrakurikuler Basket melatih kemampuan bermain bola basket, kerja sama tim, disiplin, serta sportivitas melalui latihan rutin dan pertandingan antar sekolah.",
    schedule: {
      day: "Rabu & Jumat",
      time: "15.30 - 17.00 WIB",
      location: "Lapangan Basket SMKN 2 Surakarta",
    },
    instructor: "Drs. Budi Santoso",
  },
  futsal: {
    name: "Futsal",
    category: "Olahraga",
    maxMember: 25,
    description:
      "Ekstrakurikuler Futsal bertujuan mengembangkan teknik bermain, kekompakan tim, kebugaran fisik, dan semangat kompetisi dalam olahraga futsal.",
    schedule: {
      day: "Selasa & Kamis",
      time: "15.30 - 17.30 WIB",
      location: "Lapangan Futsal SMKN 2 Surakarta",
    },
    instructor: "Eko Prasetyo, S.Pd.",
  },
  voli: {
    name: "Voli",
    category: "Olahraga",
    maxMember: 30,
    description:
      "Ekstrakurikuler Voli membina kemampuan teknik dasar bola voli, komunikasi tim, serta membentuk karakter sportif dan percaya diri.",
    schedule: {
      day: "Senin & Rabu",
      time: "15.30 - 17.00 WIB",
      location: "Lapangan Olahraga Utama",
    },
    instructor: "Agus Wijaya, S.Or.",
  },
  badminton: {
    name: "Badminton",
    category: "Olahraga",
    maxMember: 20,
    description:
      "Ekstrakurikuler Badminton melatih keterampilan bermain bulu tangkis, kecepatan, ketepatan, serta daya tahan fisik siswa.",
    schedule: {
      day: "Kamis & Sabtu",
      time: "15.00 - 17.00 WIB",
      location: "Aula Gedung Olahraga Sekolah",
    },
    instructor: "Rina Kusuma, S.Pd.",
  },
  teater: {
    name: "Teater",
    category: "Seni & Budaya",
    maxMember: 35,
    description:
      "Ekstrakurikuler Teater mengembangkan kemampuan akting, public speaking, kreativitas, dan kerja sama dalam pertunjukan seni.",
    schedule: {
      day: "Rabu & Sabtu",
      time: "15.30 - 17.30 WIB",
      location: "Aula Seni & Budaya",
    },
    instructor: "Bambang Kurniawan, S.Sn.",
  },
  "paduan-suara": {
    name: "Paduan Suara",
    category: "Seni & Budaya",
    maxMember: 40,
    description:
      "Ekstrakurikuler Paduan Suara melatih teknik vokal, harmonisasi, serta kekompakan dalam bernyanyi bersama.",
    schedule: {
      day: "Selasa & Jumat",
      time: "15.30 - 17.00 WIB",
      location: "Ruang Musik Utama",
    },
    instructor: "Siti Rahmawati, S.Pd.",
  },
  band: {
    name: "Band",
    category: "Seni & Budaya",
    maxMember: 15,
    description:
      "Ekstrakurikuler Band menjadi wadah bagi siswa untuk mengembangkan bakat musik, bermain alat musik, dan tampil dalam berbagai acara sekolah.",
    schedule: {
      day: "Senin & Kamis",
      time: "15.30 - 17.30 WIB",
      location: "Studio Musik Sekolah",
    },
    instructor: "Hendra Wijaya, S.Kom.",
  },
  "creativity-corner": {
    name: "Creativity Corner",
    category: "Seni & Budaya",
    maxMember: 25,
    description:
      "Ekstrakurikuler Creativity Corner berfokus pada fotografi dan videografi untuk mengembangkan kreativitas, editing, dokumentasi, dan pembuatan konten digital.",
    schedule: {
      day: "Rabu",
      time: "15.30 - 17.30 WIB",
      location: "Lab Multimedia SMKN 2",
    },
    instructor: "Dimas Anggara, S.ST.",
  },
  osis: {
    name: "OSIS",
    category: "Organisasi",
    maxMember: 40,
    description:
      "OSIS merupakan organisasi siswa yang berperan dalam mengembangkan kepemimpinan, tanggung jawab, serta menyelenggarakan berbagai kegiatan sekolah.",
    schedule: {
      day: "Senin & Jumat",
      time: "15.30 - 17.30 WIB",
      location: "Ruang Sekretariat OSIS",
    },
    instructor: "Pembina Kesiswaan",
  },
  pmr: {
    name: "PMR",
    category: "Organisasi",
    maxMember: 30,
    description:
      "PMR melatih siswa mengenai pertolongan pertama, kepedulian sosial, kesehatan, serta kesiapsiagaan dalam membantu sesama.",
    schedule: {
      day: "Selasa",
      time: "15.30 - 17.00 WIB",
      location: "Ruang Unit PMR",
    },
    instructor: "Sri Wahyuni, S.Kep.",
  },
  pramuka: {
    name: "Pramuka",
    category: "Organisasi",
    maxMember: 50,
    description:
      "Pramuka membentuk karakter disiplin, mandiri, tanggung jawab, kepemimpinan, dan kecintaan terhadap alam.",
    schedule: {
      day: "Jumat",
      time: "14.00 - 16.30 WIB",
      location: "Lapangan Utama SMKN 2 Surakarta",
    },
    instructor: "Pembina Gugus Depan",
  },
  paskibra: {
    name: "Paskibra",
    category: "Organisasi",
    maxMember: 35,
    description:
      "Paskibra melatih kedisiplinan, kepemimpinan, kekompakan, dan kemampuan baris-berbaris secara profesional.",
    schedule: {
      day: "Rabu & Sabtu",
      time: "15.30 - 17.30 WIB",
      location: "Lapangan Upacara SMKN 2 Surakarta",
    },
    instructor: "Pelatih Paskibra",
  },
  elmobpela: {
    name: "ELMOBPELA",
    category: "Organisasi",
    maxMember: 20,
    description:
      "ELMOBPELA merupakan ekstrakurikuler pecinta alam yang berfokus pada kegiatan pendakian, konservasi lingkungan, survival, dan cinta alam.",
    schedule: {
      day: "Kamis",
      time: "15.30 - 17.30 WIB",
      location: "Basecamp Pecinta Alam SMKN 2",
    },
    instructor: "Tim Pembina Lingkungan",
  },
  pks: {
    name: "PKS",
    category: "Organisasi",
    maxMember: 25,
    description:
      "PKS membina siswa dalam menjaga ketertiban, keamanan lingkungan sekolah, serta meningkatkan rasa tanggung jawab.",
    schedule: {
      day: "Senin & Kamis",
      time: "15.30 - 17.00 WIB",
      location: "Pos Keamanan Sekolah",
    },
    instructor: "Pelatih PKS",
  },
  rohkat: {
    name: "ROHKAT",
    category: "Organisasi",
    maxMember: 20,
    description:
      "ROHKAT menjadi wadah pembinaan iman Katolik melalui kegiatan kerohanian, pelayanan, dan pengembangan karakter positif.",
    schedule: {
      day: "Jumat",
      time: "12.30 - 14.00 WIB",
      location: "Ruang Kerohanian Katolik",
    },
    instructor: "Pembina Agama Katolik",
  },
  rohkris: {
    name: "ROHKRIS",
    category: "Organisasi",
    maxMember: 20,
    description:
      "ROHKRIS membimbing siswa Kristen dalam memperdalam iman, persekutuan, pelayanan, serta kegiatan rohani di sekolah.",
    schedule: {
      day: "Jumat",
      time: "12.30 - 14.00 WIB",
      location: "Ruang Persekutuan Kristen",
    },
    instructor: "Pembina Agama Kristen",
  },
  rohis: {
    name: "ROHIS",
    category: "Organisasi",
    maxMember: 25,
    description:
      "ROHIS merupakan organisasi kerohanian Islam yang membina akhlak, ibadah, kajian keislaman, dan kepemimpinan siswa.",
    schedule: {
      day: "Jumat",
      time: "13.00 - 15.00 WIB",
      location: "Masjid SMKN 2 Surakarta",
    },
    instructor: "Pembina Agama Islam",
  },
};

export default function ExtracurricularDetailPage() {
  const params = useParams();
  const slug = params?.slug?.toString()?.toLowerCase();

  const data = extracurricularDetails[slug] || {
    name: slug ? slug.toUpperCase() : "Ekstrakurikuler",
    category: "Ekstrakurikuler",
    maxMember: 30,
    description:
      "Kegiatan pengembangan minat, bakat, dan potensi diri siswa SMKN 2 Surakarta.",
    schedule: {
      day: "Sesuai Jadwal",
      time: "15.30 - 17.00 WIB",
      location: "Lingkungan SMKN 2 Surakarta",
    },
    instructor: "Pembina Ekstrakurikuler",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/ekstrakurikuler"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#2c1ee8] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Daftar Ekstrakurikuler</span>
          </Link>
        </div>

        {/* Detail Card Container */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
          {/* Layout Grid: Desktop 2 Kolom, Tablet & Mobile 1 Kolom */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Kolom Kiri: Card Foto Placeholder (Rasio 4:5) */}
            <div className="lg:col-span-5 w-full">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-slate-100 via-gray-50 to-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-xs">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(44,30,232,0.06),transparent_70%)] pointer-events-none" />
                
                {/* Icon Image Placeholder */}
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/90 text-[#2c1ee8] shadow-md border border-blue-100/80 mb-4">
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <span className="rounded-xl bg-white/80 px-4 py-2 text-xs font-bold text-gray-500 border border-gray-200 shadow-2xs backdrop-blur-xs">
                  📷 Foto belum tersedia
                </span>
                <p className="mt-2 text-[11px] text-gray-400 max-w-[200px]">
                  Foto resmi kegiatan {data.name} akan segera diunggah.
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Informasi Ekstrakurikuler */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                {/* Badge Kategori */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2c1ee8]">
                  {data.category}
                </div>

                {/* Nama Ekstrakurikuler */}
                <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                  {data.name}
                </h1>

                {/* Deskripsi */}
                <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
                  {data.description}
                </p>

                {/* Info Jadwal Latihan */}
                <div className="mt-6 rounded-2xl border border-gray-200/80 bg-slate-50/80 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#2c1ee8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Jadwal Latihan
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="rounded-xl bg-white p-3 border border-gray-200/60 shadow-2xs">
                      <span className="block text-xs text-gray-400 font-medium">Hari</span>
                      <span className="block text-sm font-extrabold text-gray-900 mt-0.5">{data.schedule.day}</span>
                    </div>

                    <div className="rounded-xl bg-white p-3 border border-gray-200/60 shadow-2xs">
                      <span className="block text-xs text-gray-400 font-medium">Waktu</span>
                      <span className="block text-sm font-extrabold text-gray-900 mt-0.5">{data.schedule.time}</span>
                    </div>

                    <div className="rounded-xl bg-white p-3 border border-gray-200/60 shadow-2xs">
                      <span className="block text-xs text-gray-400 font-medium">Tempat</span>
                      <span className="block text-sm font-extrabold text-gray-900 mt-0.5 truncate" title={data.schedule.location}>
                        {data.schedule.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informasi Maksimal Anggota */}
                <div className="mt-4 rounded-2xl border border-blue-100 bg-[#f8faff] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#2c1ee8]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 font-medium">Max Member</span>
                      <span className="block text-base font-extrabold text-[#2c1ee8]">{data.maxMember} Siswa</span>
                    </div>
                  </div>

                  {data.instructor && (
                    <div className="text-right">
                      <span className="block text-xs text-gray-400 font-medium">Pembina</span>
                      <span className="block text-sm font-bold text-gray-800">{data.instructor}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Contact Us (WhatsApp) */}
              <div className="pt-4">
                <a
                  href="https://wa.me/6282322377070"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-[#2c1ee8] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#2c1ee8]/25 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* WhatsApp SVG Icon */}
                  <svg
                    className="w-6 h-6 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.002 3.661 3.745-.985z" />
                  </svg>
                  <span>Hubungi Pembina</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
