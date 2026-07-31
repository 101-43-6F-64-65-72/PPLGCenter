# Color Guidelines & Design Tokens

Dokumen ini berisi panduan penggunaan warna dan token sistem desain untuk platform **Student Center (SMK Negeri 2 Surakarta)**.

---

## 🎨 Color Palette Overview

### 1. Primary Color System (Biru Utama)
Warna **Biru (Primary Blue)** digunakan sebagai warna identitas utama aplikasi, navigasi, tombol aksen, banner Mading, serta fokus interaksi.

| Token / Color Name | Hex Code | Tailwind Equivalent | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `#2c1ee8` | `bg-[#2c1ee8]` | Tombol utama, hover state, teks aktif navigasi |
| **Primary Blue** | `#1d4ed8` | `bg-blue-700` | Banner Mading, tombol `Selengkapnya`, badge aktif |
| **Primary Bright** | `#2563eb` | `bg-blue-600` | Kartu Mading `TEXT INFO`, indikator aktif, efek gradien |
| **Primary Light** | `#eff6ff` | `bg-blue-50` | Hover state tombol putih, highlight latar belakang |

---

### 2. White Surface & Catalog Cards System
Seluruh latar belakang halaman website dijaga tetap **Putih bersih (`#ffffff`)** dengan aksen **Primary Blue**.

| Token / Color Name | Hex Code | Tailwind Equivalent | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| **Clean White Surface** | `#ffffff` | `bg-white` | Latar belakang utama halaman Mading & kartu katalog |
| **Card Border Light** | `#f3f4f6` | `border-gray-100` | Garis tepi halus kartu katalog Mading |
| **Card Border Hover** | `#93c5fd` | `hover:border-blue-300` | Efek hover garis tepi kartu katalog Mading |
| **Heading Dark** | `#111827` | `text-gray-900` | Judul artikel & section katalog Mading |

---

## 📌 Rules for Component Styling

1. **Latar Belakang Halaman**:
   - Dijaga tetap **Putih (`bg-white`)** secara keseluruhan agar konsisten dengan halaman utama web platform sekolah.

2. **Katalog Kartu Mading (`MadingCatalogSection`)**:
   - Berlatar belakang putih bersih dengan aksen **Primary Blue (`#1d4ed8`)** pada badge kategori, tombol filter, teks hover, dan tombol baca.
