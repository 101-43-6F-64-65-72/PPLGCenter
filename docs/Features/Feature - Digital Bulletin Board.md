---
tags:
  - feature
  - backend
  - bulletin-board
aliases:
  - Feature - Digital Bulletin Board
---

# Feature - Digital Bulletin Board

Digital Bulletin Board module for StudentCenter (extended from announcements). Allows students and staff to view a feed of school announcements, react to them, and comment.

---

## Overview

The Digital Bulletin Board extends the basic Announcement feature by allowing social interactions: comments and reactions.

## Entities

- [[Entity - Announcement]] (extended)
- [[Entity - Announcement Comment]]
- [[Entity - Announcement Reaction]]

## Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/announcements/feed` | All authenticated | View bulletin board feed (with reaction counts & latest comments) |
| POST | `/api/announcements/{id}/comments` | All authenticated | Add comment to announcement |
| GET | `/api/announcements/{id}/comments` | All authenticated | List comments for announcement (paginated) |
| DELETE | `/api/comments/{id}` | All authenticated | Delete comment (owner or Admin only) |
| POST | `/api/announcements/{id}/reactions` | All authenticated | React to announcement (one reaction per user per announcement) |
| DELETE | `/api/announcements/{id}/reactions` | All authenticated | Remove reaction |

## Query Parameters

### GET `/api/announcements/feed`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 100) |
| `category` | string | null | Filter by category |

## Authorization Matrix

| Action | Admin | Teacher | Student | OSIS |
|--------|-------|---------|---------|------|
| View feed | Yes | Yes | Yes | Yes |
| Comment | Yes | Yes | Yes | Yes |
| React | Yes | Yes | Yes | Yes |
| Delete own comment | Yes | Yes | Yes | Yes |
| Delete any comment | Yes | No | No | No |
| Create announcement | Yes | No | No | Yes (OSIS) |
| Edit announcement | Yes | No | No | Yes (OSIS) |

## Business Rules

- **Unique Reactions**: A user can only have one active reaction on a given announcement. Adding a new reaction updates/toggles it.
- **Comment Deletion**: Comments can only be deleted by the user who wrote them or by an Admin.
- **Feed optimization**: The feed endpoint returns announcement details along with `ReactionCount`, `CommentCount`, and the `LatestComments` (top 3 newest comments) to avoid N+1 queries.

## Database

- Table: `AnnouncementComments` — Indexes: `AnnouncementId`, `UserId`, `CreatedAt`
- Table: `AnnouncementReactions` — Indexes: `AnnouncementId`, `UserId`, unique(`AnnouncementId`, `UserId`)
- Migration: `AddAnnouncementInteractionEntities`

## Related

- [[Entity - Announcement]]
- [[Entity - Announcement Comment]]
- [[Entity - Announcement Reaction]]
- [[API Contract]]
- [[Database Schema]]
- [[MOC - Features]]
- [[Home]]
