# 22 — Naming Convention

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Purpose](#1-purpose)
2. [Backend Naming Rules](#2-backend-naming-rules)
3. [Frontend Naming Rules](#3-frontend-naming-rules)
4. [Database Naming Rules](#4-database-naming-rules)
5. [API Naming Rules](#5-api-naming-rules)
6. [Test Naming Rules](#6-test-naming-rules)
7. [Common Pitfalls in This Repo](#7-common-pitfalls-in-this-repo)

---

## 1. Purpose

Consistent naming across layers so developers can locate code by name. This project mixes **English** (code/structure) and **Indonesian** (domain data, messages, DTOs like `EkstrakurikulerDto`). Rules below document the *de facto* standard observed.

---

## 2. Backend Naming Rules

| Item | Rule | Example |
|---|---|---|
| Namespaces | `StudentCenter.<Layer>` | `StudentCenter.Application.Services` |
| Classes (entities) | PascalCase, singular noun | `User`, `FacilityBooking` |
| Enums | PascalCase singular; values PascalCase | `BookingStatus.Pending` |
| DTOs | `<Name>Request` / `<Name>Response` / `<Name>Dto` | `LoginRequest`, `LoginResponse`, `PagedResult<T>` |
| Service interfaces | `I<Name>Service` | `IAnnouncementService` |
| Service classes | `<Name>Service` | `AnnouncementService` |
| Methods | PascalCase + `Async` suffix | `CreateAsync`, `GetByIdAsync` |
| Params/locals | camelCase | `request`, `currentUser` |
| Private fields | `_camelCase` | `_dbContext` |
| Controllers | `<Feature>Controller` | `AnnouncementsController` |
| EF configs | `<Entity>Configuration` | `UserConfiguration` |
| Migrations | EF-generated `yyyyMMddHHmmss_<Name>` | `20260730081029_AddAttendanceEntity` |

**Language mix note:** keep structural identifiers English; keep domain terms (Indonesian words such as `Ekstrakurikuler`, `Jabatan`) as proper nouns in English-grammar identifiers.

---

## 3. Frontend Naming Rules

| Item | Rule | Example |
|---|---|---|
| Pages | `page.js` in route folder | `src/app/login/page.js` |
| Route folders | kebab-case | `ekstrakurikuler/` |
| Components | PascalCase file + function | `LoginForm.jsx` |
| Hooks | `use<Verb>` | `useAuth`, `useLogin` |
| Contexts | `<Name>Context` + provider `<Name>Provider` | `AuthContext.jsx` |
| Services | camelCase `<name>Service.js` | `authService.js` |
| Constants | SCREAMING_SNAKE for route keys? / camelCase objects | `API_ROUTES`, `USER_ROLES` (verify) |
| Config | camelCase keys | `BASE_URL`, `TIMEOUT` |

---

## 4. Database Naming Rules

| Item | Rule |
|---|---|
| Tables | EF default from DbSet names (e.g., `Users`) — verify `ToTable()` overrides |
| Columns | EF convention: PascalCase → Npgsql converts to snake_case? (verify actual) |
| PKs | `Id` (Guid) |
| FKs | `<Entity>Id` or `<Entity><Role>UserId` (`AuthorUserId`) |

---

## 5. API Naming Rules

| Item | Rule | Example |
|---|---|---|
| Resource | plural lowercase | `/api/announcements` |
| Sub-resource | parent/id/child | `/api/announcements/{id}/comments` |
| Actions | REST verbs, explicit path verbs for status | `PUT /api/bookings/{id}/status` |
| Query params | camelCase | `?page=1&pageSize=10&keyword=` |

---

## 6. Test Naming Rules

Observed in `StudentCenter.Tests`:

| Item | Rule | Example |
|---|---|---|
| Class | `<Service>Tests` | `ProposalServiceTests` |
| Method | `<Scenario>_<ExpectedResult>` | `CreateProposal_ShouldCreate_WhenValid` (verify exact patterns) |
| Framework | xUnit `[Fact]`/`[Theory]` + FluentAssertions | – |

---

## 7. Common Pitfalls in This Repo

1. **`identifier` vs `email`** — frontend login field name disagrees with backend DTO.
2. **`/clubs` vs `/extracurriculars`** — frontend route vs backend route.
3. **`/profile`** — frontend expects an endpoint that doesn't exist.
4. **`Ekstrakurikuler`** (Indonesian) vs **`Extracurricular`** — both spellings appear; keep one canonical identifier (`Extracurricular`) and use Indonesian only in display strings.
5. **Status naming** — `BookingStatus`/`ProposalStatus` both use `Pending/Approved/Rejected`; do not conflate (they are separate enums).

---

*Cross-references: [21_Code_Standards](21_Code_Standards.md) · [09_Entity_Catalog](09_Entity_Catalog.md) · [28_Project_Glossary](28_Project_Glossary.md)*
