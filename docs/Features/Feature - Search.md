---
tags:
  - feature
  - search
  - backend
aliases:
  - Feature - Search
---

# Feature - Search

Centralized global search across StudentCenter with role-based filtering and standardized pagination.

## Status

**Implemented** (Phase 020)

## Overview

Global search endpoint that queries multiple entities (Announcements, Materials, Assignments, Calendar Events, Facilities, Extracurriculars, Proposals) using LINQ-based filtering. Results are grouped by entity type and respect user authorization rules.

## Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/search` | Authenticated | Global search across all entities |

## Query Parameters

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `keyword` | string | - | Yes | Search term for title/description/content |
| `page` | int | 1 | No | Page number for pagination |
| `pageSize` | int | 10 | No | Items per page (min 1, max 100) |

## Response Structure

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Search results retrieved successfully",
  "data": {
    "announcements": [
      {
        "type": "Announcement",
        "id": "guid",
        "title": "string",
        "description": "string (truncated to 100 chars)",
        "metadata": "Category",
        "createdAt": "DateTime"
      }
    ],
    "materials": [...],
    "assignments": [...],
    "calendarEvents": [...],
    "facilities": [...],
    "extracurriculars": [...],
    "proposals": [...],
    "totalCount": "int"
  }
}
```

## Search Matrix

| Entity | Searchable Fields | Authorization | Notes |
|--------|-------------------|---------------|-------|
| Announcements | Title, Content | Public (all users) | Searches across all announcements |
| Materials | Title, Description | Public (all users) | Subject, Grade in metadata |
| Assignments | Title, Description | Public (all users) | Subject, Grade, Due Date in metadata |
| Calendar Events | Title, Description | Public (all users) | Category, Start Date in metadata |
| Facilities | Name, Description | Active only | Capacity in metadata |
| Extracurriculars | Name, Description | Active only | Category, Member count in metadata |
| Proposals | Title, Description | Role-based | OSIS: own only; Admin/Teacher: all |

## Authorization Rules

- **All Users**: Can search Announcements, Materials, Assignments, Calendar Events
- **Active Facilities/Extracurriculars**: Only active entities returned in search
- **Proposals**: 
  - OSIS members: Only their own proposals
  - Admin/Teacher: All proposals
  - Student: Proposals excluded from search

## Pagination

- Default page size: 10
- Maximum page size: 100
- Page numbering: 1-indexed
- Each entity type paginated independently within search

## Performance Optimizations

- `AsNoTracking()` on all queries (read-only)
- IQueryable filtering applied before pagination
- Parallel async searches (Task.WhenAll)
- No N+1 queries
- Projection to DTOs (never exposes entities)

## Feature Filtering (Enhanced Endpoints)

Existing list endpoints enhanced with keyword search and additional filters:

### Announcements
- Endpoint: `GET /api/announcements/search`
- Filters: `keyword`, `isPinned`
- Sorting: Pinned first, then newest

### Assignments
- Endpoint: `GET /api/assignments/search`
- Filters: `keyword`, `subject`, `grade`, `dueBefore`, `dueAfter`
- Sorting: Newest first

### Materials
- Endpoint: `GET /api/materials/search` (future)
- Filters: `keyword`, `subject`, `grade`

### Calendar Events
- Endpoint: `GET /api/calendar/search` (future)
- Filters: `keyword`, `category`, `upcoming`

### Facilities
- Endpoint: `GET /api/facilities/search` (future)
- Filters: `keyword`, `isActive`

### Proposals
- Endpoint: `GET /api/proposals/search` (future)
- Filters: `keyword`, `status`

### Extracurriculars
- Endpoint: `GET /api/extracurriculars/search` (future)
- Filters: `keyword`, `category`, `isActive`

## Pagination Models

### PagedRequest (Input)
```csharp
public class PagedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    
    public void Normalize()
    {
        if (Page < 1) Page = 1;
        if (PageSize < 1) PageSize = 10;
        if (PageSize > 100) PageSize = 100;
    }
}
```

### PagedResult<T> (Output)
```csharp
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
```

## Implementation

| Layer | File | Description |
|-------|------|-------------|
| Application | `PagedRequest.cs` | Input pagination model |
| Application | `SearchResponse.cs` | Global search response DTOs |
| Application | `ISearchService.cs` | Service interface |
| Infrastructure | `SearchService.cs` | Service implementation (parallel queries) |
| Api | `SearchController.cs` | Search endpoint |
| Application | `IAnnouncementService.cs` (enhanced) | Added SearchAsync method |
| Infrastructure | `AnnouncementService.cs` (enhanced) | SearchAsync implementation |
| Application | `IAssignmentService.cs` (enhanced) | Added SearchAsync method |
| Infrastructure | `AssignmentService.cs` (enhanced) | SearchAsync implementation |

## Architecture Decisions

✓ **LINQ-only search**: No Elasticsearch or external engines; EF Core LINQ queries only

✓ **Parallel searches**: Task.WhenAll for concurrent entity searches (better performance)

✓ **Authorization in service**: All authorization logic in SearchService (not controller)

✓ **Grouped results**: Results grouped by entity type (easier frontend consumption)

✓ **Standardized pagination**: Consistent PagedRequest/PagedResult across all endpoints

✓ **Projection DTOs**: All results projected to DTOs; entities never exposed

✓ **No breaking changes**: Existing endpoints unchanged; search is additive

## Related

- [[API Contract]]
- [[Backend Overview]]
- [[Feature - Announcements]]
- [[Feature - Assignment]]
- [[Feature - Materials]]
- [[Feature - School Calendar]]
- [[Feature - Facility Booking]]
- [[Feature - Proposals]]
- [[Feature - Extracurricular]]
- [[MOC - Features]]
