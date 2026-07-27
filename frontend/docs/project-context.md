# FRONTEND_CONTEXT.md

# Student Center SMA/SMK Frontend Context

## Project Overview

Student Center adalah sistem informasi berbasis web untuk membantu aktivitas siswa, OSIS, ekstrakurikuler, guru, dan waka kesiswaan dalam satu platform.

Aplikasi harus memiliki tampilan modern, mudah digunakan, responsive, dan dapat digunakan oleh seluruh warga sekolah.

Frontend hanya bertanggung jawab terhadap tampilan, interaksi pengguna, validasi dasar, dan komunikasi dengan Backend API.

---

# Tech Stack

Framework
- Next.js 15+
- App Router

Language
- JavaScript (ES2023)

Styling
- Tailwind CSS

Icons
- Lucide React

UI Components
- shadcn/ui

Form Validation
- React Hook Form
- Zod

HTTP Client
- Fetch API

Deployment
- Vercel

---

# Development Principles

Frontend harus:

- Responsive
- Mobile First
- Fast
- Accessible
- Maintainable
- Reusable
- Clean UI
- Minimal Design

---

# Target Users

1. Student
2. OSIS
3. Extracurricular Administrator
4. Teacher
5. Admin (Vice Principal of Student Affairs)

Setiap role memiliki tampilan dashboard yang berbeda.

---

# Main Modules

## Authentication

- Login
- Forgot Password
- Profile
- Change Password

---

## Dashboard

Dashboard berbeda sesuai role.

Student Dashboard

- Latest Announcement
- Upcoming Events
- Joined Clubs
- Facility Booking Status
- Proposal Status

OSIS Dashboard

- Announcement Management
- Event Management
- Proposal
- Booking

Teacher Dashboard

- Proposal Approval
- Booking Approval
- Event Monitoring

Admin Dashboard

- User Statistics
- Announcement Statistics
- Club Statistics
- Proposal Statistics
- Facility Statistics

---

## Digital Bulletin Board

Features

- Announcement List
- Announcement Detail
- Attachments
- Search
- Category Filter

---

## School Calendar

Features

- Monthly Calendar
- Event Detail
- Upcoming Events

---

## Extracurricular

Features

- Club List
- Club Detail
- Registration
- Member List
- Attendance

---

## Facility Booking

Features

- Facility List
- Booking Form
- Booking History
- Approval Status

---

## Proposal

Features

- Upload Proposal
- Proposal Detail
- Proposal Status
- Approval Timeline

---

## Profile

Features

- Personal Information
- Phone Number
- Class
- Major
- Avatar

---

# Folder Structure

src/

app/

components/

hooks/

services/

utils/

constants/

lib/

styles/

public/

---

# Component Rules

Components harus:

- Reusable
- Small
- Independent
- Easy to read

Pisahkan:

UI Components

Business Components

Layout Components

---

# Data Fetching Rules

Jangan melakukan fetch langsung di dalam UI Component.

Semua komunikasi API dilakukan melalui folder:

services/

Contoh

announcementService.js

bookingService.js

profileService.js

proposalService.js

---

# Naming Convention

Folders

kebab-case

Components

PascalCase

Functions

camelCase

Hooks

useSomething

Services

somethingService

Constants

UPPER_CASE

---

# UI Guidelines

Design Style

Modern

Minimal

Clean

Professional

Student Friendly

---

Spacing

Gunakan spacing Tailwind secara konsisten.

---

Border Radius

rounded-xl

rounded-2xl

---

Shadow

Gunakan shadow ringan.

Hindari shadow berlebihan.

---

Cards

Semua informasi utama menggunakan Card.

---

Buttons

Gunakan variant yang konsisten.

Primary

Secondary

Outline

Ghost

Danger

---

Tables

Gunakan

- Sorting
- Pagination
- Empty State
- Loading
- Search

---

Forms

Semua form memiliki

- Label
- Placeholder
- Validation
- Error Message
- Loading State

---

Loading State

Setiap halaman wajib memiliki

Skeleton Loading

---

Empty State

Jika data kosong harus menampilkan ilustrasi dan pesan yang informatif.

---

Error State

Tampilkan pesan yang mudah dipahami pengguna.

Jangan menampilkan stack trace.

---

Responsive Rules

Desktop First Layout

Namun tetap optimal pada

Desktop

Laptop

Tablet

Mobile

Gunakan breakpoint Tailwind.

---

Accessibility

Gunakan semantic HTML.

Semua gambar memiliki alt.

Semua input memiliki label.

Semua tombol memiliki teks yang jelas.

Pastikan dapat digunakan menggunakan keyboard.

---

Performance Rules

Gunakan Server Components jika memungkinkan.

Gunakan Client Components hanya jika membutuhkan:

- useState
- useEffect
- Event Handler

Gunakan lazy loading untuk halaman besar.

Optimalkan gambar menggunakan next/image.

---

Coding Standards

- Jangan menggunakan inline style.
- Hindari kode yang duplikat.
- Selalu buat reusable component jika digunakan lebih dari satu kali.
- Pisahkan business logic dari UI.
- Gunakan helper function untuk logika yang kompleks.
- Komponen harus memiliki satu tanggung jawab utama (Single Responsibility Principle).

---

Frontend Goals

Frontend harus memberikan pengalaman pengguna yang:

- Cepat
- Modern
- Konsisten
- Mudah dipelajari
- Mudah digunakan
- Responsif
- Mudah dikembangkan di masa depan