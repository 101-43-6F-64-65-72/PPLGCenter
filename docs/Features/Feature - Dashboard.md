---
tags:
  - feature
  - frontend
  - backend
  - api
aliases:
  - Feature - Dashboard
---

# Feature - Dashboard

Dashboard summary endpoint providing key platform statistics and recent activity.

## Status

**Backend**: Implemented | **Frontend**: Not started

## API Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Required (any role) | Returns platform summary statistics |

## Response Shape

```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "totalUsers": 42,
    "activeUsers": 38,
    "totalAnnouncements": 15,
    "pinnedAnnouncements": 3,
    "latestAnnouncements": [
      {
        "id": "...",
        "title": "...",
        "content": "...",
        "category": "...",
        "coverImageUrl": null,
        "isPinned": false,
        "createdAt": "...",
        "updatedAt": "...",
        "createdByUserId": "...",
        "createdByUserName": "..."
      }
    ]
  }
}
```

## Data Returned

| Field | Type | Description |
|-------|------|-------------|
| TotalUsers | int | Total registered users |
| ActiveUsers | int | Users with `IsActive = true` |
| TotalAnnouncements | int | Total announcements |
| PinnedAnnouncements | int | Announcements with `IsPinned = true` |
| LatestAnnouncements | list | Last 5 announcements by `CreatedAt` desc |

## Implementation Details

- All count queries execute **concurrently** via `Task.WhenAll` for optimal performance
- Uses `AsNoTracking()` for read-only queries (no change tracking overhead)
- Reuses existing `AnnouncementResponse` DTO for latest announcements
- No repository pattern; service queries `AppDbContext` directly

## Planned Frontend Dashboards (per [[Frontend Project Context]])

### Student Dashboard
- Latest announcements
- Upcoming events
- Joined clubs
- [[Feature - Facility Booking|Facility booking]] status
- [[Feature - Proposals|Proposal]] status

### OSIS Dashboard
- [[Feature - Announcements|Announcement]] management
- Event management
- Proposals
- Bookings

### Teacher Dashboard
- Proposal approval
- Booking approval
- Event monitoring

### Admin Dashboard
- User statistics
- Announcement statistics
- Club statistics
- Proposal statistics
- Facility statistics

## Related

- [[API Contract]]
- [[User Roles]]
- [[Feature - Announcements]]
- [[Feature - User Management]]
- [[Frontend Project Context]]
- [[MOC - Features]]
