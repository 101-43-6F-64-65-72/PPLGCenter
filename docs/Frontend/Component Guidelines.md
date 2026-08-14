---
tags:
  - frontend
  - architecture
aliases:
  - Component Guidelines
---

# Component Guidelines

Rules for building reusable components in the StudentCenter frontend.

**Source**: `frontend/docs/component-agent.md`

## Principles

- **Reusable**: Components must be usable in multiple contexts
- **Composable**: Small, combinable building blocks
- **Maintainable**: Easy to understand and modify
- **Readable**: Clear, self-documenting code

## Component Categories

| Category | Location | Purpose |
|----------|----------|---------|
| UI Components | `components/ui/` | Pure presentational (buttons, inputs, cards) |
| Shared Components | `components/shared/` | Cross-feature reusable components |
| Business Components | `components/<feature>/` | Feature-specific logic components |

## Planned Folders

```
components/
├── ui/              (shadcn/ui + custom UI)
├── shared/          (Navbar, Sidebar, etc.)
├── dashboard/       (Dashboard widgets)
├── announcement/    (Announcement cards, lists)
├── booking/         (Booking forms, status)
├── proposal/        (Proposal upload, timeline)
└── profile/         (Profile forms, avatar)
```

## Rules

1. No business logic in UI components
2. Props must be simple and well-defined
3. Single Responsibility Principle
4. Create reusable components when used more than once
5. Separate business logic into hooks or services

## Current Components

| Component | Type | Client/Server |
|-----------|------|--------------|
| `Navbar` | Shared | Client |
| `Hero` | Business | Server |
| `PrimaryButton` | UI | Server |
| `FloatingBadge` | UI | Server |
| `ContactCard` | UI | Server |
| `ExtracurricularCollage` | Business | Server |
| `ExtracurricularSection` | Business | Server |

## Related

- [[Frontend Architecture Rules]]
- [[Frontend Overview]]
- [[MOC - Frontend]]
