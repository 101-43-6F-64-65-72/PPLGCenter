# 23 — Testing Guide

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Test Stack](#1-test-stack)
2. [Running Tests](#2-running-tests)
3. [Test Inventory](#3-test-inventory)
4. [Test Patterns Used](#4-test-patterns-used)
5. [How to Add a New Test](#5-how-to-add-a-new-test)
6. [Coverage Gaps](#6-coverage-gaps)
7. [Quality Gates](#7-quality-gates)

---

## 1. Test Stack

`StudentCenter.Tests` uses:

| Tool | Purpose |
|---|---|
| xUnit 2.9.3 | test framework |
| Moq 4.20.72 | mocking services |
| FluentAssertions 8.10.0 | assertions |
| EF InMemory 10.0.10 | in-memory DbContext for service tests |
| coverlet.collector 6.0.4 | coverage collection |

Project references: `Application`, `Domain`, `Infrastructure`.

---

## 2. Running Tests

```bash
# from repo root
dotnet test backend/StudentCenter.slnx
# with coverage
dotnet test backend/StudentCenter.slnx --collect:"XPlat Code Coverage"
```

**Result (verified):** 80/80 tests PASS. No flaky tests observed.

---

## 3. Test Inventory

| File | Lines | Focus |
|---|---|---|
| `AnnouncementServiceTests.cs` | 227 | mading CRUD, comments, reactions |
| `AssignmentServiceTests.cs` | 303 | assignments, submissions |
| `ProposalServiceTests.cs` | 375 | proposal create/review rules |
| `NotificationServiceTests.cs` | 220 | notification create/read |
| `SearchServiceTests.cs` | 243 | search behavior |
| `MaterialServiceTests.cs` | 398 | material list/filters |
| `UserServiceTests.cs` | 68 | user creation/auth helpers |
| `BusinessRulesTests.cs` | 113 | cross-cutting business rules |

---

## 4. Test Patterns Used

Observed pattern (e.g., `ProposalServiceTests`):

1. Build an **InMemory `AppDbContext`**.
2. **Seed** minimal data.
3. Call the service method under test.
4. **Assert** with FluentAssertions (state changes, thrown exceptions).

```csharp
// illustrative pattern
[Fact]
public async Task CreateProposal_ShouldCreate_WhenValid()
{
    var db = CreateInMemoryDb();
    var service = new ProposalService(db, ...);
    var request = new CreateProposalRequest { Title = "Kegiatan OSIS", Description = "...", FileUrl = "..." };

    var result = await service.CreateAsync(request, user);

    result.Id.Should().NotBeEmpty();
}
```

---

## 5. How to Add a New Test

1. Create `StudentCenter.Tests/<Service>Tests.cs`.
2. Add a helper to build an InMemory `AppDbContext` (mirror existing tests).
3. Mock dependencies with Moq (`Mock<INotificationService>` etc.).
4. Use `[Fact]` for single scenario, `[Theory]`/`[InlineData]` for parameterized.
5. Run: `dotnet test backend/StudentCenter.slnx`.

**Coverage commands:**

```bash
dotnet test backend/StudentCenter.slnx --collect:"XPlat Code Coverage"
# open coverlet report to view % (verify tooling availability)
```

---

## 6. Coverage Gaps

Services **without** dedicated tests (verified via test inventory):

- `AnnouncementCommentService`
- `AnnouncementReactionService`
- `AttendanceService`
- `CalendarService`
- `DashboardService`
- `ExtracurricularService`
- `FacilityService`
- `FacilityBookingService`
- `JwtService`
- `SubmissionService`
- All controllers
- Frontend (no JS test framework configured)

**Suggested priorities (next testing sprints):**

1. `FacilityBookingService` — conflict-check logic is critical.
2. `SubmissionService` — past-due & duplicate rules.
3. `JwtService` — token generation/expiry/claims.
4. `AttendanceService` — unique-per-day rule.
5. `ExtracurricularService` — join/leave/ownership.

---

## 7. Quality Gates

- ✅ 80/80 tests green (Phase 021C.1).
- ✅ Build clean.
- ❌ No CI test step (see [16_CICD_Guide](16_CICD_Guide.md)) — tests run only locally.
- ⚠️ Coverage % not tracked in CI (recommend adding).

---

*Cross-references: [21_Code_Standards](21_Code_Standards.md) · [16_CICD_Guide](16_CICD_Guide.md) · [26_Technical_Debt](26_Technical_Debt.md)*
