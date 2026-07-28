---
tags:
  - architecture
  - backend
aliases:
  - Architecture
---

# Architecture

StudentCenter follows [[Clean Architecture]] principles, separating concerns into four distinct layers.

## Solution Structure

```
backend/
├── StudentCenter.Api/            # Presentation Layer
├── StudentCenter.Application/    # Application Layer
├── StudentCenter.Domain/         # Domain Layer
├── StudentCenter.Infrastructure/ # Infrastructure Layer
└── StudentCenter.slnx
```

## Layer Diagram

```mermaid
graph TB
    subgraph Presentation["Api Layer"]
        Controllers
        Middleware
        Responses["ApiResponse&lt;T&gt;"]
    end

    subgraph Application["Application Layer"]
        Interfaces["Service Interfaces"]
        DTOs
    end

    subgraph Domain["Domain Layer"]
        Entities
        Enums
    end

    subgraph Infrastructure["Infrastructure Layer"]
        Services["Service Implementations"]
        DbContext["AppDbContext"]
        Configurations["EF Configurations"]
        Seeders
        Migrations
    end

    Controllers --> Interfaces
    Controllers --> DTOs
    Controllers --> Responses
    Services --> Interfaces
    Services --> DbContext
    Services --> Entities
    DbContext --> Entities
    Configurations --> Entities
    Interfaces --> Entities
    Seeders --> DbContext
```

## Dependency Flow

```mermaid
graph LR
    Api --> Application
    Api --> Domain
    Api --> Infrastructure
    Infrastructure --> Application
    Infrastructure --> Domain
    Application --> Domain
```

- **Domain** has zero dependencies (innermost layer)
- **Application** depends only on Domain
- **Infrastructure** implements Application interfaces using Domain entities
- **Api** wires everything together via DI

## Key Patterns

| Pattern | Implementation |
|---------|---------------|
| Dependency Injection | `Program.cs` registers all services |
| Service Layer | `IUserService`, `IAnnouncementService` in Application, implemented in Infrastructure |
| DTOs | Request/Response objects in `Application/DTOs/` |
| Entity Configuration | Fluent API via `IEntityTypeConfiguration<T>` |
| Seeding | `SeedAdminData` runs on startup |

See [[Dependency Rules]] for the strict dependency constraints between layers.

## Related

- [[Clean Architecture]]
- [[Dependency Rules]]
- [[Backend Overview]]
- [[Request Pipeline]]
- [[Tech Stack]]
- [[MOC - Architecture]]
