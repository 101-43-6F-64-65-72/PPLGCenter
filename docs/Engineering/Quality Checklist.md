---
tags:
  - engineering
  - quality
  - checklist
aliases:
  - Quality Checklist
---

# Quality Checklist

Checklist to be completed for every feature or sprint. Grouped by concern area.

---

## Architecture

- [ ] [[Clean Architecture]] dependency rules respected
- [ ] Entity in Domain layer with zero dependencies
- [ ] DTOs in Application layer, not in Domain or Api
- [ ] Service interface in Application, implementation in Infrastructure
- [ ] Controller in Api layer, injecting only Application interfaces
- [ ] No circular references between projects
- [ ] No unnecessary abstractions introduced

## Security

- [ ] `[Authorize]` applied to all non-public endpoints
- [ ] `[Authorize(Roles = "...")]` applied where role restrictions are needed
- [ ] No secrets or keys hardcoded in new code
- [ ] Input validated before reaching service layer
- [ ] No raw exception details exposed to clients
- [ ] SQL injection safe (EF Core parameterized queries)

## Performance

- [ ] `AsNoTracking()` used for read-only queries
- [ ] LINQ projections used instead of full entity loads where possible
- [ ] Pagination bounds enforced (`page >= 1`, `1 <= pageSize <= 100`)
- [ ] No N+1 query patterns
- [ ] Database indexes defined for filtered/sorted columns
- [ ] Async/await used throughout (no blocking `.Result` or `.Wait()`)

## Maintainability

- [ ] Naming conventions followed (see [[Backend Standards]])
- [ ] Code is consistent with existing codebase style
- [ ] No code duplication — existing utilities reused
- [ ] EF Core Fluent API configuration in separate file
- [ ] Service registered in DI with correct lifetime
- [ ] `ApiResponse<T>` wrapper used for all responses

## Documentation

- [ ] Feature documentation created/updated
- [ ] Entity documentation created/updated
- [ ] [[API Contract]] updated with new/changed endpoints
- [ ] [[Daily Log]] updated
- [ ] Relevant MOCs updated
- [ ] [[Home]] updated if new section added

## Production Readiness

- [ ] Build succeeds with zero errors
- [ ] No new compile warnings introduced
- [ ] Migration reviewed and tested
- [ ] Error responses return structured JSON (not stack traces)
- [ ] All `DateTime` values stored in UTC
- [ ] Delete behavior set to `Restrict` (or explicitly justified)
- [ ] [[Definition of Done]] fully satisfied

---

## Related

- [[Definition of Done]]
- [[Feature Template]]
- [[Backend Standards]]
- [[Quality Audit]]
- [[Home]]
