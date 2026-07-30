---
tags:
  - engineering
  - process
  - template
aliases:
  - Feature Template
---

# Feature Template

Standard implementation workflow for every feature in StudentCenter. Follow these steps in order.

---

## Workflow

```
Planning → Entity → Configuration → Migration → DTOs → Service Interface
    → Service Implementation → Controller → Dependency Injection
    → Validation → Documentation → Build → Quality Audit → Commit
```

---

## Step 1 — Planning

- Define the feature scope and acceptance criteria.
- Identify the entities, endpoints, and roles involved.
- Reference the [[API Contract]] for endpoint design.
- Check [[MOC - Features]] for related/dependent features.

## Step 2 — Entity

- Create the entity class in `StudentCenter.Domain/Entities/`.
- Follow existing entity conventions (see [[Backend Standards]]).
- Include navigation properties where needed.
- Entity must have zero external dependencies (Domain layer rule).

## Step 3 — Configuration

- Create an EF Core Fluent API configuration in `StudentCenter.Infrastructure/Data/Configurations/`.
- Name the file `{Entity}Configuration.cs`.
- Implement `IEntityTypeConfiguration<T>`.
- Define table name, column constraints, indexes, and relationships.
- Set `OnDelete(DeleteBehavior.Restrict)` unless cascading is explicitly justified.

## Step 4 — Migration

- Generate a migration: `dotnet ef migrations add {MigrationName}`.
- Review the generated migration file for correctness.
- Apply the migration: `dotnet ef database update`.
- Document in [[Migrations]].

## Step 5 — DTOs

- Create request and response DTOs in `StudentCenter.Application/DTOs/`.
- Naming: `Create{Entity}Request`, `Update{Entity}Request`, `{Entity}Response`.
- Apply validation attributes (`[Required]`, `[MaxLength]`, etc.) to request DTOs.
- Never expose domain entities directly in API responses.

## Step 6 — Service Interface

- Create `I{Entity}Service.cs` in `StudentCenter.Application/Services/`.
- Define async methods returning `Task<T>`.
- Use `PagedResult<T>` for paginated queries.

## Step 7 — Service Implementation

- Create `{Entity}Service.cs` in `StudentCenter.Infrastructure/Services/`.
- Inject `AppDbContext` via constructor.
- Use `AsNoTracking()` for read-only queries.
- Use LINQ projections to map entities to DTOs at the database level.
- Apply pagination bounds checks (`page >= 1`, `pageSize` between 1 and 100).

## Step 8 — Controller

- Create `{Entity}Controller.cs` in `StudentCenter.Api/Controllers/`.
- Inherit from `ControllerBase`.
- Apply `[ApiController]`, `[Route("api/[controller]")]`.
- Apply `[Authorize]` and `[Authorize(Roles = "...")]` as needed.
- Wrap all responses in `ApiResponse<T>`.
- Use correct HTTP verbs and status codes.

## Step 9 — Dependency Injection

- Register the service in `Program.cs`:
  ```csharp
  builder.Services.AddScoped<I{Entity}Service, {Entity}Service>();
  ```
- Verify lifetime matches dependency chain (Scoped for DbContext consumers).

## Step 10 — Validation

- Verify all request DTOs have validation attributes.
- Verify edge cases: null, empty, negative, out-of-range values.
- Verify `ExceptionHandlingMiddleware` catches `ValidationException`.

## Step 11 — Documentation

- Create `Feature - {Name}.md` in `docs/Features/`.
- Create `Entity - {Name}.md` in `docs/Entities/`.
- Update [[API Contract]] with new endpoints.
- Update [[MOC - Features]], [[MOC - Backend]], and [[Home]].

## Step 12 — Build

- Run `dotnet build` on the solution.
- Verify zero errors and no new warnings.

## Step 13 — Quality Audit

- Complete the [[Quality Checklist]].
- Check [[Definition of Done]].
- Review against [[Backend Standards]].

## Step 14 — Commit

- Update [[Daily Log]] with work completed.
- Stage only intended files.
- Write a concise commit message.

---

## Related

- [[Definition of Done]]
- [[Backend Standards]]
- [[Quality Checklist]]
- [[AI Collaboration]]
- [[Home]]
