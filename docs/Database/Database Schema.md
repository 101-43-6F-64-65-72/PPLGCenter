---
tags:
  - database
  - backend
aliases:
  - Database
  - Database Schema
---

# Database Schema

StudentCenter uses **Supabase PostgreSQL** accessed via Entity Framework Core with Npgsql.

## Connection

- **Provider**: Npgsql (PostgreSQL)
- **Host**: `aws-0-ap-southeast-1.pooler.supabase.com`
- **Port**: 6543
- **Database**: postgres
- **ORM**: Entity Framework Core 10.0

## Tables

### Users

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| FullName | varchar(200) | NOT NULL |
| Email | varchar(256) | NOT NULL, UNIQUE |
| PasswordHash | varchar(500) | NOT NULL |
| Role | integer | NOT NULL (enum) |
| IsActive | boolean | NOT NULL, default `true` |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |

**Indexes**: `IX_Users_Email` (unique)

### Announcements

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Title | varchar(200) | NOT NULL |
| Content | text | NOT NULL |
| Category | varchar(100) | NOT NULL |
| CoverImageUrl | varchar(500) | nullable |
| IsPinned | boolean | NOT NULL, default `false` |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |
| CreatedByUserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |

**Indexes**: `IX_Announcements_Category`, `IX_Announcements_CreatedAt`, `IX_Announcements_CreatedByUserId`, `IX_Announcements_IsPinned`

## ERD

See [[Database ERD]] for the visual diagram.

## Configuration

Entity configurations use EF Core Fluent API:

- `UserConfiguration` → [[Entity - User]]
- `AnnouncementConfiguration` → [[Entity - Announcement]]

## Seeding

`SeedAdminData` creates the default admin user on first run. See [[Authentication]].

## Related

- [[Database ERD]]
- [[Migrations]]
- [[Entity - User]]
- [[Entity - Announcement]]
- [[MOC - Database]]
