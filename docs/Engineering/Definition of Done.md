---
tags:
  - engineering
  - process
aliases:
  - Definition of Done
---

# Definition of Done

Every completed feature in StudentCenter must satisfy **all** items on this checklist before it is considered done.

---

## Checklist

| # | Category | Requirement | Status |
|---|----------|-------------|--------|
| 1 | **Build** | Build succeeds with zero errors | [ ] |
| 2 | **Build** | No new compile warnings introduced | [ ] |
| 3 | **Migration** | Migration reviewed and tested | [ ] |
| 4 | **Security** | Authorization attributes applied to all endpoints | [ ] |
| 5 | **Security** | Role-based access verified | [ ] |
| 6 | **Validation** | Validation attributes applied to all request DTOs | [ ] |
| 7 | **Validation** | Edge cases handled (nulls, empty strings, bounds) | [ ] |
| 8 | **Error Handling** | Exception handling covered (service and controller) | [ ] |
| 9 | **Architecture** | DTOs separated correctly in Application layer | [ ] |
| 10 | **Architecture** | Service interface in Application, implementation in Infrastructure | [ ] |
| 11 | **Architecture** | Services registered in DI (`Program.cs`) | [ ] |
| 12 | **Architecture** | [[Clean Architecture]] dependency rules not violated | [ ] |
| 13 | **API** | [[API Contract]] updated with new/changed endpoints | [ ] |
| 14 | **Documentation** | Feature documentation created/updated | [ ] |
| 15 | **Documentation** | Entity documentation created/updated | [ ] |
| 16 | **Documentation** | [[Daily Log]] updated | [ ] |
| 17 | **Quality** | [[Quality Checklist]] completed | [ ] |

---

## Usage

1. Copy this checklist into the feature's pull request or sprint notes.
2. Mark each item as the work progresses.
3. A feature is **not done** until every box is checked.

---

## Related

- [[Feature Template]]
- [[Quality Checklist]]
- [[Backend Standards]]
- [[Home]]
