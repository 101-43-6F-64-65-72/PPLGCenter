---
tags:
  - authentication
  - backend
  - api
aliases:
  - Authentication
  - Auth
  - JWT
---

# Authentication

StudentCenter uses JWT Bearer token authentication. The backend issues tokens; the frontend stores and sends them.

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Auth as AuthController
    participant UserSvc as UserService
    participant JWT as JwtService
    participant DB as Database

    Client->>Auth: POST /api/auth/login<br/>{email, password}
    Auth->>UserSvc: LoginAsync(request)
    UserSvc->>DB: Find user by email
    DB-->>UserSvc: User entity
    UserSvc->>UserSvc: Verify password hash
    alt Valid credentials & active
        UserSvc->>JWT: GenerateToken(user)
        JWT-->>UserSvc: JWT string
        UserSvc-->>Auth: LoginResult(Success)
        Auth-->>Client: 200 {token, fullName, email, role}
    else Invalid credentials
        UserSvc-->>Auth: LoginResult(UserNotFound/InvalidPassword)
        Auth-->>Client: 401 Unauthorized
    else Inactive account
        UserSvc-->>Auth: LoginResult(UserInactive)
        Auth-->>Client: 403 Forbidden
    end

    Note over Client: Store token in client

    Client->>Auth: GET /api/auth/me<br/>Authorization: Bearer &lt;token&gt;
    Auth->>Auth: Read claims from JWT
    Auth-->>Client: 200 {id, fullName, email, role}
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login with email + password |
| GET | `/api/auth/me` | Yes | Get current user from JWT claims |

## Login Request

```json
{
  "email": "admin@studentcenter.id",
  "password": "Admin123!"
}
```

## Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "fullName": "Administrator",
    "email": "admin@studentcenter.id",
    "role": "Admin"
  }
}
```

## JWT Claims

| Claim | Source |
|-------|--------|
| `sub` | User.Id |
| `nameid` | User.Id |
| `email` | User.Email |
| `given_name` | User.FullName |
| `role` | User.Role (enum string) |
| `jti` | Random GUID |

## JWT Configuration

Configured in `appsettings.json` under `Jwt` section:

- **Issuer**: `StudentCenter`
- **Audience**: `StudentCenterApp`
- **Expiration**: 60 minutes
- **Algorithm**: HMAC-SHA256

## Password Hashing

Uses `Microsoft.AspNetCore.Identity.PasswordHasher<User>` for secure password hashing and verification.

## Default Admin Seed

On startup, `SeedAdminData` creates an admin user if none exists:

| Field | Value |
|-------|-------|
| Email | `admin@studentcenter.id` |
| Password | `Admin123!` |
| Role | Admin |

## Authorization

Role-based authorization via `[Authorize(Roles = "Admin,OSIS")]` attributes on controllers.

See [[User Roles]] for role definitions.

## Related

- [[API Contract]]
- [[Entity - User]]
- [[User Roles]]
- [[JWT]]
- [[Request Pipeline]]
- [[Feature - Authentication]]
- [[MOC - Backend]]
