---
tags:
  - entity
  - domain
  - proposal
aliases:
  - Entity - Proposal
---

# Entity - Proposal

Domain entity representing an OSIS proposal submission for review and approval.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| Title | `string` | Required, max 300 |
| Description | `string` | Required, max 2000 |
| FileUrl | `string` | Required, max 500 |
| Status | `ProposalStatus` | Required, integer enum |
| RejectionReason | `string?` | Optional, max 1000 |
| SubmittedByUserId | `Guid` | FK → [[Entity - User]] |
| SubmittedByUser | `User` | Navigation property |
| ReviewedByUserId | `Guid?` | FK → [[Entity - User]], nullable |
| ReviewedByUser | `User?` | Navigation property |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| UpdatedAt | `DateTime` | Required, default `now()`, UTC |
| ReviewedAt | `DateTime?` | Optional, UTC |

## Location

`StudentCenter.Domain/Entities/Proposal.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/ProposalConfiguration.cs`

## Indexes

- `IX_Proposals_SubmittedByUserId`
- `IX_Proposals_Status`
- `IX_Proposals_CreatedAt`
- `IX_Proposals_ReviewedByUserId`

## Relationships

- **Many-to-One** with [[Entity - User]] via `SubmittedByUserId` (RESTRICT delete)
- **Many-to-One** with [[Entity - User]] via `ReviewedByUserId` (RESTRICT delete)

## Status Enum

`ProposalStatus` values:
- `Pending = 0`
- `Approved = 1`
- `Rejected = 2`

## Business Rules

- Only OSIS members can create proposals
- Only Admin and Teacher can review proposals
- Approved/Rejected proposals cannot be edited or deleted
- Review can only happen once per proposal
- Ownership checks enforced in service layer

## Related

- [[Entity - User]]
- [[Feature - Proposals]]
- [[Database Schema]]
- [[MOC - Database]]
- [[Home]]
