---
tags:
  - feature
  - frontend
aliases:
  - Landing Page
---

# Landing Page

The current frontend landing page for StudentCenter (SchoolHub / SMK Negeri 2 Surakarta).

## Status

**Implemented** (frontend only)

## Structure

| Section | Component | Description |
|---------|-----------|-------------|
| Header | `Navbar` | Fixed nav with logo, links (Beranda, Ekstrakurikuler, Mading, Kontak), Login button |
| Hero | `Hero` | Heading "SMK Pusat Keunggulan", description, CTA, school image with badges |
| Extracurricular | `ExtracurricularSection` | 2x2 image collage + description + "Daftar" CTA |

## Components Used

- [[Component Guidelines|Navbar]] — Client component with mobile hamburger menu, smooth scroll
- `Hero` — Server component, school building image, floating badges, contact card
- `PrimaryButton` — Green CTA with arrow icon (brand color `#00B929`)
- `FloatingBadge` — Decorative speech-bubble badges
- `ContactCard` — Phone number + avatar pill
- `ExtracurricularCollage` — 2x2 image grid with rotation transforms
- `ExtracurricularSection` — Collage + text + CTA wrapper

## Assets

Located in `public/images/`:
- `logo.png` / `logo.svg`
- `hero-building.png`
- `contact-avatar.png`
- `smknegeri2surakarta_cover.webp`

## Related

- [[Frontend Overview]]
- [[MOC - Frontend]]
