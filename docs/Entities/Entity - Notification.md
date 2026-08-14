---
tags:
  - entity
  - domain
  - notifications
aliases:
  - Entity - Notification
---

# Entity - Notification

Domain entity representing an in-app notification stored in the database.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| UserId | `Guid` | FK → [[Entity - User]] |
| User | `User` | Navigation property |
| Title | `string` | Required, max 200 |
| Message | `string` | Required, max 1000 |
| Type | `NotificationType` | Required, integer enum |
| ReferenceId | `string?` | Optional, max 100 |
| ReferenceType | `string?` | Optional, max 100 |
| IsRead | `bool` | Required, default `false` |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |

## Location

`StudentCenter.Domain/Entities/Notification.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/NotificationConfiguration.cs`

## Indexes

- `IX_Notifications_UserId`
- `IX_Notifications_CreatedAt`
- `IX_Notifications_IsRead`
- `IX_Notifications_Type`

## Relationships

- **Many-to-One** with [[Entity - User]] via `UserId` (RESTRICT delete)

## Related

- [[Feature - Notification]]
- [[Database Schema]]
- [[MOC - Database]]
- [[Home]]
