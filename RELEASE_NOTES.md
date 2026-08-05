# StudentCenter Release Notes — v1.0.0

**Version:** `1.0.0` (Stable)
**Release Date:** `August 4, 2026`
**Status:** `Production Ready`

---

## What's New in v1.0.0

This is the first stable release of StudentCenter — a fully integrated digital activity management portal for SMK Negeri 2 Surakarta.

### Core Features
- Multi-role authentication: Student, OSIS, Teacher (Guru), Admin
- JWT-based stateless auth with session persistence and auto-logout
- Digital Bulletin Board (Mading Digital) with search, filtering, and pagination
- Facility & Equipment Booking with conflict detection and approval workflow
- OSIS Proposal management with multi-stage review (OSIS → Guru → Admin)
- Extracurricular catalog with join/leave and member management
- Super Admin, Guru, and OSIS administrative control panels

### Infrastructure & Security (Sprint 7–14)
- Nginx reverse proxy with HTTPS, HTTP→HTTPS redirect, Gzip compression
- OWASP security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- Docker production stack with non-root containers, secrets, and resource limits
- Prometheus + Grafana + Alertmanager observability stack
- Serilog structured rolling file logging with CorrelationId
- EF Core automatic startup migrations
- RFC 7807 ProblemDetails global error responses
- Rate limiting, CORS policy, and upload size limits (25MB)

### Quality Assurance
- 87 xUnit unit tests — all passing
- 32 Playwright E2E specs — all passing (18 spec files)
- GitHub Actions CI/CD pipeline (build, test, lint, Playwright)
- Dependabot weekly dependency updates

---

## Upgrade from RC1

No schema migrations required. RC1 → v1.0.0 is configuration and infrastructure hardening only.

---

## Known Limitations

- Docker/live deployment verification requires a Linux server with Docker daemon
- HTTPS certificate activation requires domain DNS to be pointed to server
- Alert email delivery requires SMTP credentials in `alertmanager.yml`
