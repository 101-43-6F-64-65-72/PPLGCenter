---
tags:
  - feature
  - backend
  - notifications
aliases:
  - Feature - Notification
---

# Feature - Notification

Centralized in-app notification module for StudentCenter. Allows other features to notify users of events like new assignments, calendar events, grades, or system messages.

---

## Overview

A Notification represents an in-app message saved in the database for a specific user.

## Entity

See [[Entity - Notification]].

## Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | All authenticated | Get notifications for current user (paginated, newest first) |
| GET | `/api/notifications/unread-count` | All authenticated | Get number of unread notifications |
| PATCH | `/api/notifications/{id}/read` | All authenticated | Mark specific notification as read |
| PATCH | `/api/notifications/read-all` | All authenticated | Mark all notifications for current user as read |

## Query Parameters

### GET `/api/notifications`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 100) |

## Authorization and Security

- **Strict Ownership**: Users can only view, count, and mark as read **their own** notifications.
- **Service Layer Validation**: Ownership is enforced in the service layer (`MarkAsReadAsync` throws `UnauthorizedAccessException` if the notification does not belong to the user).
- **No Shared Read**: Notification is user-specific; mark-all-read only updates notifications for the current authenticated user.

## Future Integration Guide

Other modules can trigger notifications by injecting `INotificationService` and calling:

```csharp
// Notify a single user
await _notificationService.NotifyUserAsync(
    userId, 
    "New Grade Posted", 
    "Your submission for Math Assignment 1 has been graded.", 
    NotificationType.Grade, 
    submissionId.ToString(), 
    "Submission"
);

// Notify multiple users (e.g. all students in a class)
await _notificationService.NotifyUsersAsync(
    studentIds, 
    "New Assignment", 
    "A new assignment for Chemistry is available.", 
    NotificationType.Assignment, 
    assignmentId.ToString(), 
    "Assignment"
);
```

### Notification Types

- `Assignment` (0)
- `Announcement` (1)
- `Calendar` (2)
- `Proposal` (3)
- `Booking` (4)
- `Grade` (5)
- `System` (6)
- `Other` (7)

## Implementation

| Layer | File | Description |
|-------|------|-------------|
| Domain | `Notification.cs` | Entity definition |
| Domain | `NotificationType.cs` | Enum definition |
| Application | `CreateNotificationRequest.cs` | DTO for backend-triggered notifications |
| Application | `MarkNotificationReadRequest.cs` | DTO for marking read status |
| Application | `NotificationResponse.cs` | DTO for API responses |
| Application | `INotificationService.cs` | Service interface |
| Infrastructure | `NotificationService.cs` | Service implementation with bulk/bulk-read support |
| Infrastructure | `NotificationConfiguration.cs` | EF Core Fluent API configuration |
| Api | `NotificationController.cs` | Controller with authenticated endpoints |

## Database

- Table: `Notifications`
- Indexes: `UserId`, `CreatedAt`, `IsRead`, `Type`
- FK: `UserId` → `Users.Id` (RESTRICT)
- Migration: `AddNotificationEntity`

## Related

- [[Entity - Notification]]
- [[API Contract]]
- [[Database Schema]]
- [[MOC - Features]]
- [[Home]]
