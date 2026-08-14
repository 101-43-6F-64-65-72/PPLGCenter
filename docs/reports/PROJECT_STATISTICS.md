# StudentCenter — Project Statistics

**Version:** 1.0.0  
**Audit Date:** 2026-08-04  

---

## Codebase Metrics

| Metric | Count |
|---|---|
| Backend source files (`.cs`, excl. obj/bin) | 168 |
| Frontend source files (`.js`, `.jsx`, `.ts`, `.tsx`) | 88 |
| EF Core migration files | 25 |
| API controllers | 15 |
| CI/CD workflow files | 5 |

## Test Coverage

| Metric | Count |
|---|---|
| xUnit unit tests | 87 |
| Playwright E2E spec files | 18 |
| Playwright E2E test cases | 32 |
| Total test coverage | 119 tests |

## API Surface

| Metric | Count |
|---|---|
| API controllers | 15 |
| Estimated API endpoints | ~60 |
| Health/observability endpoints | 4 (`/health`, `/ready`, `/live`, `/metrics`) |
| OpenAPI documented endpoints | All (via Swagger) |

## Database

| Metric | Count |
|---|---|
| Database tables | 12 |
| EF Core migrations | 25 |
| Indexes (EF Core) | Reviewed & optimized in Sprint 7 |

## Infrastructure

| Metric | Count |
|---|---|
| Docker services | 5 (db, backend, frontend, nginx, alertmanager) |
| Monitoring services | 3 (prometheus, grafana, alertmanager) |
| Alert rules | 5 |
| Backup retention | 7 days daily |
| Prometheus metric retention | 30 days |

## Sprints Completed

| Sprint | Focus |
|---|---|
| 1 | Security Audit |
| 2 | UI Polish |
| 3 | Performance Optimization |
| RC-1 | Release Candidate Build |
| 5 | Production Hardening (Health, Security, Docker) |
| 6 | DevOps & Observability (CI/CD, Dependabot) |
| 7 | Quality (Coverage, Serilog, ProblemDetails) |
| 8 | Production Hardening (Migrations, Graceful Shutdown) |
| 9 | Observability (Prometheus, Grafana) |
| 10 | Security & k6 Load Testing |
| 11 | Production Deployment (Nginx, HTTPS, .env) |
| 12 | Docker Hardening & Alertmanager |
| 13 | Final Documentation & Audit |
