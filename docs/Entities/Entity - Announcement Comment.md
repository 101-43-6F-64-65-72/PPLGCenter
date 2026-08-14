---
tags:
  - entity
  - domain
  - bulletin-board
aliases:
  - Entity - Announcement Comment
---

# Entity - Announcement Comment

Domain entity representing a user's comment on an announcement.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| Content | `string` | Required, max 1000 |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| AnnouncementId | `Guid` | FK → [[Entity - Announcement]] |
| Announcement | `Announcement` | Navigation property |
| UserId | `Guid` | FK → [[Entity - User]] |
| User | `User` | Navigation property |

## Location

`StudentCenter.Domain/Entities/AnnouncementComment.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/AnnouncementCommentConfiguration.cs`

## Indexes

- `IX_AnnouncementComments_AnnouncementId`
- `IX_AnnouncementComments_UserId`
- `IX_AnnouncementComments_CreatedAt`

## Relationships

- **Many-to-One** with [[Entity - Announcement]] via `AnnouncementId` (RESTRICT delete)
- **Many-to-One** with [[Entity - User]] via `UserId` (RESTRICT delete)

## Related

- [[Entity - Announcement]]
- [[Entity - Announcement Reaction]]
- [[Feature - Digital Bulletin Board]]
- [[Database Schema]]
- [[MOC - Backend]]
- [[Home]]
