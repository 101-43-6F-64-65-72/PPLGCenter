# StudentCenter Production Deployment Guide

This guide details production deployment for StudentCenter platform.

- **Primary Architecture**:
  - **Backend (.NET 10 REST API)**: Docker Container on **Render Web Service**
  - **Database**: PostgreSQL on **Render PostgreSQL**
  - **Storage**: Render **Persistent Disk** mounted at `/app/wwwroot/uploads`
  - **Frontend (Next.js 15)**: **Vercel Cloud**
- **Alternative Architecture**: VPS Linux via Docker Compose / Systemd

---

## 1. Primary Deployment Strategy: Render + Vercel

### Step 1: Deploy Render PostgreSQL Database

1. Log into [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **PostgreSQL**.
3. Set Database Name: `studentcenter-db`.
4. Region: **Singapore** (or nearest region).
5. Copy Internal Database URL (e.g. `postgres://studentcenter_user:pass@dbs-xxx.singapore-postgres.render.com/studentcenter`).

### Step 2: Deploy Backend (.NET Docker Service) to Render

1. Click **New +** → **Web Service** on Render.
2. Connect your Git repository containing StudentCenter.
3. Environment: **Docker**.
4. Docker Command / Dockerfile Path: `./backend/Dockerfile` (Context: `./backend`).
5. Configure Environment Variables in Render Dashboard:
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `DATABASE_URL`: `postgres://studentcenter_user:pass@dbs-xxx.singapore-postgres.render.com/studentcenter`
   - `JWT_SECRET`: Minimum 32-character random secret key
   - `CORS__AllowedOrigins`: `https://studentcenter.vercel.app,https://studentcenter.smkn2surakarta.sch.id`
   - `UPLOAD_PATH`: `/app/wwwroot/uploads`
6. Configure Render Persistent Disk:
   - Mount Path: `/app/wwwroot/uploads`
   - Size: 1 GB (or as required)
7. Health Check Path: `/health/ready`
8. Click **Create Web Service**.

> **Note on Migrations**: On container startup, the application automatically runs pending EF Core database migrations via `dbContext.Database.MigrateAsync()`.

### Step 3: Deploy Frontend (Next.js) to Vercel

1. Log into [Vercel Dashboard](https://vercel.com/).
2. Click **Add New** → **Project** and import your Git repository.
3. Set Framework Preset: **Next.js**. Root Directory: `frontend`.
4. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_APP_NAME`: `Student Center SMK Negeri 2 Surakarta`
   - `NEXT_PUBLIC_APP_URL`: `https://studentcenter.vercel.app`
   - `NEXT_PUBLIC_API_URL`: `https://studentcenter-backend.onrender.com`
   - `NEXT_PUBLIC_API_BASE_URL`: `https://studentcenter-backend.onrender.com`
   - `NEXT_PUBLIC_IMAGE_BASE_URL`: `https://studentcenter-backend.onrender.com`
5. Click **Deploy**.

---

## 2. Environment Variables Summary

### Render Backend Environment Variables

| Variable | Description |
| -------- | ----------- |
| `ASPNETCORE_ENVIRONMENT` | Set to `Production` |
| `DATABASE_URL` | Render PostgreSQL URL (`postgres://...`) |
| `JWT_SECRET` | Secret key for JWT signatures (>= 32 chars) |
| `CORS__AllowedOrigins` | Allowed origins (Vercel domain) |
| `UPLOAD_PATH` | Storage directory (`/app/wwwroot/uploads`) |

### Vercel Frontend Environment Variables

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_APP_NAME` | Platform title |
| `NEXT_PUBLIC_APP_URL` | Vercel production frontend URL |
| `NEXT_PUBLIC_API_URL` | Render backend API URL |
| `NEXT_PUBLIC_API_BASE_URL` | Render backend API URL |
| `NEXT_PUBLIC_IMAGE_BASE_URL` | Render backend image URL |

---

## 3. Alternative Deployment: Linux VPS (Optional)

1. Clone repository on VPS.
2. Provide secrets in `secrets/db_password.txt` and `secrets/jwt_secret.txt`.
3. Launch container stack:
   ```bash
   docker compose -f docker-compose.production.yml up -d --build
   ```
4. Verify `/health` response:
   ```bash
   curl -f http://localhost:5051/health
   ```

---

## 4. Troubleshooting

1. **503 Service Unavailable on `/health/ready`**:
   - Check Render logs for database connection timeouts or missing `DATABASE_URL`.
2. **CORS Network Errors in Browser**:
   - Verify `CORS__AllowedOrigins` in Render includes your exact Vercel frontend URL without trailing slashes.
3. **Uploaded Images Missing after Deployment Restart**:
   - Ensure Render Persistent Disk is attached and mounted to `/app/wwwroot/uploads`.
