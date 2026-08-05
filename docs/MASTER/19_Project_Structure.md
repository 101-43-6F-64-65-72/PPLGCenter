# 19 — Project Structure

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Repository Root](#1-repository-root)
2. [Backend Tree](#2-backend-tree)
3. [Frontend Tree](#3-frontend-tree)
4. [Tests Tree](#4-tests-tree)
5. [Docs Tree](#5-docs-tree)
6. [Notable Root Files](#6-notable-root-files)

---

## 1. Repository Root

```
D:\.SCHOOL\StudentCenter\
├── .claudian/            # agent state (committed)
├── .github/workflows/    # CI/CD
├── .obsidian/            # Obsidian vault settings (committed)
├── backend/
├── docs/
├── frontend/
├── StudentCenter.Tests/
├── AGENTS.md             # empty
├── README.md             # 15 bytes (empty)
├── a.txt / b.txt / c.txt # junk
├── Untitled.base         # junk
├── opencode.jsonc        # ⚠ contains API key
└── package-lock.json     # stray root file
```

---

## 2. Backend Tree

```
backend/
├── StudentCenter.slnx
├── StudentCenter.Api/
│   ├── Controllers/               # 17+ controllers
│   ├── Middleware/
│   │   └── ExceptionHandlingMiddleware.cs
│   ├── Models/Responses/
│   │   └── ApiResponse.cs
│   ├── Program.cs
│   ├── Properties/
│   │   └── launchSettings.json     # :5051 / :7187
│   ├── appsettings.json            # ⚠ secrets
│   └── appsettings.Development.json
├── StudentCenter.Application/
│   ├── DTOs/                       # ~58 DTOs
│   └── Services/                   # 18 service impls (+ interfaces)
├── StudentCenter.Domain/
│   ├── Entities/                   # 15 entities
│   └── Enums/                      # 5 enums
└── StudentCenter.Infrastructure/
    ├── Data/
    │   ├── AppDbContext.cs
    │   ├── Configurations/         # 15 IEntityTypeConfiguration
    │   └── Seeders/
    │       └── SeedAdminData.cs    # Admin from DEFAULT_ADMIN_PASSWORD env var
    ├── Migrations/                 # 12 migrations
    └── Services/                   # Jwt, Permission, CurrentUser + EF services
```

---

## 3. Frontend Tree

```
frontend/
├── middleware.js                   # cookie-presence route guard
├── next.config.mjs
├── package.json
├── docs/                           # planning docs
└── src/
    ├── app/
    │   ├── layout.js               # root layout (lang="id", Geist)
    │   ├── page.js                 # landing
    │   ├── providers.jsx           # QueryClient + Auth providers
    │   ├── login/
    │   ├── profile/
    │   ├── admin/
    │   ├── guru/
    │   ├── osis/
    │   ├── mading/ + mading/[id]/
    │   ├── ekstrakurikuler/
    │   ├── fasilitas/
    │   └── proposal/
    ├── components/                 # ~40 (2× home/ set)
    ├── config/
    │   ├── api.js
    │   └── app.js
    ├── constants/
    │   ├── apiRoutes.js
    │   └── userRoles.js
    ├── contexts/
    │   └── AuthContext.jsx
    ├── features/auth/
    │   ├── LoginForm.jsx
    │   ├── loginSchema.js
    │   └── useLogin.js
    ├── hooks/
    │   └── useAuth.js
    ├── lib/
    │   ├── api.js
    │   ├── queryClient.js
    │   └── ensure-assets.js
    └── services/
        ├── authService.js
        ├── announcementService.js
        ├── clubService.js
        ├── facilityService.js
        ├── profileService.js
        └── proposalService.js
```

---

## 4. Tests Tree

```
StudentCenter.Tests/
├── StudentCenter.Tests.csproj      # xUnit + Moq + FluentAssertions + EF InMemory
├── AnnouncementServiceTests.cs     # 227 lines
├── AssignmentServiceTests.cs       # 303 lines
├── ProposalServiceTests.cs         # 375 lines
├── NotificationServiceTests.cs     # 220 lines
├── SearchServiceTests.cs           # 243 lines
├── MaterialServiceTests.cs         # 398 lines
├── UserServiceTests.cs             # 68 lines
└── BusinessRulesTests.cs           # 113 lines
```

---

## 5. Docs Tree

```
docs/
├── Home.md
├── Architecture/           # Architecture, Tech Stack, ... 
├── API/                    # API Contract.md
├── Backend/                # Backend Overview.md, ...
├── Database/               # schema docs
├── Entities/               # 15 entity docs
├── Features/               # 14 feature docs
├── Engineering/            # patterns/decisions
├── Frontend/               # frontend docs
├── Logs/
│   └── Daily Log.md
├── MASTER/                 # ← this documentation series
└── Project/
    ├── Project Plan.md
    ├── Roadmap.md
    ├── Glossary.md
    ├── MONOREPO_DEPLOYMENT_GUIDE.md
    ├── Quality Audit.md
    └── Full Repository Audit.md
```

---

## 6. Notable Root Files

| File | Status | Note |
|---|---|---|
| `README.md` | empty | needs project description |
| `AGENTS.md` | empty | intended for AI-agent instructions |
| `a.txt`/`b.txt`/`c.txt` | junk | delete |
| `Untitled.base` | junk | delete |
| root `package-lock.json` | stray | unrelated to frontend? (verify) |
| `opencode.jsonc` | ⚠️ | contains 9router API key — rotate/ignore |
| `.obsidian/`, `.claudian/` | committed | consider gitignoring |

---

*Cross-references: [01_Project_Overview](01_Project_Overview.md) · [04_Backend_Architecture](04_Backend_Architecture.md) · [03_Frontend_Architecture](03_Frontend_Architecture.md) · [26_Technical_Debt](26_Technical_Debt.md)*
