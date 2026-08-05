# Changelog

All notable changes to StudentCenter will be documented in this file.

## [1.0.0] - 2026-08-04

### 🚀 Production Release — Final

- Docker hardening: non-root user, HEALTHCHECK, `no-new-privileges`, `unless-stopped` restart policy.
- Resource limits (CPU/RAM) applied to all services via Docker Compose deploy constraints.
- Docker Secrets support for `db_password` and `jwt_secret` (file-based secrets mount).
- Backup retention policy with daily pruning script (`scripts/backup-retention.ps1`).
- Backup restore validation integrated into retention script.
- Alertmanager integration with Prometheus (`monitoring/alertmanager.yml`).
- Production alert rules: BackendDown, HighRequestLatency, HighErrorRate, DatabaseDown, HighMemoryUsage.
- 30-day Prometheus metric retention configured.
- Nginx security.conf with OWASP headers, gzip compression, 25MB upload limit.
- HTTP → HTTPS redirect with Let's Encrypt TLS termination.
- Final production deployment report (`FINAL_DEPLOYMENT_REPORT.md`).

## [1.0.0-RC1] - 2026-08-04

### Added
- GitHub Actions CI/CD workflows (`.github/workflows/ci.yml`).
- Dependabot weekly dependency updates configuration (`.github/dependabot.yml`).
- Health monitoring endpoints (`/health`, `/ready`, `/live`).
- Security header enforcement (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- Next.js API rewrite proxy rules to ASP.NET Core backend.
- Docker configuration (`Dockerfile` for frontend and backend, `docker-compose.prod.yml`).
- Automated Playwright E2E test coverage for 11 core application routes.
