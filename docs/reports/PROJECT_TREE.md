# StudentCenter v1.0.0 — Project Tree Summary

```
StudentCenter/
├── .env.example                         # Environment variable template
├── .dockerignore                        # Docker ignore rules
├── .gitignore
├── VERSION                              # 1.0.0
├── CHANGELOG.md
├── README.md                            # Installation, setup, deployment guide
├── LICENSE                              # MIT License
├── CONTRIBUTING.md
├── SECURITY.md
│
├── ARCHITECTURE.md
├── SYSTEM_DESIGN.md
├── API_REFERENCE.md
├── API_COLLECTION.json                  # Postman collection
├── OPERATIONS_RUNBOOK.md
├── DEPLOYMENT_GUIDE.md
├── USER_MANUAL.md
├── ADMIN_GUIDE.md
├── RELEASE_NOTES.md
├── FINAL_AUDIT.md
├── PROJECT_STATISTICS.md
│
├── backend/
│   ├── Dockerfile                       # Multi-stage, non-root, HEALTHCHECK
│   ├── StudentCenter.slnx
│   ├── StudentCenter.Api/               # Controllers, Middleware, Program.cs
│   ├── StudentCenter.Application/       # Use cases, DTOs, Services
│   ├── StudentCenter.Domain/            # Entities, Value Objects
│   └── StudentCenter.Infrastructure/    # EF Core, Repositories, Migrations (25)
│
├── StudentCenter.Tests/                 # 87 xUnit unit tests
│
├── frontend/
│   ├── Dockerfile                       # Multi-stage, non-root, HEALTHCHECK
│   ├── playwright.config.js             # Playwright config (90s timeout)
│   ├── src/
│   │   ├── app/                         # Next.js 16 App Router pages (13 routes)
│   │   ├── components/                  # Shared UI components
│   │   ├── features/                    # Feature-scoped modules
│   │   ├── contexts/                    # AuthContext
│   │   └── services/                   # API client functions
│   └── e2e/                             # 18 Playwright spec files (32 test cases)
│
├── nginx/
│   ├── nginx.conf                       # Reverse proxy, HTTPS, HTTP→HTTPS, gzip
│   └── security.conf                    # OWASP security headers
│
├── monitoring/
│   ├── prometheus.yml                   # Scrape config + alertmanager integration
│   ├── alert.rules.yml                  # 5 production alert rules
│   ├── alertmanager.yml                 # Email alerting config
│   └── grafana-dashboard.json           # Grafana dashboard
│
├── scripts/
│   ├── deploy.ps1                       # Production deploy
│   ├── rollback.ps1                     # Production rollback
│   ├── backup.ps1                       # pg_dump backup
│   ├── restore.ps1                      # psql restore
│   ├── backup-retention.ps1             # 7-day retention + restore validation
│   └── load-test.js                     # k6 load test (50/100/300 VUs)
│
├── secrets/
│   ├── db_password.txt                  # Docker secret (replace before deploy)
│   └── jwt_secret.txt                   # Docker secret (replace before deploy)
│
├── docker-compose.prod.yml              # Development Docker stack
├── docker-compose.production.yml        # Hardened production stack (secrets, limits)
├── docker-compose.monitoring.yml        # Prometheus + Grafana + Alertmanager
│
└── .github/
    ├── workflows/
    │   ├── ci.yml                       # CI: build, test, lint, Playwright
    │   ├── deploy-backend.yml
    │   └── deploy-frontend.yml
    └── dependabot.yml                   # Weekly npm + NuGet + Actions updates
```
