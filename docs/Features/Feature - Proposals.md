---
tags:
  - feature
aliases:
  - Feature - Proposals
---

# Feature - Proposals

Proposal submission and multi-stage approval workflow for OSIS members.

## Status

**Implemented** (Phase 017)

## Overview

OSIS members can submit proposals for review by Admin and Teacher staff. Proposals follow a simple workflow: Pending → Approved/Rejected. Once reviewed, proposals are locked from further edits.

## Features

- Submit proposal with title, description, and file attachment
- View proposal status and review feedback
- Edit pending proposals (OSIS own only)
- Delete pending proposals (OSIS own only)
- Review and approve/reject proposals (Admin, Teacher only)
- Pagination and filtering by status/submitter
- Ownership validation in service layer
- Business rule enforcement (approved/rejected cannot be edited)

## Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/proposals` | Authenticated | List proposals (paginated) |
| GET | `/api/proposals/{id}` | Authenticated | Get proposal detail |
| POST | `/api/proposals` | OSIS | Submit new proposal |
| PUT | `/api/proposals/{id}` | OSIS | Update pending proposal |
| DELETE | `/api/proposals/{id}` | OSIS | Delete pending proposal |
| PATCH | `/api/proposals/{id}/review` | Admin, Teacher | Approve/reject proposal |

## DTOs

### CreateProposalRequest
```
- Title: string (required, 5-300 chars)
- Description: string (required, 10-2000 chars)
- FileUrl: string (required, max 500 chars)
```

### UpdateProposalRequest
```
- Title: string (required, 5-300 chars)
- Description: string (required, 10-2000 chars)
- FileUrl: string (required, max 500 chars)
```

### ReviewProposalRequest
```
- Status: ProposalStatus (required)
- RejectionReason: string (optional, max 1000 chars)
```

### ProposalResponse
```
- Id: Guid
- Title: string
- Description: string
- FileUrl: string
- Status: ProposalStatus (Pending, Approved, Rejected)
- RejectionReason: string? (null if not rejected)
- SubmittedByUserId: Guid
- SubmittedByUserName: string
- ReviewedByUserId: Guid?
- ReviewedByUserName: string?
- CreatedAt: DateTime
- UpdatedAt: DateTime
- ReviewedAt: DateTime?
```

## Business Rules

1. **Creation**: Only OSIS members can create proposals
2. **Ownership**: OSIS can only edit/delete their own proposals
3. **Status Locking**: Approved/Rejected proposals cannot be edited or deleted
4. **Review Restriction**: Only Admin and Teacher can review
5. **Single Review**: Each proposal can only be reviewed once
6. **Rejection Reason**: Required when status is Rejected

## Authorization Matrix

| Operation | OSIS | Admin | Teacher | Student |
|-----------|------|-------|---------|---------|
| Create | ✓ | ✗ | ✗ | ✗ |
| List | ✓ (own) | ✓ (all) | ✓ (all) | ✓ (all) |
| View | ✓ (own) | ✓ (all) | ✓ (all) | ✓ (all) |
| Update | ✓ (own, pending) | ✗ | ✗ | ✗ |
| Delete | ✓ (own, pending) | ✗ | ✗ | ✗ |
| Review | ✗ | ✓ | ✓ | ✗ |

## Implementation Notes

- Service layer enforces ownership checks before data mutations
- `AsNoTracking()` used for all read queries (GET endpoints)
- Foreign keys use `DeleteBehavior.Restrict` to prevent orphaning
- Indexes on `SubmittedByUserId`, `Status`, `CreatedAt`, `ReviewedByUserId`
- Validation attributes on DTOs for input sanitization
- Exception handling for business rule violations (returns 422 Unprocessable Entity)

## Related

- [[Entity - Proposal]]
- [[User Roles]]
- [[API Contract]]
- [[Feature - Authentication]]
- [[Database Schema]]
- [[MOC - Features]]
