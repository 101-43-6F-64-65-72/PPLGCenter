# Panduan Deploy Monorepo (Independent Frontend & Backend Deployment)

Dokumen ini menjelaskan cara mengatur deploy terpisah antara **Frontend (Next.js)** dan **Backend (.NET API)** dalam 1 Repository Git Monorepo agar ketika ada perubahan pada **Frontend**, server **Backend TIDAK perlu di-redeploy (build ulang)** dan sebaliknya.

---

## 1. Strategi Utama Deployment Terpisah (Path-Based Trigger)

Kunci utama dalam Monorepo adalah menggunakan **Path Filter / Watch Paths**. Dengan aturan ini:
- Git Commit yang mengubah file di dalam folder `/frontend/` **hanya akan memicu build Frontend**.
- Git Commit yang mengubah file di dalam folder `/backend/` **hanya akan memicu build Backend**.

---

## 2. Cara 1: Memakai Platform Hosting Cloud (Vercel / Netlify / Railway / Render)

### A. Deploy Frontend ke Vercel (Rekomendasi Terbaik untuk Next.js)
1. Import repository Git di Vercel.
2. Di bagian **Root Directory**, isi dengan: `frontend`
3. Ke menu **Project Settings** ➔ **Git** ➔ **Ignored Build Step**:
   - Pilih **Command** dan masukkan perintah diff berikut:
     ```bash
     git diff --quiet HEAD^ HEAD ./frontend
     ```
   - *Fungsi*: Vercel otomatis membatalkan build jika commit tidak menyentuh folder `frontend/`.

---

### B. Deploy Backend .NET ke VPS / Railway / Render / CapRover / Coolify
1. Di platform hosting backend (misal Railway / Render / VPS Docker), atur **Root Directory / Watch Paths** ke:
   ```text
   /backend
   ```
2. *Fungsi*: Backend hanya akan di-build ulang saat ada perubahan pada folder `backend/`.

---

## 3. Cara 2: Memakai GitHub Actions (Otomatis via `.github/workflows`)

Telah dibuatkan 2 file workflow otomatis di dalam repository:

1. **Frontend Workflow**: [.github/workflows/deploy-frontend.yml](file:///d:/PKL%20ENUMA/KERJA!/SchoolProject/StudentCenter/.github/workflows/deploy-frontend.yml)
   - Memakai filter `paths: ['frontend/**']`
2. **Backend Workflow**: [.github/workflows/deploy-backend.yml](file:///d:/PKL%20ENUMA/KERJA!/SchoolProject/StudentCenter/.github/workflows/deploy-backend.yml)
   - Memakai filter `paths: ['backend/**']`

---

## Summary Keuntungan

Dengan konfigurasi ini:
- 🚀 **Kecepatan Deploy**: Update UI Frontend selesai dalam hitungan detik.
- ⚡ **Beban Server Minimal**: Backend (.NET REST API) tetap berjalan stabil 100% tanpa *downtime* saat update tampilan frontend.
- 🛡️ **Isolasi Risiko**: Error sintaks pada frontend tidak akan mempengaruhi server backend yang sedang berjalan.
