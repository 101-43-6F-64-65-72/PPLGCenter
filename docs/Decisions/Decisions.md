---
tags:
  - decision
aliases:
  - Decisions
  - ADR
---

# Architectural Decisions

This document records key architectural and technical decisions made during StudentCenter development.

## ADR-001: Clean Architecture

**Decision**: Use Clean Architecture with 4 layers (Domain, Application, Infrastructure, Api).

**Rationale**: Separation of concerns, testability, framework independence.

**Status**: Adopted

See [[Clean Architecture]].

## ADR-002: Supabase PostgreSQL

**Decision**: Use Supabase-hosted PostgreSQL as the database.

**Rationale**: Managed PostgreSQL with built-in auth capabilities, easy setup, free tier available for school projects.

**Status**: Adopted

See [[Database Schema]].

## ADR-003: JWT Bearer Authentication

**Decision**: Use JWT tokens for API authentication instead of Supabase Auth.

**Rationale**: Custom authentication logic gives full control over user management and role-based access. The backend owns the auth flow.

**Status**: Adopted

See [[Authentication]].

## ADR-004: EF Core with Code-First Migrations

**Decision**: Use Entity Framework Core with code-first approach and Fluent API configurations.

**Rationale**: Type-safe database access, migration management, strong .NET ecosystem support.

**Status**: Adopted

See [[Migrations]].

## ADR-005: Next.js App Router (Frontend)

**Decision**: Use Next.js 16+ with App Router pattern.

**Rationale**: Server Components by default, improved performance, modern React patterns.

**Status**: Adopted

See [[Frontend Overview]].

## ADR-006: API Contract Freeze (V1)

**Decision**: Freeze the API contract for V1 to enable parallel frontend/backend development.

**Rationale**: Both teams can work independently. Changes require mutual agreement and versioning.

**Status**: Adopted

See [[API Contract]].

## ADR-007: Role-Based Authorization

**Decision**: Use 4 roles (Admin, Teacher, Student, OSIS) with `[Authorize(Roles)]` attributes.

**Rationale**: Simple role-based access control matching the school organizational structure. Teachers who are extracurricular advisors don't get a separate role — the relationship is handled through database relations.

**Status**: Adopted

See [[User Roles]].

## ADR-008: Service Layer (No Repository Pattern)

**Decision**: Use services that directly access `AppDbContext` instead of a separate repository layer.

**Rationale**: Simpler architecture for a school project. EF Core's `DbContext` already implements Unit of Work and Repository patterns.

**Status**: Adopted

## Related

- [[Architecture]]
- [[MOC - Architecture]]
