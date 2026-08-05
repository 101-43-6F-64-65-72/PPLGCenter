# 29 — FAQ

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Backend](#2-backend)
3. [Frontend](#3-frontend)
4. [Database](#4-database)
5. [Security](#5-security)
6. [Deployment](#6-deployment)

---

## 1. Getting Started

**Q: How do I run the backend?**
`dotnet run --project backend/StudentCenter.Api` → http://localhost:5051, Swagger at https://localhost:7187/swagger (Development).

**Q: How do I run the frontend?**
`cd frontend && npm install && npm run dev` → http://localhost:3000.

**Q: How do I log in?**
Default admin: `admin@studentcenter.id` — password is whatever was supplied via the `DEFAULT_ADMIN_PASSWORD` env var at first startup (⚠️ **dev only** — use a strong value in production). The frontend login is currently broken due to contract mismatch — see [06_Authentication](06_Authentication.md).

---

## 2. Backend

**Q: Where are business rules?**
`StudentCenter.Application/Services/*.cs`. Rules reference: [11_Business_Rules](11_Business_Rules.md).

**Q: Why do I get 400 when a record is not found?**
`ExceptionHandlingMiddleware` maps `KeyNotFoundException` → 400, though the contract specifies 404 (KI-6). See [24_Debugging_Guide](24_Debugging_Guide.md).

**Q: Why 409 for booking?**
Two bookings overlapping for the same facility are rejected as a conflict (`InvalidOperationException` → 409). See [11_Business_Rules](11_Business_Rules.md).

**Q: How are tests run?**
`dotnet test backend/StudentCenter.slnx` → 80/80 pass.

---

## 3. Frontend

**Q: Why does every API call 404?**
The frontend base URL is `/api/v1` but the backend serves `/api` (KI-3). See [03_Frontend_Architecture](03_Frontend_Architecture.md).

**Q: Why can't I log in?**
Frontend sends `identifier`; backend requires `email` (KI-3). Also the `/profile` restore endpoint doesn't exist. See [06_Authentication](06_Authentication.md).

**Q: Why is the page accessible in dev without login?**
`AuthGuard` is bypassed when `NODE_ENV === "development"` (KI-14). Test with a production build.

**Q: Where is auth state?**
`AuthContext.jsx` — token in `localStorage` + cookie `auth_token` (non-HttpOnly). See [06_Authentication](06_Authentication.md).

---

## 4. Database

**Q: What DB does it use?**
PostgreSQL on Supabase (pooler `aws-0-ap-southeast-1.pooler.supabase.com:6543`), via EF Core/Npgsql. See [05_Database_Architecture](05_Database_Architecture.md).

**Q: How do I apply migrations?**
`dotnet ef database update --project backend/StudentCenter.Infrastructure --startup-project backend/StudentCenter.Api`.

**Q: Can I get an ERD?**
Yes — [10_Database_ERD](10_Database_ERD.md) (Mermaid) and `docs/Database/*`.

---

## 5. Security

**Q: Are the committed credentials real?**
Yes — the Supabase password, JWT secret, and an API key are committed (KI-1/KI-2). **Rotate them now.** See [17_Configuration_Guide](17_Configuration_Guide.md).

**Q: Is the default admin safe?**
No — the initial admin is seeded from the `DEFAULT_ADMIN_PASSWORD` env var (KI-4). Use a strong, unique value and change it after first login.

**Q: Is JWT auth secure?**
Basic stateless JWT — acceptable, but token is client-stored and non-HttpOnly (KI-15). No refresh tokens.

---

## 6. Deployment

**Q: Can I deploy right now?**
Not as-is: secrets committed, CI broken (.NET 8 vs net10), frontend/backend contract broken, workflows have no deploy step. Follow [15_Deployment_Guide](15_Deployment_Guide.md) and the release checklist.

**Q: Which env vars do I need?**
`NEXT_PUBLIC_API_BASE_URL` (frontend, build-time) and `ConnectionStrings__DefaultConnection` / `Jwt__SecretKey` / `ASPNETCORE_ENVIRONMENT` (backend). See [18_Environment_Variables](18_Environment_Variables.md).

---

*Cross-references: [24_Debugging_Guide](24_Debugging_Guide.md) · [25_Known_Issues](25_Known_Issues.md) · [30_DEVELOPER_BIBLE](30_DEVELOPER_BIBLE.md)*
