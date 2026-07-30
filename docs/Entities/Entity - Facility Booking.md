---
tags:
  - entity
  - domain
  - facility-booking
aliases:
  - Entity - Facility Booking
---

# Entity - Facility Booking

Domain entity representing a user's reservation of a facility.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| FacilityId | `Guid` | FK → [[Entity - Facility]] |
| Facility | `Facility` | Navigation property |
| BookedByUserId | `Guid` | FK → [[Entity - User]] |
| BookedByUser | `User` | Navigation property |
| Purpose | `string` | Required, max 500 |
| StartTime | `DateTime` | Required, UTC |
| EndTime | `DateTime` | Required, UTC |
| Status | `BookingStatus` | Required, integer enum |
| RejectionReason | `string?` | Optional, max 500 |
| ApprovedOrRejectedByUserId | `Guid?` | FK → [[Entity - User]], nullable |
| ApprovedOrRejectedByUser | `User?` | Navigation property |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| UpdatedAt | `DateTime` | Required, default `now()`, UTC |

## Location

`StudentCenter.Domain/Entities/FacilityBooking.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/FacilityBookingConfiguration.cs`

## Indexes

- `IX_FacilityBookings_FacilityId`
- `IX_FacilityBookings_BookedByUserId`
- `IX_FacilityBookings_StartTime`
- `IX_FacilityBookings_EndTime`
- `IX_FacilityBookings_Status`

## Relationships

- **Many-to-One** with [[Entity - Facility]] via `FacilityId` (RESTRICT delete)
- **Many-to-One** with [[Entity - User]] via `BookedByUserId` (RESTRICT delete)
- **Many-to-One** with [[Entity - User]] via `ApprovedOrRejectedByUserId` (RESTRICT delete)

## Related

- [[Entity - Facility]]
- [[Feature - Facility Booking]]
- [[Database Schema]]
- [[MOC - Database]]
- [[Home]]
