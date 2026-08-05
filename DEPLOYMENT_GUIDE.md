# StudentCenter Production Deployment Guide

This guide outlines the steps to deploy **StudentCenter v1.0.0-RC1** in a production environment.

---

## 1. Prerequisites & System Requirements

- **Backend Runtime**: .NET 10.0 SDK / Runtime
- **Frontend Runtime**: Node.js 18+ (LTS) & npm
- **Database Engine**: PostgreSQL 14+ database instance
- **Reverse Proxy**: NGINX, Caddy, or IIS (with SSL/TLS certificates)

---

## 2. Environment Variables Configuration

Create environment configurations for both backend and frontend environments.

### Backend Environment Variables (`backend/StudentCenter.Api/.env` or system env)

| Variable | Description | Example / Requirement |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `Host=localhost;Port=5432;Database=studentcenter;Username=sc_user;Password=SECURE_PASSWORD` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Must be at least 32 bytes (256 bits) long |
| `JWT_ISSUER` | JWT Issuer claim value | `StudentCenter` |
| `JWT_AUDIENCE` | JWT Audience claim value | `StudentCenterApp` |
| `JWT_EXPIRATION_MINUTES` | Token lifetime in minutes | `60` |
| `CORS__AllowedOrigins` | Production CORS allowed origins | `https://studentcenter.smkn2surakarta.sch.id` |
| `DEFAULT_ADMIN_PASSWORD` | Initial admin account seed password | `ComplexAdminPassword!2026` |

### Frontend Environment Variables (`frontend/.env.production`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend REST API endpoint | `https://api.studentcenter.smkn2surakarta.sch.id` |

---

## 3. Database Migration & Initialization

Execute Entity Framework Core migrations to create tables and seed default administrator credentials:

```bash
cd backend/StudentCenter.Api
dotnet ef database update
```

---

## 4. Building Production Artifacts

### A. Backend (.NET Core API)
Publish self-contained production binaries:

```bash
cd backend/StudentCenter.Api
dotnet publish -c Release -o ./publish
```

### B. Frontend (Next.js App Router)
Build optimized production static & server assets:

```bash
cd frontend
npm ci
npm run build
```

---

## 5. Running Production Services

### Running Backend API
```bash
cd backend/StudentCenter.Api/publish
dotnet StudentCenter.Api.dll
```

### Running Frontend Application
```bash
cd frontend
npm run start
```

---

## 6. Health & Sanity Verification

Verify service status:

1. **Backend Health Check**:
   ```bash
   curl -I https://api.studentcenter.smkn2surakarta.sch.id/health
   # Expected: HTTP/1.1 200 OK
   ```

2. **Frontend Page Load**:
   ```bash
   curl -I https://studentcenter.smkn2surakarta.sch.id/
   # Expected: HTTP/1.1 200 OK
   ```
