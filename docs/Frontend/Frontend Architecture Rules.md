---
tags:
  - frontend
  - architecture
aliases:
  - Frontend Architecture Rules
---

# Frontend Architecture Rules

Rules and conventions defined by the frontend architecture team.

**Source**: `frontend/docs/frontend-architect.md`

## Framework

- Next.js (App Router)
- JavaScript (ES2023)
- Tailwind CSS

## Rules

1. Use App Router exclusively
2. Prefer Server Components; use Client Components only for `useState`, `useEffect`, event handlers
3. Separate UI from logic
4. Never fetch data directly in components — use the [[Component Guidelines|service layer]]
5. All pages must be responsive
6. Every page must have: loading state (skeleton), empty state, error state

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `Button.jsx`, `Navbar.jsx` |
| Page | lowercase | `page.jsx` |
| Layout | lowercase | `layout.jsx` |
| Hook | camelCase with `use` prefix | `useAnnouncement.js` |
| Service | camelCase with `Service` suffix | `announcementService.js` |
| Utility | camelCase | `formatDate.js` |
| Folder | kebab-case | `digital-bulletin/` |
| Constant | UPPER_CASE | `MAX_FILE_SIZE` |

## Styling Rules

- Use Tailwind utility classes
- No inline styles
- Consistent spacing via Tailwind scale
- Border radius: `rounded-xl` / `rounded-2xl`
- Light shadows only
- Card-based layouts for main content

## Performance

- Server Components where possible
- Lazy loading for large pages
- Optimize images with `next/image`

## Related

- [[Component Guidelines]]
- [[Frontend Overview]]
- [[Frontend Project Context]]
- [[MOC - Frontend]]
