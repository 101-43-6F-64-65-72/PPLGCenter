---
tags:
  - backend
aliases:
  - Backend Overview
---

# Backend Overview

The StudentCenter backend is an ASP.NET Core Web API built with [[Clean Architecture]].

## Project Structure

```
backend/
├── StudentCenter.Api/
│   ├── Controllers/
│   │   ├── HomeController.cs        (Health check)
│   │   ├── AuthController.cs        (Login, Me)
│   │   └── AnnouncementController.cs (CRUD)
│   ├── Models/Responses/
│   │   └── ApiResponse.cs           (Generic wrapper)
│   ├── Properties/launchSettings.json
│   ├── appsettings.json
│   └── Program.cs                   (DI, middleware, startup)
│
├── StudentCenter.Application/
│   ├── DTOs/                        (Request/Response objects)
│   └── Services/                    (Interface definitions)
│
├── StudentCenter.Domain/
│   ├── Entities/                    (User, Announcement)
│   └── Enums/                       (UserRole)
│
└── StudentCenter.Infrastructure/
    ├── Data/
    │   ├── AppDbContext.cs
    │   ├── Configurations/          (EF Fluent API)
    │   └── Seeders/                 (SeedAdminData)
    ├── Migrations/
    └── Services/                    (Service implementations)
```

## Running the Backend

```bash
cd backend/StudentCenter.Api
dotnet run
```

- **HTTP**: `http://localhost:5051`
- **HTTPS**: `https://localhost:7187`

## Implemented Features

1. [[Authentication]] — JWT login + current user endpoint
2. [[Feature - Announcements]] — Full CRUD with pagination

## Key Files

| File | Purpose |
|------|---------|
| `Program.cs` | DI container setup, middleware pipeline, JWT config |
| `AppDbContext.cs` | EF Core DbContext with Users and Announcements |
| `ApiResponse.cs` | Standard API response wrapper |
| `SeedAdminData.cs` | Seeds default admin user on startup |

## Related

- [[Architecture]]
- [[Clean Architecture]]
- [[Tech Stack]]
- [[Request Pipeline]]
- [[MOC - Backend]]
