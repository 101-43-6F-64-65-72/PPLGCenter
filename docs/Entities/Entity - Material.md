---
tags:
  - entity
  - domain
  - materials
aliases:
  - Entity - Material
---

# Entity - Material

Domain entity representing learning content uploaded by teachers.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| Title | `string` | Required, max 200 |
| Description | `string?` | Optional, max 1000 |
| FileUrl | `string` | Required, max 500 |
| Subject | `string` | Required, max 100 |
| Grade | `string` | Required, max 50 |
| UploadedAt | `DateTime` | Required, default `now()`, UTC |
| UpdatedAt | `DateTime` | Required, default `now()`, UTC |
| UploadedByUserId | `Guid` | FK → [[Entity - User]] |
| UploadedByUser | `User` | Navigation property |

## Location

`StudentCenter.Domain/Entities/Material.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/MaterialConfiguration.cs`

## Indexes

- `IX_Materials_UploadedAt`
- `IX_Materials_Subject`
- `IX_Materials_Grade`
- `IX_Materials_UploadedByUserId`

## Relationships

- **Many-to-One** with [[Entity - User]] via `UploadedByUserId` (RESTRICT delete)

## Related

- [[Feature - Materials]]
- [[Database Schema]]
- [[MOC - Backend]]
- [[Home]]
