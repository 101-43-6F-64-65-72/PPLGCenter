---
tags:
  - architecture
  - moc
aliases:
  - MOC - Architecture
---

# MOC - Architecture

Map of Content for architectural knowledge.

## Core

- [[Architecture]]
- [[Clean Architecture]]
- [[Dependency Rules]]
- [[Request Pipeline]]
- [[Tech Stack]]

## Decisions

- [[Decisions]]

## Diagrams

- [[Database ERD]]

## Layers

| Layer | Project | Key Contents |
|-------|---------|-------------|
| Domain | `StudentCenter.Domain` | [[Entity - User]], [[Entity - Announcement]], Enums |
| Application | `StudentCenter.Application` | Service interfaces, DTOs |
| Infrastructure | `StudentCenter.Infrastructure` | Services, DbContext, [[Migrations]] |
| Presentation | `StudentCenter.Api` | Controllers, `ApiResponse<T>` |

## Related MOCs

- [[MOC - Backend]]
- [[MOC - Database]]
- [[Home]]
