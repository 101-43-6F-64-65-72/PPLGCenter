# 🎨 PPLG Center — Design System & UI/UX Guidelines
> Panduan Standar Desain, Palet Warna, Tipografi, Komponen, dan Pola Interaksi untuk Revamp Seluruh Halaman PPLG Center SMKN 2 Surakarta.

---

## 📌 1. Filosofi Desain (*Design Philosophy*)

1. **Ultra-Clean & Minimalist**:
   - Menghilangkan *visual noise* dan dekorasi berlebih.
   - **Dilarang keras menggunakan "Card di dalam Card di dalam Card" (*Card Inception*)**.
   - Mengutamakan ruang bernapas (*whitespace*), tata letak lapang, dan hierarki visual yang tegas.

2. **Tegas & Kontras Tinggi (*High Contrast & Sharp Structure*)**:
   - Penggunaan garis batas tegas (*crisp borders*), bentuk balok datar (*flat rectangular*), dan teks hitam pekat di atas latar putih bersih.
   - Hindari efek *glow*, bayangan tebal (*heavy shadows*), atau gradien neon yang berlebihan.

3. **Konsisten & Terintegrasi (*Consistent & Modular*)**:
   - Seluruh halaman (Beranda, Kelas & Jadwal, Pengumuman, Profil, Auth, Admin) wajib menggunakan token warna, tipografi, radius tombol, dan komponen yang seragam.

4. **Kepatuhan Aturan Icon & Emoji**:
   - 🚫 **Dilarang menggunakan ikon yang tidak berhubungan.**
   - 🚫 **Dilarang menggunakan emoji sembarangan.**
   - Gunakan ikon fungsional SVG dari pustaka `lucide-react` dengan ukuran yang proporsional (`w-3.5` s.d. `w-5`).

---

## 🎨 2. Palet Warna Resmi (*Color Palette Tokens*)

| Kategori Token | Kode Warna Hex | Kelas Tailwind | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `#2C1EE8` | `bg-[#2c1ee8]`, `text-[#2c1ee8]` | Tombol CTA utama, badge aktif, tautan aktif, focus ring |
| **Primary Hover** | `#2317BE` | `hover:bg-[#2317be]` | Status hover tombol utama |
| **Primary Active** | `#1D129F` | `active:bg-[#1d129f]` | Status klik/tekan tombol utama |
| **Background Pure**| `#FFFFFF` | `bg-white` | Latar belakang halaman utama, panel formulir, kartu |
| **Background Subtle**| `#F8FAFC` / `#F1F5F9` | `bg-slate-50`, `bg-slate-100` | Latar belakang tabel, pill nonaktif, kontainer sekunder |
| **Dark Navy (Auth Only)**| `#071329` | `bg-[#071329]` | Latar belakang khusus login split (opsional dark mode) |
| **Text Primary** | `#000000` / `#020617` | `text-black`, `text-slate-950` | Judul utama, label input, teks penting |
| **Text Secondary**| `#475569` / `#64748B` | `text-slate-600`, `text-slate-500` | Deskripsi, subtitle, metadata tanggal & pengampu |
| **Border Sharp** | `#000000` | `border-black` | Bingkai input, kartu beraksen tegas |
| **Border Subtle**| `#E2E8F0` / `#CBD5E1` | `border-slate-200`, `border-slate-300`| Garis pembatas section, pembagi horizontal (*divide-y*) |
| **Status Active** | `#10B981` | `bg-emerald-600`, `text-emerald-600` | Sesi aktif sekarang, indikator sukses |
| **Status Break**  | `#F59E0B` | `bg-amber-50`, `text-amber-800` | Sesi istirahat/peringatan |

---

## ✍️ 3. Tipografi & Hierarki Teks (*Typography Scale*)

- **Font Family Utama**: `font-sans` (Inter / System UI Sans-serif).

### Skala Hierarki:
1. **Hero Headline**:
   - Kelas: `text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug`
   - Pola Sapaan: `Halo {NAMA}, selamat datang.`
2. **Section Title**:
   - Kelas: `text-2xl sm:text-3xl font-extrabold text-black tracking-tight`
3. **Card Title**:
   - Kelas: `text-sm sm:text-base font-black text-black leading-tight`
4. **Input & Form Label**:
   - Kelas: `text-xs font-black text-black tracking-wider uppercase font-sans`
5. **Metadata & Caption**:
   - Kelas: `text-xs text-slate-500 font-semibold font-sans`
6. **Jam / Waktu / Monospace**:
   - Kelas: `font-mono text-xs sm:text-sm font-bold text-slate-900` atau `text-[#2c1ee8]`

---

## 🧱 4. Standar Desain Komponen (*Component Standards*)

