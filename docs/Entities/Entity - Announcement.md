---
tags:
  - entity
  - backend
  - database
  - announcement
aliases:
  - Entity - Announcement
  - Announcement Entity
---

# Entity - Announcement

The `Announcement` entity represents school announcements on the digital bulletin board.

## Definition

**Project**: `StudentCenter.Domain/Entities/Announcement.cs`

| Property | Type | Description |
|----------|------|-------------|
| Id | `Guid` | Primary key (auto-generated UUID) |
| Title | `string` | Announcement title (max 200) |
| Content | `string` | Full content (text, unlimited) |
| Category | `string` | Category label (max 100) |
| CoverImageUrl | `string?` | Optional cover image URL (max 500) |
| IsPinned | `bool` | Whether pinned to top (default: false) |
| CreatedAt | `DateTime` | Creation timestamp |
| UpdatedAt | `DateTime` | Last update timestamp |
| CreatedByUserId | `Guid` | FK to [[Entity - User]] |
| CreatedByUser | `User` | Navigation property |

## Database Configuration

Configured in `AnnouncementConfiguration.cs` (Fluent API):

- Table: `Announcements`
- `Id` default: `gen_random_uuid()`
- FK to `Users` with `OnDelete(Restrict)`
- Indexes: Category, IsPinned, CreatedAt, CreatedByUserId

## DTOs

| DTO | Usage |
|-----|-------|
| `CreateAnnouncementRequest` | Create input |
| `UpdateAnnouncementRequest` | Update input |
| `AnnouncementResponse` | Response (includes author name) |

## Related

- [[Feature - Announcements]]
- [[Entity - User]]
- [[Database Schema]]
- [[MOC - Backend]]
