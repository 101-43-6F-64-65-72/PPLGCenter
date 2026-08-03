---
tags:
  - database
  - backend
aliases:
  - Migrations
---

# Migrations

EF Core migrations for the StudentCenter database.

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `InitialCreate` | 2026-07-27 | Creates `Users` table with unique email index |
| `AddAnnouncementEntity` | 2026-07-27 | Creates `Announcements` table with FK to Users, indexes on Category/IsPinned/CreatedAt |

## Running Migrations

```bash
cd backend
dotnet ef migrations add <MigrationName> --project StudentCenter.Infrastructure --startup-project StudentCenter.Api
dotnet ef database update --project StudentCenter.Infrastructure --startup-project StudentCenter.Api
```

## Notes

- Migrations live in `StudentCenter.Infrastructure/Migrations/`
- Database is also seeded via `SeedAdminData` on startup (see [[Authentication]])
- Uses `gen_random_uuid()` for PostgreSQL UUID generation
- All timestamps use `timestamptz` with `now()` defaults

## Related

- [[Database Schema]]
- [[Database ERD]]
- [[MOC - Database]]
