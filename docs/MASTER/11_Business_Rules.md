# 11 — Business Rules

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Rule Source](#1-rule-source)
2. [Global / Cross-Cutting Rules](#2-global--cross-cutting-rules)
3. [Authentication & Users](#3-authentication--users)
4. [Announcements (Mading)](#4-announcements-mading)
5. [Assignments & Submissions](#5-assignments--submissions)
6. [Materials](#6-materials)
7. [Calendar](#7-calendar)
8. [Notifications](#8-notifications)
9. [Facility Booking](#9-facility-booking)
10. [Proposals](#10-proposals)
11. [Extracurriculars](#11-extracurriculars)
12. [Attendance](#12-attendance)
13. [Search](#13-search)
14. [Rule Matrix Summary](#14-rule-matrix-summary)

---

## 1. Rule Source

Business rules are enforced in the **Application services** (`StudentCenter.Application/Services/`) and partially in DTO validators + EF unique indexes. Items marked **(verify)** were not 100% confirmed in source during audit.

---

## 2. Global / Cross-Cutting Rules

| # | Rule |
|---|---|
| G1 | All reads use `AsNoTracking()` for performance. |
| G2 | List endpoints are paged via `PagedRequest` (page=1, pageSize=10, clamp 1–100). |
| G3 | `KeyNotFoundException` → HTTP 400 (⚠️ contract expects 404). |
| G4 | `InvalidOperationException` → HTTP 409 (business conflict). |
| G5 | Success responses wrap in `ApiResponse<T>`. |
| G6 | Role authorization enforced via `[Authorize(Roles=...)]`. |

---

## 3. Authentication & Users

| # | Rule |
|---|---|
| A1 | Login requires `email` (valid, ≤256) + password (6–100). ⚠️ contract says `identifier`. |
| A2 | Unknown email or wrong password → 401 (`UnauthorizedAccessException`). |
| A3 | Passwords stored as BCrypt hashes only. |
| A4 | JWT issued for 60 min, HS256, issuer `StudentCenter`, audience `StudentCenterApp`. |
| A5 | User email must be unique (DB unique index). |
| A6 | Only Admin can create/update/delete users (controller-level). |

---

## 4. Announcements (Mading)

| # | Rule |
|---|---|
| M1 | Create requires title + content (required fields). |
| M2 | Only Admin/OSIS can create/update/delete announcements (role-gated). |
| M3 | Comments: any authenticated user can comment. |
| M4 | Comment edit/delete allowed for **author** only (service ownership check). |
| M5 | Reactions: one reaction per user per announcement (unique index) — toggling removes/adds. |

---

## 5. Assignments & Submissions

| # | Rule |
|---|---|
| S1 | Only Teacher can create/update/delete assignments. |
| S2 | **Past-due rule:** a submission after `DueDate` is rejected (400/conflict). |
| S3 | **Duplicate rule:** one submission per student per assignment (unique index + service check) → duplicate rejected. |
| S4 | Only the assignment's teacher can grade / leave feedback. |
| S5 | Student can submit only own submission (ownership). |

---

## 6. Materials

| # | Rule |
|---|---|
| E1 | Only Teacher can create/update/delete materials. |
| E2 | Students can read materials (list filters: `subject`, `page`, `grade`). |
| E3 | Grade/subject filter uses exact match (verify). |

---

## 7. Calendar

| # | Rule |
|---|---|
| C1 | Any authenticated user can create an event. |
| C2 | Only the **creator** (or Admin) can update/delete an event. |
| C3 | `upcoming` endpoint returns future events (order by `StartTime`). |

---

## 8. Notifications

| # | Rule |
|---|---|
| N1 | Notifications are per-recipient (`UserId`). |
| N2 | Unread count endpoint filters `IsRead == false`. |
| N3 | Only recipient (or Admin) can mark read / delete. |
| N4 | Created via `NotificationService.CreateAsync` when domain events occur (proposal submitted/reviewed, booking status, assignment, etc.). |

---

## 9. Facility Booking

| # | Rule |
|---|---|
| F1 | Any authenticated user can request a booking. |
| F2 | **Conflict rule:** overlapping time ranges for the same facility → `InvalidOperationException` → **409** (prevents bentrok fasilitas). |
| F3 | Approval flow: Teacher/Admin set status via `PUT /api/bookings/{id}/status` (`Pending`/`Approved`/`Rejected`). |
| F4 | Only the booker (or role with rights) can modify/cancel own booking (verify exact scope). |

---

## 10. Proposals

| # | Rule |
|---|---|
| P1 | Submit requires `title` 5–300, `description` 10–2000, `fileUrl` ≤500 (all required). |
| P2 | Only OSIS/Teacher submit (per plan; verify controller roles). |
| P3 | Review (`status` + optional `rejectionReason` ≤1000) is Admin-only. |
| P4 | Reviewer sets `Rejected` with mandatory reason? (verify — field optional in DTO). |
| P5 | Rejection/approval generates a notification to the submitter. |

---

## 11. Extracurriculars

| # | Rule |
|---|---|
| X1 | Club create/update/delete: Admin, OSIS, or managing advisor (ownership via `ManagedByUserId`). |
| X2 | Student joins/leaves via `POST /{id}/join` / `POST /{id}/leave`. |
| X3 | One membership per student per club (unique index). |
| X4 | Removing a member is Admin/OSIS (verify). |
| X5 | MaxMembers cap enforced on join if configured (verify). |

---

## 12. Attendance

| # | Rule |
|---|---|
| T1 | One attendance record per student per day (unique index) — duplicates rejected. |
| T2 | Status enum: Present/Late/Absent/Permission/Sick. |
| T3 | Recorded by Teacher/Admin (`RecordedByUserId`). |
| T4 | Update/delete restricted to recorder/Teacher/Admin (verify). |

---

## 13. Search

| # | Rule |
|---|---|
| R1 | Keyword searched case-insensitively (`ToLower().Contains`) across **7 entity types**. |
| R2 | Parallel execution via `Task.WhenAll` (performance). |

---

## 14. Rule Matrix Summary

| Area | Critical rules | Enforced at |
|---|---|---|
| Auth | email login, BCrypt, 60-min JWT | Service + config |
| Mading | author-only comment edit | Service |
| Assignment | past-due + duplicate rejection | Service + unique index |
| Booking | time conflict → 409 | Service |
| Proposal | length limits, admin review | DTO + service |
| Ekskul | membership unique, advisor ownership | Service + unique index |
| Attendance | per-day unique | Unique index + service |
| Search | case-insensitive, parallel | Service |

---

*Cross-references: [07_Authorization](07_Authorization.md) · [08_API_Catalog](08_API_Catalog.md) · [13_Request_Response_Flow](13_Request_Response_Flow.md) · [docs/Features/*](../Features/)*
