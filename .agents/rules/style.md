---
trigger: always_on
---

# PPLG CENTER UI/UX & STYLE RULES

1. DILARANG MENGGUNAKAN ICON YANG TIDAK BERHUBUNGAN, DAN TIDAK BOLEH MENGGUNAKAN EMOJI SEMBARANGAN.
2. Dilarang keras menggunakan desain "Card di dalam Card di dalam Card" (Card Inception) yang bertumpuk tebal.
3. Selalu gunakan sistem desain resmi yang terdokumentasi di [DESIGN_SYSTEM.md](file:///d:/PKL%20ENUMA/KERJA!/SchoolProject/PPLG-CENTER/PPLGCenter/DESIGN_SYSTEM.md):
   - Warna Utama: White `#FFFFFF`, Black `#000000`, Electric Royal Blue `#2C1EE8` (Hover: `#2317BE`, Active: `#1D129F`).
   - Tombol: Flat rectangular, tanpa glow / shadow berlebih, uppercase bold text.
   - Input: Border hitam tegas (`border-black`), latar putih, high contrast.
   - Maskot Replyz: Tidak bisa diklik pada form (`pointer-events-none select-none`), mata menatap ke arah kolom input/fokus form.
   - Animasi GSAP: Wajib gunakan `gsap.context()` cleanup untuk mencegah bug opacity/flicker.
