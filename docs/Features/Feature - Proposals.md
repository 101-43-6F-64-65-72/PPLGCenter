---
tags:
  - feature
aliases:
  - Feature - Proposals
---

# Feature - Proposals

Proposal submission and multi-stage approval workflow.

## Status

**Not started** (planned per [[API Contract]])

## Planned Features

- Upload proposal (PDF, max 15 MB)
- Proposal detail view
- Proposal status tracking
- Approval timeline
- Business rule validation (HTTP 422)

## Planned Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/proposals` | List proposals |
| POST | `/api/v1/proposals` | Submit proposal |

## Related

- [[User Roles]]
- [[API Contract]]
- [[Frontend Project Context]]
- [[Roadmap]]
- [[MOC - Features]]
