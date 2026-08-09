# Panduan Konfigurasi Supabase Storage untuk Dokumen PDF

Dokumen ini menjelaskan langkah-langkah pengaturan **Supabase Storage** pada Supabase Dashboard untuk menyimpan dokumen PDF (Proposal, Tugas/Submissions, Materi Pembelajaran) secara **Private** dan aman.

---

## 1. Setup Storage Bucket pada Supabase Dashboard

1. Masuk ke **Supabase Dashboard** (`https://app.supabase.com`) dan pilih project Anda.
2. Klik menu **Storage** pada panel sebelah kiri.
3. Klik tombol **New bucket**.
4. Masukkan konfigurasi bucket sebagai berikut:
   - **Bucket name**: `documents`
   - **Public bucket**: **DISALURKAN / OFF (Set Private)** 🔒 *(PENTING: Jangan aktifkan toggle Public bucket)*
   - **Allowed MIME types**: `application/pdf`
   - **Maximum file size**: `10 MB` (atau `10485760` bytes)
5. Klik **Save / Create bucket**.

---

## 2. Environment Variables Backend (.NET API)

Tambahkan konfigurasi berikut pada file `appsettings.json` atau environment variables server backend (`.env` / OS Environment):

```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...<service_role_secret_key>
SUPABASE_STORAGE_BUCKET=documents
```

> [!CAUTION]
> **PENTING UNTUK KEAMANAN:**
> `SUPABASE_SERVICE_ROLE_KEY` memiliki akses bypass Row Level Security (RLS) dan HANYA boleh disimpan pada server Backend (.NET API).
> **JANGAN PERNAH** membocorkan `SUPABASE_SERVICE_ROLE_KEY` ke environment frontend (misal `NEXT_PUBLIC_*`) atau mengunggahnya ke repositori publik.

---

## 3. Alur Kerja Akses Dokumen (Signed URL)

1. **Upload**: Frontend mengirim file PDF ke backend API (`POST /api/upload`).
2. **Penyimpanan**: Backend memvalidasi file dan mengunggahnya ke Supabase Storage bucket `documents` di folder yang ditentukan (misal `proposals/{uuid}.pdf`).
3. **Database**: Database backend menyimpan **object path** (contoh: `proposals/550e8400-e29b-41d4-a716-446655440000.pdf`), BUKAN public/signed URL permanen.
4. **Pembacaan**: Ketika data diakses oleh pengguna terautentikasi & berhak, backend secara otomatis membuat **Signed URL sementara** (berlaku 60 menit) sehingga dokumen private dapat dibuka dengan aman.
5. **Kompatibilitas Dokumen Lama**: Dokumen lama yang menggunakan URL legacy (Cloudinary/Local) tetap didukung dan dibuka tanpa hambatan.
