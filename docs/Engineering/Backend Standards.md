---
tags:
  - engineering
  - backend
  - standards
aliases:
  - Backend Standards
---

# Backend Standards

Project rules and conventions for the StudentCenter backend (.NET 10, [[Clean Architecture]]).

---

## Clean Architecture Dependency Rules

| Layer | Project | May Reference |
|-------|---------|---------------|
| Domain | `StudentCenter.Domain` | Nothing |
| Application | `StudentCenter.Application` | Domain |
| Infrastructure | `StudentCenter.Infrastructure` | Domain, Application |
| Presentation | `StudentCenter.Api` | Domain, Application, Infrastructure (for DI only) |

- Domain must have **zero** NuGet or project references.
- Application defines interfaces; Infrastructure implements them.
- Controllers never reference Infrastructure types directly — only Application interfaces.

---

## Naming Conventions

### Entities

- Singular PascalCase: `User`, `Announcement`, `Material`.
- Located in `StudentCenter.Domain/Entities/`.
- Navigation properties use the related entity name: `public User CreatedByUser { get; set; } = null!;`.

### DTOs

- Request DTOs: `Create{Entity}Request`, `Update{Entity}Request`.
- Response DTOs: `{Entity}Response`.
- Located in `StudentCenter.Application/DTOs/`.
- Always separate — never reuse a request DTO as a response DTO.

### Services

- Interface: `I{Entity}Service` in `StudentCenter.Application/Services/`.
- Implementation: `{Entity}Service` in `StudentCenter.Infrastructure/Services/`.

### Controllers

- Name: `{Entity}Controller` (plural form for resource collections: `UsersController`).
- Located in `StudentCenter.Api/Controllers/`.
- Always decorated with `[ApiController]` and `[Route("api/[controller]")]`.

### Configurations

- Name: `{Entity}Configuration`.
- Located in `StudentCenter.Infrastructure/Data/Configurations/`.
- Implements `IEntityTypeConfiguration<T>`.

---

## Folder Conventions

```
StudentCenter.Domain/
├── Entities/
└── Enums/

StudentCenter.Application/
├── DTOs/
└── Services/          (interfaces only)

StudentCenter.Infrastructure/
├── Data/
│   ├── Configurations/
│   └── Seeders/
├── Migrations/
└── Services/          (implementations)

StudentCenter.Api/
├── Controllers/
├── Middleware/
└── Models/
    └── Responses/     (ApiResponse<T>)
```

---

## Authorization Rules

- All endpoints require `[Authorize]` unless explicitly public.
- Role-based access uses `[Authorize(Roles = "Admin")]` or `[Authorize(Roles = "Admin,Teacher")]`.
- Roles are defined in `UserRole` enum: `Admin`, `Teacher`, `Student`, `OSIS`.
- See [[User Roles]] for the full RBAC matrix.

---

## Validation Rules

- Apply `[Required]`, `[MaxLength]`, `[MinLength]`, `[Range]`, `[EmailAddress]` to request DTOs.
- Never rely solely on database constraints for validation.
- `ExceptionHandlingMiddleware` catches `ValidationException` → 400 Bad Request.
- Pagination parameters must be bounds-checked: `page >= 1`, `1 <= pageSize <= 100`.

---

## Exception Handling Rules

- Never let raw exceptions reach the client.
- `ExceptionHandlingMiddleware` handles all unhandled exceptions → 500.
- Service methods throw `KeyNotFoundException` for not-found → Controller returns 404.
- Service methods throw `UnauthorizedAccessException` for forbidden → Controller returns 403.
- Use structured `ApiResponse<T>` for all error responses.

---

## EF Core Conventions

- Use **Code-First** with Fluent API (not data annotations for schema).
- All entity configurations in separate `{Entity}Configuration.cs` files.
- Use `OnDelete(DeleteBehavior.Restrict)` by default.
- Use `context.Database.MigrateAsync()` in seeders (never `EnsureCreatedAsync`).
- Register configurations via `modelBuilder.ApplyConfigurationsFromAssembly()`.

---

## Async Conventions

- All service methods are `async Task<T>`.
- All EF Core queries use async variants: `ToListAsync()`, `FirstOrDefaultAsync()`, `CountAsync()`.
- All controller actions are `async Task<IActionResult>`.
- Suffix: methods do **not** use the `Async` suffix in interface definitions (project convention).

---

## Pagination Conventions

- Use `PagedResult<T>` from `StudentCenter.Application/DTOs/PagedResult.cs`.
- Query parameters: `page` (default 1), `pageSize` (default 10).
- Bounds: `page = Math.Max(1, page)`, `pageSize = Math.Clamp(pageSize, 1, 100)`.
- Return `TotalCount`, `Page`, `PageSize`, and `Items` in the response.

---

## DateTime Handling

- Store all dates in **UTC**: `DateTime.UtcNow`.
- Database column type: `timestamp with time zone` (PostgreSQL).
- Never use `DateTime.Now` in backend code.

---

## AsNoTracking Usage

- Use `.AsNoTracking()` for all **read-only** queries (GET endpoints).
- Do **not** use `AsNoTracking()` when the entity will be modified and saved.

---

## LINQ Projection Recommendations

- Use `.Select()` projections to map entities to DTOs at the database level.
- Avoid fetching full entities when only a subset of columns is needed.
- Avoid `.Include()` when a projection can replace it.
- Prefer single-query projections over multiple round-trips.

---

## Related

- [[Clean Architecture]]
- [[Dependency Rules]]
- [[Feature Template]]
- [[Quality Checklist]]
- [[Home]]
