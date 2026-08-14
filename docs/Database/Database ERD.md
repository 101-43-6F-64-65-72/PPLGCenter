---
tags:
  - database
  - backend
aliases:
  - Database ERD
  - ERD
---

# Database ERD

Entity Relationship Diagram for the StudentCenter database.

```mermaid
erDiagram
    Users {
        uuid Id PK "gen_random_uuid()"
        varchar FullName "NOT NULL, max 200"
        varchar Email "NOT NULL, UNIQUE, max 256"
        varchar PasswordHash "NOT NULL, max 500"
        integer Role "NOT NULL (enum)"
        boolean IsActive "NOT NULL, default true"
        timestamptz CreatedAt "NOT NULL, default now()"
        timestamptz UpdatedAt "NOT NULL, default now()"
    }

    Announcements {
        uuid Id PK "gen_random_uuid()"
        varchar Title "NOT NULL, max 200"
        text Content "NOT NULL"
        varchar Category "NOT NULL, max 100"
        varchar CoverImageUrl "nullable, max 500"
        boolean IsPinned "NOT NULL, default false"
        timestamptz CreatedAt "NOT NULL, default now()"
        timestamptz UpdatedAt "NOT NULL, default now()"
        uuid CreatedByUserId FK "NOT NULL"
    }

    Users ||--o{ Announcements : "creates"
```

## Current Tables

| Table | Entity | Status |
|-------|--------|--------|
| Users | [[Entity - User]] | Implemented |
| Announcements | [[Entity - Announcement]] | Implemented |

## Planned Tables (based on [[API Contract]])

| Table | Feature | Status |
|-------|---------|--------|
| Events | [[Feature - School Calendar]] | Planned |
| Clubs | [[Feature - Extracurricular]] | Planned |
| ClubMembers | [[Feature - Extracurricular]] | Planned |
| Facilities | [[Feature - Facility Booking]] | Planned |
| Bookings | [[Feature - Facility Booking]] | Planned |
| Proposals | [[Feature - Proposals]] | Planned |
| Elections | Future | Planned |

## Related

- [[Database Schema]]
- [[Migrations]]
- [[MOC - Database]]