### A. Tombol (*Buttons*)
```jsx
// 1. Primary Action Button (Brand Electric Royal Blue)
<button className="w-full py-3 px-4 bg-[#2c1ee8] hover:bg-[#2317be] active:bg-[#1d129f] text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center justify-center gap-2">
  <span>Teks Aksi</span>
  <ArrowRight className="w-4 h-4" />
</button>

// 2. Secondary / Outline Button
<button className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs uppercase tracking-wider border border-slate-300 transition-colors">
  <span>Batal / Kembali</span>
</button>
```
- **Aturan**: Tanpa efek glow/shadow tebal (`shadow-none`), bentuk balok datar (*flat rectangular*).

---

### B. Kolom Input (*Form Input Fields*)
```jsx
<div className="space-y-1.5">
  <label className="block text-xs font-black text-black tracking-wider uppercase">
    NAMA KOLOM
  </label>
  <input
    type="text"
    className="w-full bg-white text-black font-semibold px-3.5 py-2.5 rounded-none border border-black outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-[#2c1ee8] transition-all text-sm placeholder:text-slate-400"
    placeholder="Masukkan data..."
  />
</div>
```
- **Aturan**: Latar putih, border hitam 1px, focus ring `#2c1ee8`, font semibold kontras tinggi.

---

### C. Daftar & Tabel Timeline (*Schedule & Timeline List*)
```jsx
<div className="border border-slate-200 divide-y divide-slate-100 bg-white">
  {items.map((item) => (
    <div className={`p-4 flex items-center justify-between gap-3 ${isActive ? 'bg-blue-50/60' : 'hover:bg-slate-50/50'}`}>
      <span className="font-mono text-xs font-bold text-slate-900 w-24">07:00 - 08:20</span>
      <p className="text-sm font-bold text-black">{item.title}</p>
    </div>
  ))}
</div>
```
- **Aturan**: Gunakan pembatas garis horizontal halus `divide-y divide-slate-100/200`. Hindari membungkus tiap baris dengan border tebal bertumpuk.

---

### D. Kartu Pengumuman / Berita (*Announcement Card*)
```jsx
<article className="border border-black bg-white flex flex-col justify-between group hover:border-[#2c1ee8] transition-colors">
  <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
    <Image src={image} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
    <span className="absolute top-3 left-3 bg-[#2c1ee8] text-white text-[10px] font-black uppercase px-2.5 py-1 tracking-wider">
      Kategori
    </span>
  </div>
  <div className="p-5 space-y-3">
    <h3 className="text-base font-black text-black group-hover:text-[#2c1ee8] transition-colors line-clamp-2">
      {title}
    </h3>
    <p className="text-xs text-slate-600 line-clamp-2">{summary}</p>
  </div>
</article>
```

---

## 🎬 5. Pedoman Animasi & Interaksi (*Motion & GSAP Standards*)

1. **Durasi & Easing**:
   - Transisi formulir / slide: `0.35s` s.d. `0.45s` dengan `ease: "power2.inOut"` atau `ease: "power3.inOut"`.
   - Hover scale gambar: `duration: 0.3s`, `ease: "easeOut"`.

2. **Pola Transisi Antar-Form (In-Place Slide)**:
   - Posisikan kedua view formulir dengan `absolute top-0 left-0 w-full` agar titik koordinat vertikal (Y) terkunci persis sama tanpa adanya *vertical jumping / jitter*.
   - Animasi geser hanya bergerak pada sumbu horizontal (`xPercent: -105` dan `xPercent: 105`).

3. **Keamanan Rendering Next.js/React**:
   - Dilarang menjalankan `gsap.from(..., { opacity: 0 })` secara global pada elemen DOM tanpa `gsap.context()` cleanup untuk menghindari *stuck low opacity* / tampilan pudar.

---

## 🤖 6. Pedoman Maskot Replyz (*Mascot Integration*)

1. **Peran Maskot**:
   - Sebagai pendamping visual pintar (*contextual observer*), bukan elemen klik yang mengganggu.
   - Diberikan kelas `pointer-events-none select-none` saat mendampingi form login / halaman input.
2. **Arah Tatapan Mata**:
   - State `notif`: Menoleh ke kiri/atas-kiri menghadap kolom input identifier (`NIS/NISN`).
   - State `peek`: Mengintip ke kiri menghadap kolom password.
   - State `thinking`: Menatap ke atas saat memproses data.
   - State `happy` / `love`: Digunakan saat aksi pengguna berhasil diselesaikan.

---

## 📐 7. Standar Tata Letak Halaman (*Layout Grid & Spacing*)

- **Navbar**: Tinggi `h-16` fixed di atas dengan latar putih `bg-white/95 backdrop-blur-md` dan garis bawah `border-b border-slate-200`.
- **Hero Banner**: Ketinggian `h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] min-h-[600px]` untuk pengalaman full viewport yang sinematik.
- **Section Spacing**: `py-12 sm:py-16 px-6 sm:px-10 lg:px-16` dengan batas maksimal kontainer `max-w-7xl mx-auto`.
- **Footer**: Brand footer SMKN 2 Surakarta dengan garis tepi atas `border-t border-slate-200`.

---

*Dokumen ini menjadi rujukan baku untuk implementasi UI/UX di seluruh rute dan modul PPLG Center.*
