---
tags:
  - feature
  - authentication
aliases:
  - Feature - Authentication
---

# Feature - Authentication

Authentication module for StudentCenter.

## Status

**Backend**: Implemented | **Frontend**: Not started

## Backend Implementation

- `POST /api/auth/login` — Email + password login, returns JWT
- `GET /api/auth/me` — Returns current user from JWT claims
- Password hashing via `PasswordHasher<User>`
- JWT token generation with role claims

See [[Authentication]] for full flow and diagrams.

## Planned Frontend Pages

| Page | Description |
|------|-------------|
| Login | Email/password form |
| Forgot Password | Password recovery |
| Change Password | Update password (authenticated) |

## Related

- [[Authentication]]
- [[Entity - User]]
- [[User Roles]]
- [[MOC - Features]]
