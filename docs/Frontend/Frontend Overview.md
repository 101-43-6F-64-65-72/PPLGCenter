---
tags:
  - frontend
aliases:
  - Frontend Overview
---

# Frontend Overview

The StudentCenter frontend is a Next.js application using the App Router pattern.

## Current State

The frontend is in **early development** — only a landing page exists. The planned module structure from [[Frontend Project Context]] has not yet been implemented.

## Project Structure (Current)

```
frontend/src/
├── app/
│   ├── layout.js          (Root layout, Geist fonts)
│   ├── page.js            (Landing page)
│   ├── globals.css        (Tailwind + global styles)
│   └── favicon.ico
├── components/
│   ├── Navbar.jsx         (Client: header + mobile menu)
│   ├── Hero.jsx           (Server: hero section)
│   ├── PrimaryButton.jsx  (Server: CTA button)
│   ├── FloatingBadge.jsx  (Server: decorative badge)
│   ├── ContactCard.jsx    (Server: contact info card)
│   ├── ExtracurricularCollage.jsx  (Server: image grid)
│   ├── ExtracurricularSection.jsx  (Server: section layout)
│   └── home/              (Barrel re-exports)
└── lib/
    └── ensure-assets.js   (Asset copy utility)
```

## Running the Frontend

```bash
cd frontend
npm run dev
```

Opens at `http://localhost:3000`.

## Planned Structure (from [[Frontend Architecture Rules]])

```
src/
├── app/           (Pages via App Router)
├── components/    (UI + Business components)
├── hooks/         (Custom React hooks)
├── services/      (API communication layer)
├── utils/         (Helper functions)
├── constants/     (Constant values)
├── lib/           (Shared utilities)
└── styles/        (Global styles)
```

## Key Decisions

- Server Components by default; Client Components only when needed
- Service layer for all API communication (no direct fetch in components)
- [[Component Guidelines]] separate UI and business components
- Tailwind CSS for all styling (no inline styles)

## Related

- [[Frontend Architecture Rules]]
- [[Component Guidelines]]
- [[Frontend Project Context]]
- [[Landing Page]]
- [[Tech Stack]]
- [[MOC - Frontend]]
