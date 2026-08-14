---
tags:
  - engineering
  - prompts
  - ai
aliases:
  - Prompt Library
---

# Prompt Library

Reusable prompt collection for AI-assisted development in StudentCenter. Each section describes the purpose and expected output of the prompt. Full prompt text will be added as features are implemented.

---

## Create Entity

**Purpose**: Generate a new domain entity following project conventions.

**Expected Output**: Entity class in `StudentCenter.Domain/Entities/` with properties, navigation properties, and enum references.

**Placeholder**: _Prompt to be defined._

---

## Create CRUD Feature

**Purpose**: Generate a complete CRUD feature end-to-end following the [[Feature Template]] workflow.

**Expected Output**: Entity, Configuration, Migration, DTOs, Service Interface, Service Implementation, Controller, DI registration, Documentation.

**Placeholder**: _Prompt to be defined._

---

## Create Dashboard Widget

**Purpose**: Add a new widget or data source to the Dashboard Summary API.

**Expected Output**: Updated `DashboardSummaryResponse`, updated `DashboardService`, and updated [[Feature - Dashboard]] documentation.

**Placeholder**: _Prompt to be defined._

---

## Create Controller

**Purpose**: Generate a new API controller with standard attributes, authorization, and `ApiResponse<T>` wrapping.

**Expected Output**: Controller class in `StudentCenter.Api/Controllers/` with CRUD endpoints.

**Placeholder**: _Prompt to be defined._

---

## Create DTOs

**Purpose**: Generate request and response DTOs for a given entity.

**Expected Output**: `Create{Entity}Request`, `Update{Entity}Request`, `{Entity}Response` in `StudentCenter.Application/DTOs/`.

**Placeholder**: _Prompt to be defined._

---

## Create Service

**Purpose**: Generate a service interface and implementation for a given entity.

**Expected Output**: `I{Entity}Service` in Application, `{Entity}Service` in Infrastructure, with async CRUD methods and pagination.

**Placeholder**: _Prompt to be defined._

---

## Create Migration

**Purpose**: Generate and apply an EF Core migration for schema changes.

**Expected Output**: Migration file in `StudentCenter.Infrastructure/Migrations/`, updated [[Migrations]] documentation.

**Placeholder**: _Prompt to be defined._

---

## Quality Audit

**Purpose**: Perform a comprehensive quality review of recent changes.

**Expected Output**: Updated [[Quality Audit]] report with findings, scores, and remediation actions.

**Placeholder**: _Prompt to be defined._

---

## Documentation Update

**Purpose**: Update all relevant documentation after a feature is completed.

**Expected Output**: Updated [[Home]], MOCs, [[API Contract]], [[Daily Log]], Feature docs, and Entity docs.

**Placeholder**: _Prompt to be defined._

---

## Related

- [[Feature Template]]
- [[AI Collaboration]]
- [[Backend Standards]]
- [[Home]]
