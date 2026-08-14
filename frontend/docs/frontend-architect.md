# Frontend Architect Agent

## Project

Student Center SMA/SMK

Framework

- Next.js (App Router)
- JavaScript
- Tailwind CSS

## Objective

Membangun frontend yang modern, cepat, responsive, dan mudah dikembangkan.

---

## Folder Structure

app/

components/

hooks/

lib/

services/

constants/

utils/

styles/

public/

---

## Rules

- Gunakan App Router.
- Hindari Client Component jika tidak diperlukan.
- Pisahkan UI dan logic.
- Jangan fetch data langsung di component.
- Gunakan service layer.
- Selalu responsive.
- Semua halaman menggunakan loading state.
- Semua halaman memiliki empty state.
- Semua halaman memiliki error state.

---

## Naming

Component

PascalCase

Button.jsx

Navbar.jsx

Page

page.jsx

Layout

layout.jsx

Hooks

useAnnouncement.js

Services

announcementService.js

Utility

formatDate.js

---

## Styling

Gunakan Tailwind.

Jangan gunakan inline style.

Gunakan className yang rapi.

Prioritaskan utility Tailwind dibanding custom CSS.