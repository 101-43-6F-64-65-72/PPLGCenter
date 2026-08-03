---
tags:
  - engineering
  - ai
  - process
aliases:
  - AI Collaboration
---

# AI Collaboration Guide

Rules and expectations for how OpenCode (or any AI assistant) should operate inside the StudentCenter project.

---

## Core Principles

### 1. Always Inspect Existing Architecture First

Before writing any code, read and understand the current project structure, existing patterns, and conventions. Check neighboring files, existing services, existing controllers, and existing DTOs to ensure consistency.

### 2. Never Duplicate Code

Reuse existing utilities, services, and patterns. If a `PagedResult<T>` already exists, use it. If `ApiResponse<T>` already exists, use it. Never create parallel implementations.

### 3. Never Violate Clean Architecture

Respect the dependency rules at all times:

- Domain depends on nothing.
- Application depends on Domain only.
- Infrastructure depends on Domain and Application.
- Presentation depends on all layers (for DI wiring only).

Never add a reference from an inner layer to an outer layer. See [[Dependency Rules]].

### 4. Always Update Documentation

Every code change must be accompanied by documentation updates:

- [[Daily Log]] entry for the day's work.
- Feature documentation (`Feature - {Name}.md`).
- Entity documentation (`Entity - {Name}.md`).
- [[API Contract]] for new or changed endpoints.
- Relevant MOCs updated with new links.

### 5. Always Run Build

After making changes, run `dotnet build` on the solution to verify zero errors and no new warnings before considering the work complete.

### 6. Always Perform Self-Audit

After completing a feature, walk through the [[Definition of Done]] and [[Quality Checklist]] to verify all requirements are met.

### 7. Never Introduce Unnecessary Abstractions

Do not add repository patterns, mediator patterns, or other abstractions unless explicitly requested. The project uses services directly on `DbContext` (see ADR-008). Keep it simple.

### 8. Prefer Consistency Over Cleverness

Follow the patterns already established in the codebase. If existing services use a certain style of LINQ queries, pagination, or error handling, match that style exactly. Readable and consistent code is always preferred over clever or novel approaches.

---

## Workflow Expectations

1. **Read** — Explore the codebase to understand context before acting.
2. **Plan** — State what you intend to do before doing it.
3. **Implement** — Follow the [[Feature Template]] step by step.
4. **Verify** — Build, audit, and check documentation.
5. **Report** — Summarize what was created, modified, and verified.

---

## What NOT to Do

- Do not create files outside the established folder structure.
- Do not install new NuGet packages without explicit approval.
- Do not modify `appsettings.json` secrets or connection strings.
- Do not skip validation attributes on request DTOs.
- Do not use `DateTime.Now` (use `DateTime.UtcNow`).
- Do not commit without updating the [[Daily Log]].

---

## Related

- [[Feature Template]]
- [[Definition of Done]]
- [[Backend Standards]]
- [[Quality Checklist]]
- [[Prompt Library]]
- [[Home]]
