---
tags:
  - feature
  - backend
  - facility-booking
aliases:
  - Feature - Facility Booking
---

# Feature - Facility Booking

Facility Booking module for StudentCenter. Allows students, teachers, and OSIS members to reserve school facilities like the auditorium, sports fields, or labs.

---

## Overview

A Facility represents a physical space. A Facility Booking represents a request to reserve a facility for a duration.

## Entities

- [[Entity - Facility]]
- [[Entity - Facility Booking]]

## Endpoints

### Facilities

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/facilities` | All authenticated | List facilities (paginated, active filter) |
| GET | `/api/facilities/{id}` | All authenticated | Get facility details |
| POST | `/api/facilities` | Admin | Create facility |
| PUT | `/api/facilities/{id}` | Admin | Update facility |
| DELETE | `/api/facilities/{id}` | Admin | Delete facility |

### Bookings

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/bookings` | All authenticated | List bookings (paginated, filterable) |
| GET | `/api/bookings/{id}` | All authenticated | Get booking details |
| POST | `/api/bookings` | Student, Teacher, OSIS | Create booking |
| PUT | `/api/bookings/{id}/status` | Admin, Teacher | Approve or reject booking |
| DELETE | `/api/bookings/{id}` | All authenticated | Cancel booking (owner or Admin only) |

## Query Parameters

### GET `/api/facilities`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 100) |
| `isActive` | bool | null | Filter by active status |

### GET `/api/bookings`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 100) |
| `facilityId` | Guid | null | Filter by facility |
| `userId` | Guid | null | Filter by user who booked |
| `status` | BookingStatus | null | Filter by booking status |

## Authorization Matrix

| Action | Admin | Teacher | Student | OSIS |
|--------|-------|---------|---------|------|
| Facility CRUD | Yes | No | No | No |
| Create Booking | No | Yes | Yes | Yes |
| Approve / Reject | Yes | Yes | No | No |
| Cancel Booking | Yes | Own only | Own only | Own only |

## Business Rules

- **No Overlapping Bookings**: Overlapping checks ensure no two approved/pending bookings for the same facility exist at the same time period.
- **Active Facility**: Bookings can only be created for facilities marked `IsActive = true`.
- **Date Range**: Booking `StartTime` must be in the future (greater than current UTC time) and `EndTime` must be greater than `StartTime`.
- **Ownership/Cancellation**: Users can only cancel bookings they created. Admins can cancel any booking.

## Implementation

| Layer | File | Description |
|-------|------|-------------|
| Domain | `Facility.cs` | Entity definition |
| Domain | `FacilityBooking.cs` | Entity definition |
| Domain | `BookingStatus.cs` | Enum definition |
| Application | `CreateFacilityRequest.cs` | Request DTO |
| Application | `UpdateFacilityRequest.cs` | Request DTO |
| Application | `FacilityResponse.cs` | Response DTO |
| Application | `CreateBookingRequest.cs` | Request DTO with dynamic overlapping validation |
| Application | `UpdateBookingStatusRequest.cs` | Request DTO |
| Application | `BookingResponse.cs` | Response DTO |
| Application | `IFacilityService.cs` | Service interface |
| Application | `IBookingService.cs` | Service interface |
| Infrastructure | `FacilityService.cs` | Service implementation |
| Infrastructure | `BookingService.cs` | Service implementation |
| Infrastructure | `FacilityConfiguration.cs` | Fluent API configuration |
| Infrastructure | `FacilityBookingConfiguration.cs` | Fluent API configuration |
| Api | `FacilityController.cs` | Controller |
| Api | `BookingController.cs` | Controller |

## Database

- Table: `Facilities` — Indexes: `Name`, `IsActive`
- Table: `FacilityBookings` — Indexes: `FacilityId`, `BookedByUserId`, `StartTime`, `EndTime`, `Status`
- FK: `FacilityBookings.FacilityId` → `Facilities.Id` (RESTRICT)
- FK: `FacilityBookings.BookedByUserId` → `Users.Id` (RESTRICT)
- FK: `FacilityBookings.ApprovedOrRejectedByUserId` → `Users.Id` (RESTRICT)
- Migration: `AddFacilityBookingEntities`

## Related

- [[Entity - Facility]]
- [[Entity - Facility Booking]]
- [[API Contract]]
- [[Database Schema]]
- [[MOC - Features]]
- [[Home]]
