# 30 — DEVELOPER BIBLE

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> One-stop reference. Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Quick Facts](#1-quick-facts)
2. [Daily Commands](#2-daily-commands)
3. [Architecture in 60 Seconds](#3-architecture-in-60-seconds)
4. [Adding a Feature (Checklist)](#4-adding-a-feature-checklist)
5. [Adding an Endpoint](#5-adding-an-endpoint)
6. [Adding a Table](#6-adding-a-table)
7. [Adding a Frontend Page](#7-adding-a-frontend-page)
8. [Common Error → Fix Table](#8-common-error--fix-table)
9. [The 5 Things That Will Bite You](#9-the-5-things-that-will-bite-you)
10. [Where Everything Lives](#10-where-everything-lives)
11. [Cross-Reference Index](#11-cross-reference-index)

---

## 1. Quick Facts

| Fact | Value |
|---|---|
| Stack | .NET 10 API + Next.js 16 + PostgreSQL (Supabase) |
| Solution | `backend/StudentCenter.slnx` |
| Backend port | 5051 (HTTP) / 7187 (HTTPS) |
| Frontend port | 3000 (dev) |
| Tests | 80/80 ✅ |
| Entities / migrations / enums | 15 / 12 / 5 |
| Controllers / endpoints | 17+ / ~75 |
| Services | 18 |
| JWT | HS256, 60 min, issuer `StudentCenter` |
| Default admin | `admin@studentcenter.id` — password from `DEFAULT_ADMIN_PASSWORD` env var |
| Backend base path | `/api` (⚠️ frontend expects `/api/v1`) |

---

## 2. Daily Commands

```bash
# Backend
dotnet restore backend/StudentCenter.slnx
dotnet build backend/StudentCenter.slnx
dotnet test backend/StudentCenter.slnx
dotnet run --project backend/StudentCenter.Api

# Migrations
dotnet ef migrations add <Name> --project backend/StudentCenter.Infrastructure --startup-project backend/StudentCenter.Api
dotnet ef database update --project backend/StudentCenter.Infrastructure --startup-project backend/StudentCenter.Api

# Frontend
cd frontend
npm install
npm run dev
npm run build
```

---

## 3. Architecture in 60 Seconds

```
Browser → Next.js pages → services (axios) → REST /api/* → Controller
       → Application Service (rules) → AppDbContext (EF) → PostgreSQL
Errors: Controller throws → ExceptionHandlingMiddleware → 400/401/409/500
```

- **Domain**: entities + enums (no deps)
- **Application**: DTOs + service rules
- **Infrastructure**: EF, configs, seeders, migrations, JWT/current-user
- **Api**: controllers, middleware, Program.cs
- **Tests**: xUnit + Moq + FluentAssertions + EF InMemory

---

## 4. Adding a Feature (Checklist)

1. **Domain**: add entity (+ enum if needed).
2. **Application**: DTO request/response + service interface + implementation (inject `AppDbContext`, throw typed exceptions).
3. **Infrastructure**: `Configurations/<Entity>Configuration.cs`, register in `AppDbContext`, add migration.
4. **Api**: `Controllers/<Feature>Controller.cs` with `[Authorize(Roles=...)]`; register service in `Program.cs`.
5. **Tests**: `<Feature>ServiceTests.cs`.
6. **Frontend**: route folder + `page.js`, service module, constants, form (RHF+zod).
7. **Docs**: update this MASTER series (API catalog, ERD, rules).

---

## 5. Adding an Endpoint

```csharp
[HttpGet("mine")]
[Authorize]
public async Task<IActionResult> GetMine()
{
    var result = await _service.GetMineAsync(_currentUser.GetUserId());
    return Ok(ApiResponse<...>.Success(result));
}
```

Remember: return `ApiResponse<T>`; let exceptions map status codes; use `PagedRequest` for lists.

---

## 6. Adding a Table

1. Entity in `Domain/Entities`.
2. `IEntityTypeConfiguration` in `Infrastructure/Data/Configurations` (Guid PK, `Restrict` deletes, unique indexes).
3. `DbSet` in `AppDbContext` + apply configuration.
4. `dotnet ef migrations add ...` + `database update`.

---

## 7. Adding a Frontend Page

1. `src/app/<route>/page.js` (App Router).
2. Add route to `middleware.js` protection if needed.
3. Add endpoint to `src/constants/apiRoutes.js`.
4. Add/use a service in `src/services/`.
5. Add components under `src/components/<feature>/`.
6. Ensure base URL matches backend (`config/api.js`).

---

## 8. Common Error → Fix Table

| Error | Fix |
|---|---|
| `401` everywhere | token missing/expired → re-login |
| `404` on `/api/v1/...` | base path mismatch → use `/api` |
| login fails | send `email`, not `identifier` |
| `409` booking | time overlap → pick another slot |
| `400` not-found | middleware maps to 400; expect 400 or fix mapping |
| `NU1903` | update `Microsoft.AspNetCore.OpenApi` |
| CI backend fails | workflow .NET 8.0.x → 10.0.x |
| Stale query cache | tune `staleTime` in `queryClient.js` |

---

## 9. The 5 Things That Will Bite You

1. **Secrets are in git** (`appsettings.json`, `opencode.jsonc`) — rotate now.
2. **Frontend ↔ backend contract mismatch** — `/api/v1` vs `/api`, `identifier` vs `email`, missing `/profile`/`/clubs`/`/slots`, PATCH vs PUT, multipart vs JSON.
3. **`KeyNotFoundException` → 400** (contract wants 404); business errors → 409 (contract wants 422).
4. **Default admin** auto-seeded from `DEFAULT_ADMIN_PASSWORD` env var (was hardcoded `Admin123!`).
5. **CI is broken** (.NET 8 vs net10) and has **no deploy step**.

---

## 10. Where Everything Lives

| Need | Location |
|---|---|
| Controllers | `backend/StudentCenter.Api/Controllers/` |
| Services + rules | `backend/StudentCenter.Application/Services/` |
| DTOs | `backend/StudentCenter.Application/DTOs/` |
| Entities | `backend/StudentCenter.Domain/Entities/` |
| Enums | `backend/StudentCenter.Domain/Enums/` |
| EF + migrations | `backend/StudentCenter.Infrastructure/Data` (+ `Migrations/`) |
| Seed data | `backend/StudentCenter.Infrastructure/Data/Seeders/` |
| Middleware | `backend/StudentCenter.Api/Middleware/` |
| Config | `backend/StudentCenter.Api/appsettings*.json` |
| Tests | `StudentCenter.Tests/` |
| Frontend pages | `frontend/src/app/` |
| Frontend services | `frontend/src/services/` |
| Auth context | `frontend/src/contexts/AuthContext.jsx` |
| CI/CD | `.github/workflows/` |
| Docs | `docs/` (knowledge base) + `docs/MASTER/` (this series) |

---

## 11. Cross-Reference Index

| Topic | Doc |
|---|---|
| Overview | [01_Project_Overview](01_Project_Overview.md) |
| System / request flow | [02_System_Architecture](02_System_Architecture.md) |
| Frontend | [03_Frontend_Architecture](03_Frontend_Architecture.md) |
| Backend | [04_Backend_Architecture](04_Backend_Architecture.md) |
| Database | [05_Database_Architecture](05_Database_Architecture.md) |
| Auth | [06_Authentication](06_Authentication.md) |
| Roles | [07_Authorization](07_Authorization.md) |
| Endpoints | [08_API_Catalog](08_API_Catalog.md) |
| Entities | [09_Entity_Catalog](09_Entity_Catalog.md) |
| ERD | [10_Database_ERD](10_Database_ERD.md) |
| Rules | [11_Business_Rules](11_Business_Rules.md) |
| Flows | [12_Feature_Flow](12_Feature_Flow.md) |
| Request/response | [13_Request_Response_Flow](13_Request_Response_Flow.md) |
| Sequence diagrams | [14_Sequence_Diagrams](14_Sequence_Diagrams.md) |
| Deployment | [15_Deployment_Guide](15_Deployment_Guide.md) |
| CI/CD | [16_CICD_Guide](16_CICD_Guide.md) |
| Configuration | [17_Configuration_Guide](17_Configuration_Guide.md) |
| Env vars | [18_Environment_Variables](18_Environment_Variables.md) |
| Structure | [19_Project_Structure](19_Project_Structure.md) |
| Dependencies | [20_Dependency_Graph](20_Dependency_Graph.md) |
| Standards | [21_Code_Standards](21_Code_Standards.md) |
| Naming | [22_Naming_Convention](22_Naming_Convention.md) |
| Testing | [23_Testing_Guide](23_Testing_Guide.md) |
| Debugging | [24_Debugging_Guide](24_Debugging_Guide.md) |
| Known issues | [25_Known_Issues](25_Known_Issues.md) |
| Technical debt | [26_Technical_Debt](26_Technical_Debt.md) |
| Roadmap | [27_Roadmap](27_Roadmap.md) |
| Glossary | [28_Project_Glossary](28_Project_Glossary.md) |
| FAQ | [29_FAQ](29_FAQ.md) |
| **You are here** | **30_DEVELOPER_BIBLE** |

---

*Cross-references: all MASTER docs (see index above) · [docs/Home.md](../Home.md) · [docs/Project/Full Repository Audit.md](../Project/Full%20Repository%20Audit.md)*
