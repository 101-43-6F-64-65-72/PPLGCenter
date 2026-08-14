# API Contract Agreement V1

**Project:** Student Center SMA/SMK  
**Version:** V1 (Frozen)  
**Status:** Agreed & Locked

---

# Overview

Dokumen ini merupakan kesepakatan antara tim Frontend dan Backend mengenai API Contract versi pertama (V1).

Tujuan utama dokumen ini adalah memastikan kedua tim dapat mengembangkan aplikasi secara paralel tanpa menunggu implementasi satu sama lain.

Selama pengembangan V1, seluruh endpoint, payload, response, dan struktur data pada dokumen ini dianggap **final** kecuali terdapat perubahan kebutuhan yang sangat besar.

---

# 1. API Base URL

Seluruh endpoint menggunakan prefix berikut:

```text
/api/v1
```

Contoh endpoint:

```http
POST /api/v1/auth/login
GET  /api/v1/announcements
POST /api/v1/bookings
GET  /api/v1/profile
PATCH /api/v1/profile
```

---

# 2. Standard Response Format

Semua endpoint wajib menggunakan format response yang konsisten.

## Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

---

## List Response

Endpoint yang mengembalikan daftar data wajib menggunakan pagination.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

---

## Validation Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

# 3. Authentication

## Login Request

```json
{
  "identifier": "",
  "password": ""
}
```

Identifier digunakan untuk:

- NIS/NISN (Student)
- NIP (Teacher/Admin)

---

## Authentication Flow

Backend mengembalikan JWT Access Token setelah login berhasil.

Frontend bertanggung jawab untuk:

- Menyimpan access token
- Mengirim access token pada seluruh endpoint yang membutuhkan autentikasi

Header yang digunakan:

```http
Authorization: Bearer <access_token>
```

---

# 4. Request Payload

Payload berikut dianggap final untuk API Contract V1:

- Login
- Update Profile
- Announcement
- Event
- Join Club
- Booking
- Proposal

Frontend dapat langsung membuat seluruh form berdasarkan payload tersebut.

Perubahan payload setelah fase freeze hanya dapat dilakukan melalui persetujuan kedua tim.

---

# 5. HTTP Status Code

Status code yang digunakan:

| Status | Description |
|---------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Business Validation Error |
| 500 | Internal Server Error |

Contoh penggunaan HTTP 422:

- Jadwal booking bentrok
- Kuota ekstrakurikuler penuh
- Proposal tidak dapat diproses karena aturan bisnis

---

# 6. File Upload

## Avatar

Format:

- JPG
- PNG
- WEBP

Maximum Size:

```text
2 MB
```

---

## Announcement

File yang diperbolehkan:

- Cover Image
- PDF
- DOC
- DOCX

---

## Proposal

Format:

- PDF

Maximum Size:

```text
15 MB
```

Spesifikasi upload ini dianggap final untuk V1.

---

# 7. User Roles

Role yang digunakan pada sistem:

- Student
- OSIS
- Teacher
- Admin

Catatan:

Teacher yang menjadi Pembina Ekstrakurikuler **tidak menggunakan role baru**.

Hubungan sebagai pembina ditentukan melalui relasi database.

---

# 8. API Resource Naming

Seluruh endpoint menggunakan bentuk jamak (plural).

Contoh:

```text
/users
/announcements
/events
/clubs
/facilities
/bookings
/proposals
/elections
```

Hindari penggunaan endpoint singular.

---

# 9. API Versioning

Seluruh endpoint menggunakan versi:

```text
/api/v1/
```

Apabila terjadi perubahan besar yang menyebabkan perubahan payload, struktur response, atau endpoint, maka perubahan dilakukan melalui versi baru.

Contoh:

```text
/api/v2/
```

Backend tidak diperbolehkan mengubah struktur endpoint V1 secara langsung.

---

# 10. API Contract Freeze

Untuk mendukung pengembangan paralel antara Frontend dan Backend, maka komponen berikut dianggap **freeze** pada versi V1:

- Endpoint
- Request Payload
- Response Format
- Response Field
- Field Name
- Resource Naming
- Authentication Flow
- File Upload Rules
- User Roles
- API Version

Perubahan hanya dapat dilakukan apabila:

- Terdapat perubahan kebutuhan dari pihak sekolah.
- Disetujui oleh tim Frontend dan Backend.
- Menghasilkan versi API baru apabila bersifat breaking change.

---

# Development Agreement

Frontend dan Backend dikembangkan secara independen berdasarkan dokumen ini.

Selama API Contract V1 masih berlaku:

- Backend wajib mempertahankan kompatibilitas endpoint.
- Frontend menganggap struktur response sebagai sumber kebenaran (single source of truth).
- Breaking change tidak diperbolehkan tanpa proses versioning.

Dokumen ini menjadi acuan resmi pengembangan API Student Center SMA/SMK versi 1.