---
tags:
  - entity
  - domain
  - facility-booking
aliases:
  - Entity - Facility
---

# Entity - Facility

Domain entity representing a physical school facility that can be booked.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| Name | `string` | Required, max 100 |
| Description | `string?` | Optional, max 1000 |
| Location | `string` | Required, max 200 |
| Capacity | `int` | Required |
| IsActive | `bool` | Required, default `true` |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| UpdatedAt | `DateTime` | Required, default `now()`, UTC |

## Location

`StudentCenter.Domain/Entities/Facility.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/FacilityConfiguration.cs`

## Indexes

- `IX_Facilities_Name`
- `IX_Facilities_IsActive`

## Related

- [[Entity - Facility Booking]]
- [[Feature - Facility Booking]]
- [[Database Schema]]
- [[MOC - Database]]
- [[Home]]
