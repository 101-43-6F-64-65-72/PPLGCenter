---
tags:
  - entity
  - domain
  - bulletin-board
aliases:
  - Entity - Announcement Reaction
---

# Entity - Announcement Reaction

Domain entity representing a user's reaction (e.g. Like, Love) to an announcement.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| Type | `string` | Required, max 50 (e.g., "Like", "Love", "Haha") |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| AnnouncementId | `Guid` | FK → [[Entity - Announcement]] |
| Announcement | `Announcement` | Navigation property |
| UserId | `Guid` | FK → [[Entity - User]] |
| User | `User` | Navigation property |

## Location

`StudentCenter.Domain/Entities/AnnouncementReaction.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/AnnouncementReactionConfiguration.cs`

## Indexes

- `IX_AnnouncementReactions_AnnouncementId`
- `IX_AnnouncementReactions_UserId`
- `IX_AnnouncementReactions_AnnouncementId_UserId` (unique — one reaction per user per announcement)

## Relationships

- **Many-to-One** with [[Entity - Announcement]] via `AnnouncementId` (RESTRICT delete)
- **Many-to-One** with [[Entity - User]] via `UserId` (RESTRICT delete)

## Related

- [[Entity - Announcement]]
- [[Entity - Announcement Comment]]
- [[Feature - Digital Bulletin Board]]
- [[Database Schema]]
- [[MOC - Backend]]
- [[Home]]
