# 21 — Code Standards

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Language & Runtime](#1-language--runtime)
2. [C# Conventions (Backend)](#2-c-conventions-backend)
3. [JavaScript/React Conventions (Frontend)](#3-javascriptreact-conventions-frontend)
4. [Database/EF Conventions](#4-databaseef-conventions)
5. [API Conventions](#5-api-conventions)
6. [Git Conventions](#6-git-conventions)
7. [Tooling](#7-tooling)

---

## 1. Language & Runtime

| Layer | Standard |
|---|---|
| Backend | C# on `net10.0`, `ImplicitUsings` + `Nullable` enabled |
| Frontend | JavaScript (JSX), ESM modules |
| Tests | C# xUnit |
| Docs | Markdown (Obsidian vault) |

---

## 2. C# Conventions (Backend)

Observed in source (compliance varies — apply these as the target):

- **Naming:** PascalCase types & members; camelCase parameters & locals; `_camelCase` for private fields.
- **File organization:** one entity per file; services in `Application/Services`; DTOs in `Application/DTOs`; EF configs in `Infrastructure/Data/Configurations`.
- **Async:** async/await with `Async` suffix on methods (`GetByEmailAsync`, `CreateAsync`).
- **Nullability:** NRTs enabled — annotate with `?` where nullable; use `ArgumentException` instead of `throw new Exception`.
- **Linq:** `AsNoTracking()` for read queries; paging via `PagedRequest`.
- **Validation:** data annotations on DTOs + service-side business checks throwing typed exceptions.
- **Messages:** user-facing messages in **Indonesian**; identifiers/code in English.
- **No comments requirement** (this project): keep code self-documenting; minimal comments.
- **DI:** constructor injection; register services in `Program.cs`.

### Enforced by default .NET analyzers
- `ImplicitUsings`, `Nullable` → compiler-enforced null-safety.
- Standard .NET code-quality analyzers from SDK (verify `.editorconfig` — none found at root; **Cannot verify from repository**).

---

## 3. JavaScript/React Conventions (Frontend)

Observed in source:

- **Files:** `.js` / `.jsx` (no TypeScript). App Router pages in `src/app/`.
- **Components:** PascalCase file names (`LoginForm.jsx`); hooks `useXxx` (`useAuth`, `useLogin`).
- **State:** TanStack Query for server state; React Context (`AuthContext`) for auth; local state via hooks.
- **Forms:** react-hook-form + zod (`loginSchema.js`).
- **Styling:** Tailwind utility classes; no CSS modules found (verify).
- **API:** centralized service modules; axios with native-fetch fallback.
- **Exports:** named exports for components/hooks/services (verify each file).

---

## 4. Database/EF Conventions

- Code-first EF Core; `IEntityTypeConfiguration` per entity in `Configurations/`.
- PKs: `Guid` with `HasDefaultValueSql("uuid_generate_v4()")`.
- FK delete: `OnDelete(Restrict)`.
- Unique natural keys via `HasIndex(...).IsUnique()`.
- Seed data via dedicated seeder classes (`SeedAdminData`).

---

## 5. API Conventions

- Route template: `api/<feature>` (lowercase plural).
- Response wrapper: `ApiResponse<T>` (`success`, `message`, `data`).
- Paging: `PagedRequest`/`PagedResult<T>`.
- HTTP verbs: GET/POST/PUT/DELETE; PATCH not used by backend (frontend uses PATCH — mismatch).
- Errors: exception → middleware mapping (400/401/409/500).

---

## 6. Git Conventions

History shows mixed English/Indonesian commit messages with conventional-prefix style occasionally (e.g., "fix:", "feat:"). **Target convention (recommended):**

- Imperative mood, lowercase prefix: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
- Reference related docs/issues.
- Commit related changes together; no secrets.

---

## 7. Tooling

| Tool | Usage |
|---|---|
| `dotnet build` / `dotnet test` | backend compile + test |
| `dotnet ef` | migrations |
| npm scripts (`dev`, `build`, `lint`?) | frontend (verify `lint` script exists) |
| VS Code / Rider | IDE (`.vscode`? **Cannot verify from repository**) |

---

*Cross-references: [22_Naming_Convention](22_Naming_Convention.md) · [23_Testing_Guide](23_Testing_Guide.md) · [docs/Engineering/*](../Engineering/)*
