# StudentCenter — System Architecture

## Overview

StudentCenter is a school activity management platform for SMK Negeri 2 Surakarta. It follows a **clean architecture** pattern separating domain, application, infrastructure, and API concerns on the backend, with a Next.js App Router frontend.

---

## Architecture Layers

```
┌────────────────────────────────────────────────────┐
│                  Nginx Reverse Proxy               │
│          (SSL Termination, HTTP→HTTPS Redirect)     │
└───────────────┬───────────────────┬────────────────┘
                │                   │
    ┌───────────▼──────┐   ┌────────▼────────┐
    │  Next.js Frontend│   │  ASP.NET Core   │
    │  (App Router, 16)│   │  Web API (v10)  │
    │  Port 3000       │   │  Port 5051      │
    └──────────────────┘   └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │  PostgreSQL 16  │
                           │  (EF Core 10)   │
                           └─────────────────┘
```

## Backend Projects

| Project | Role |
|---|---|
| `StudentCenter.Api` | ASP.NET Core Web API, controllers, middleware, startup |
| `StudentCenter.Application` | Use cases, DTOs, service interfaces |
| `StudentCenter.Domain` | Entities, value objects, domain rules |
| `StudentCenter.Infrastructure` | EF Core DbContext, repositories, external services |

## Frontend Structure

| Path | Purpose |
|---|---|
| `src/app/` | Next.js App Router pages |
| `src/components/` | Shared UI components |
| `src/features/` | Feature-scoped components, hooks, services |
| `src/contexts/` | React Context providers (Auth, etc.) |
| `src/services/` | API client functions |
| `e2e/` | Playwright end-to-end tests |

## Authentication Flow

```
Client → POST /api/auth/login → JWT (HS256, 60min expiry)
JWT stored in: localStorage + HttpOnly Cookie
Refresh: token re-read on page reload via AuthContext
```

## Role Hierarchy

```
Admin (Super Admin) → Guru (Teacher) → OSIS → Siswa (Student)
```
