---
tags:
  - entity
  - domain
  - calendar
aliases:
  - Entity - Calendar Event
---

# Entity - Calendar Event

Domain entity representing a scheduled item on the school calendar.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| Title | `string` | Required, max 200 |
| Description | `string?` | Optional, max 2000 |
| StartDate | `DateTime` | Required, UTC |
| EndDate | `DateTime` | Required, UTC |
| Location | `string?` | Optional, max 200 |
| Category | `string` | Required, max 100 |
| IsAllDay | `bool` | Required, default `false` |
| CreatedByUserId | `Guid` | FK → [[Entity - User]] |
| CreatedByUser | `User` | Navigation property |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| UpdatedAt | `DateTime` | Required, default `now()`, UTC |

## Location

`StudentCenter.Domain/Entities/CalendarEvent.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/CalendarEventConfiguration.cs`

## Indexes

- `IX_CalendarEvents_StartDate`
- `IX_CalendarEvents_EndDate`
- `IX_CalendarEvents_Category`
- `IX_CalendarEvents_CreatedByUserId`

## Relationships

- **Many-to-One** with [[Entity - User]] via `CreatedByUserId` (RESTRICT delete)

## Related

- [[Feature - School Calendar]]
- [[Database Schema]]
- [[MOC - Backend]]
- [[Home]]
