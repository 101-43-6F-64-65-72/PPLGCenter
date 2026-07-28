---
tags:
  - feature
aliases:
  - Feature - Facility Booking
---

# Feature - Facility Booking

Room and facility booking with approval workflow.

## Status

**Not started** (planned per [[API Contract]])

## Planned Features

- Facility list
- Booking form
- Booking history
- Approval status tracking
- Schedule conflict detection (HTTP 422)

## Planned Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/facilities` | List facilities |
| POST | `/api/v1/bookings` | Create booking |
| GET | `/api/v1/bookings` | List bookings |

## Related

- [[User Roles]]
- [[API Contract]]
- [[Frontend Project Context]]
- [[Roadmap]]
- [[MOC - Features]]
