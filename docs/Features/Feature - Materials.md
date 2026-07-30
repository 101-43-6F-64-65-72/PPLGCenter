---
tags:
  - feature
  - backend
  - materials
aliases:
  - Feature - Materials
---

# Feature - Materials

Material Management module for StudentCenter. Allows teachers to upload and manage learning materials for students.

---

## Overview

A Material represents learning content uploaded by teachers, organized by subject and grade.

## Entity

See [[Entity - Material]].

## Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/materials` | All authenticated | List materials (paginated, filterable) |
| GET | `/api/materials/{id}` | All authenticated | Get material by ID |
| POST | `/api/materials` | Admin, Teacher | Create material |
| PUT | `/api/materials/{id}` | Admin, Teacher (own) | Update material |
| DELETE | `/api/materials/{id}` | Admin, Teacher (own) | Delete material |

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 100) |
| `subject` | string | null | Filter by subject |
| `grade` | string | null | Filter by grade |

## Authorization Matrix

| Action | Admin | Teacher | Student | OSIS |
|--------|-------|---------|---------|------|
| List materials | Yes | Yes | Yes | Yes |
| View material | Yes | Yes | Yes | Yes |
| Create material | Yes | Yes | No | No |
| Update material | Yes | Own only | No | No |
| Delete material | Yes | Own only | No | No |

## Ownership Rules

- Teachers can only update and delete materials they uploaded (`UploadedByUserId` must match).
- Admin bypasses ownership checks and has full access.
- Students have read-only access.

## Implementation

| Layer | File | Description |
|-------|------|-------------|
| Domain | `Material.cs` | Entity with Title, Description, FileUrl, Subject, Grade |
| Application | `CreateMaterialRequest.cs` | Request DTO with validation |
| Application | `UpdateMaterialRequest.cs` | Request DTO with validation |
| Application | `MaterialResponse.cs` | Response DTO |
| Application | `IMaterialService.cs` | Service interface |
| Infrastructure | `MaterialService.cs` | Service implementation |
| Infrastructure | `MaterialConfiguration.cs` | EF Core Fluent API configuration |
| Api | `MaterialsController.cs` | REST controller |

## Database

- Table: `Materials`
- Indexes: `UploadedAt`, `Subject`, `Grade`, `UploadedByUserId`
- FK: `UploadedByUserId` → `Users.Id` (RESTRICT)
- Migration: `AddMaterialEntity`

## Related

- [[Entity - Material]]
- [[API Contract]]
- [[Database Schema]]
- [[MOC - Features]]
- [[Home]]
