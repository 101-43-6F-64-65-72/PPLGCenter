import Link from "next/link";

const footerLinks = [
  { label: "Beranda", href: "/" },
  { label: "Fasilitas", href: "/fasilitas" },
  { label: "Ekstrakurikuler", href: "/ekstrakurikuler" },
  { label: "Mading", href: "/mading" },
  { label: "Proposal", href: "/proposal" },
  { label: "Panel OSIS", href: "/osis" },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-800 via-blue-700 to-black-600 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <h3 className="text-xl font-semibold">Student Center</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">
              Portal informasi sekolah yang memudahkan siswa mengakses
              fasilitas, kegiatan ekstrakurikuler, mading, dan proposal secara
              cepat.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold">Tautan Cepat</h4>
            <ul className="mt-3 space-y-2 text-sm text-blue-100">
              {footerLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold">Kontak</h4>
            <ul className="mt-3 space-y-2 text-sm text-blue-100">
              <li>SMK Negeri 2 Surakarta</li>
              <li>Jl. Ahmad Yani No. 123</li>
              <li>studentcenter@smkn2solo.sch.id</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-6 text-center text-sm text-blue-100">
          © 2026 Student Center SMK Negeri 2 Surakarta. Semua hak cipta
          dilindungi.
        </div>
      </div>
    </footer>
  );
}
