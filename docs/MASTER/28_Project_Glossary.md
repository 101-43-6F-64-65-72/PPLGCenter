# 28 — Project Glossary

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Terminology](#1-terminology)
2. [Domain Terms (Indonesian)](#2-domain-terms-indonesian)
3. [Technical Terms](#3-technical-terms)
4. [Status Values](#4-status-values)

---

## 1. Terminology

| Term | Meaning |
|---|---|
| StudentCenter | The product: unified school activities platform |
| Mading | Digital bulletin board (announcements) |
| Ekskul | Extracurricular (club) |
| OSIS | Student council (school organization) |
| Waka Kesiswaan | Vice Principal for Student Affairs (often the Admin) |
| Pembina Ekskul | Club advisor (modeled as `ManagedByUserId`) |
| Proposal | Activity proposal submitted by OSIS/Teacher for Admin review |
| Fasilitas | Facility (bookable rooms/equipment) |

---

## 2. Domain Terms (Indonesian)

| Indonesian term | English / code equivalent |
|---|---|
| Mading | Announcement |
| Ekskul / Ekstrakurikuler | Extracurricular |
| Siswa | Student |
| Guru | Teacher |
| Fasilitas | Facility |
| Pengumuman | Announcement |
| Peminjaman | Booking |
| Kehadiran | Attendance |
| Tugas | Assignment |
| Materi | Material |
| Kalender | CalendarEvent |
| Notifikasi | Notification |
| Pencarian | Search |

---

## 3. Technical Terms

| Term | Meaning |
|---|---|
| Clean Architecture | Layering: Domain → Application → Infrastructure → Api |
| `AppDbContext` | EF Core DbContext (Infrastructure) |
| `ApiResponse<T>` | Standard success/error envelope |
| `PagedRequest` / `PagedResult<T>` | Pagination request/response |
| JWT | JSON Web Token (HS256, 60 min) |
| JWT Bearer | HTTP auth scheme (`Authorization: Bearer ...`) |
| IDOR | Insecure Direct Object Reference (accessing others' records) |
| RBAC | Role-Based Access Control |
| NIS / NISN / NIP | Indonesian student / national student / employee numbers (planned login identifiers) |
| Pooler | Supabase connection-pooling endpoint (:6543) |
| Monorepo | Single repo hosting backend + frontend + tests + docs |

---

## 4. Status Values

| Enum | Values |
|---|---|
| `UserRole` | Admin(0), Teacher(1), Student(2), OSIS(3) |
| `BookingStatus` | Pending(0), Approved(1), Rejected(2) |
| `ProposalStatus` | Pending(0), Approved(1), Rejected(2) |
| `AttendanceStatus` | Present(0), Late(1), Absent(2), Permission(3), Sick(4) |
| `NotificationType` | Assignment(0), Announcement(1), Calendar(2), Proposal(3), Booking(4), Grade(5), System(6), Other(7) |

---

*Cross-references: [22_Naming_Convention](22_Naming_Convention.md) · [09_Entity_Catalog](09_Entity_Catalog.md) · [docs/Project/Glossary.md](../Project/Glossary.md)*
