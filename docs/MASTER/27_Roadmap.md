# 27 — Roadmap

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Source of Roadmap](#1-source-of-roadmap)
2. [Documented Roadmap (Planning Docs)](#2-documented-roadmap-planning-docs)
3. [Codebase Reality vs Plan](#3-codebase-reality-vs-plan)
4. [Recommended Next Phases (From This Audit)](#4-recommended-next-phases-from-this-audit)
5. [Milestone Timeline (Suggested)](#5-milestone-timeline-suggested)

---

## 1. Source of Roadmap

The planning roadmap lives in `docs/Project/Roadmap.md`, `docs/Home.md`, `frontend/docs/student-center.md`, and `frontend/docs/progres-projek.md`. Priorities are labeled in Indonesian (Tinggi/Menengah/Rendah).

---

## 2. Documented Roadmap (Planning Docs)

Per `docs/Home.md` / `Roadmap.md` (summarized):

| Phase | Focus |
|---|---|
| Phase 1 | Auth, madin/digital bulletin, school calendar, ekskul |
| Phase 2 | Profile self-service (NIS/NISN/NIP, kelas, jurusan, no HP), dashboard, facility booking |
| Phase 3 | Proposal management, notifications |
| Phase 4 | File upload (Supabase Storage), e-voting (OSIS election), advanced reporting |

`frontend/docs/progres-projek.md` snapshot (dated, outdated): **frontend ~38%, backend ~12%** — significantly behind current code (backend is far ahead of that figure today).

---

## 3. Codebase Reality vs Plan

| Planned feature | Backend | Frontend | Notes |
|---|---|---|---|
| Auth (P1) | ✅ | ⚠️ | contract broken |
| Mading (P1) | ✅ | ⚠️ | path mismatch |
| Calendar (P1) | ✅ | ❌ | not wired |
| Ekskul (P1) | ✅ | ⚠️ | `/clubs` mismatch |
| Profile self-service (P2) | ❌ | ⚠️ | no backend endpoint/fields |
| Dashboard (P2) | ✅ | ⚠️ | base path mismatch |
| Facility booking (P2) | ✅ | ⚠️ | slots/PATCH mismatch |
| Proposal (P3) | ✅ | ⚠️ | upload mismatch |
| Notifications (P3) | ✅ | ❌ | not wired |
| File upload (P4) | ❌ | ⚠️ | multipart not supported |
| E-Voting (P4) | ❌ | ❌ | not started |
| Attendance | ✅ | ❌ | (not in original roadmap list; implemented) |
| Search | ✅ | ❌ | (implemented) |

---

## 4. Recommended Next Phases (From This Audit)

Derived from debt register [26](26_Technical_Debt.md) and known issues [25](25_Known_Issues.md):

**Phase A — Security hardening (P0)**
- Rotate secrets, remove default admin, fix CI version, token hardening.

**Phase B — Integration stabilization (P1)**
- Align base path, login field, endpoints (`/profile`, `/clubs`, `/slots`), PUT/PATCH, proposal upload.
- Target: login → dashboard → mading → booking works end-to-end.

**Phase C — Reliability (P2)**
- Exception mapping 404/422, IDOR fixes, expand tests (booking/submission/jwt), CI test step, NU1903.

**Phase D — Feature completion (P3+)**
- Wire notifications + search to frontend; implement profile self-service; implement file upload (Supabase Storage); e-voting.

**Phase E — Ops & polish (P3)**
- Real deployment (CI deploy steps), observability, README/AGENTS, cleanup.

---

## 5. Milestone Timeline (Suggested)

| Milestone | Scope | Est. effort |
|---|---|---|
| M1 | Security sprint (P0) | 1–2 days |
| M2 | Integration sprint (P1) | 3–5 days |
| M3 | Reliability sprint (P2) | 1–2 weeks |
| M4 | Feature completion (P3+) | 2–4 weeks |
| M5 | Ops & polish | ongoing |

> These are recommendations from this audit; the official roadmap remains `docs/Project/Roadmap.md`.

---

*Cross-references: [26_Technical_Debt](26_Technical_Debt.md) · [12_Feature_Flow](12_Feature_Flow.md) · [docs/Project/Roadmap.md](../Project/Roadmap.md) · [docs/Home.md](../Home.md)*
