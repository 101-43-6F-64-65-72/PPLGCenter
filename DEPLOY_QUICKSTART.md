# StudentCenter Deployment Quickstart

Production deployment guide for **Render** (Backend API + Database) and **Vercel** (Frontend UI).

---

## 1. Render Backend & Database Deployment

1. **Create PostgreSQL Database on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **PostgreSQL**.
   - Database Name: `studentcenter-db`. Region: **Singapore**.
   - Copy the **Internal Database URL** (`postgres://...`).

2. **Deploy Backend Web Service on Render**:
   - Go to **New +** → **Web Service** → Connect your GitHub repository.
   - Environment: **Docker**. Dockerfile Path: `./backend/Dockerfile`. Build Context: `./backend`.
   - Add **Environment Variables** in Render Dashboard:
     - `ASPNETCORE_ENVIRONMENT`: `Production`
     - `DATABASE_URL`: *(Paste your Render PostgreSQL URL)*
     - `JWT_SECRET`: *(Enter secret key >= 32 characters)*
     - `CORS__AllowedOrigins`: `https://studentcenter.vercel.app`
     - `UPLOAD_PATH`: `/app/wwwroot/uploads`
   - Add **Persistent Disk**: Mount Path: `/app/wwwroot/uploads`, Size: `1 GB`.
   - Health Check Path: `/health/ready`
   - Click **Deploy Web Service**.

> **Automatic Migration**: Database migrations run automatically at startup via `MigrateAsync()`.

---

## 2. Vercel Frontend Deployment

1. Go to [Vercel Dashboard](https://vercel.com/) → **Add New** → **Project** → Import repository.
2. Root Directory: `frontend`. Framework: **Next.js**.
3. Add **Environment Variables**:
   - `NEXT_PUBLIC_APP_NAME`: `Student Center SMK Negeri 2 Surakarta`
   - `NEXT_PUBLIC_APP_URL`: `https://studentcenter.vercel.app`
   - `NEXT_PUBLIC_API_URL`: `https://studentcenter-backend.onrender.com`
   - `NEXT_PUBLIC_API_BASE_URL`: `https://studentcenter-backend.onrender.com`
   - `NEXT_PUBLIC_IMAGE_BASE_URL`: `https://studentcenter-backend.onrender.com`
4. Click **Deploy**.

---

## 3. Troubleshooting

- **CORS Error**: Ensure `CORS__AllowedOrigins` on Render matches your exact Vercel domain.
- **Database Connection Error**: Verify `DATABASE_URL` format in Render Web Service settings.
- **Missing Uploaded Images**: Ensure Persistent Disk is mounted at `/app/wwwroot/uploads`.
