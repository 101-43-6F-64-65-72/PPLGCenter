# PPLG CENTER — PHASE 7 DEPLOYMENT MANIFEST

**Date:** 2026-08-13  
**Author:** Principal Software Architect / Senior DevOps Engineer  
**Status:** READY FOR PRODUCTION DEPLOYMENT

---

## 1. Overview & Topology

```
             Client Device (Browser / Mobile)
                           │
                           │ HTTPS
                           ▼
               ┌───────────────────────┐
               │ Vercel CDN Singleton  │ (Next.js 16 App Router)
               └───────────┬───────────┘
                           │ HTTPS REST API
                           ▼
               ┌───────────────────────┐
               │ Render Web Service    │ (ASP.NET Core / .NET 10)
               └───────┬───────┬───────┘
                       │       │
      PostgreSQL / SSL │       │ Cloudinary API
                       ▼       ▼
           ┌──────────────┐ ┌─────────────┐
           │ Supabase DB  │ │ Cloudinary  │
           └──────────────┘ └─────────────┘
```

---

## 2. Render Deployment Configuration (Backend Web API)

- **Service Type:** Web Service
- **Environment:** .NET / Docker / C#
- **Build Command:** `dotnet build backend/StudentCenter.slnx -c Release`
- **Start Command:** `dotnet backend/StudentCenter.Api/bin/Release/net10.0/StudentCenter.Api.dll`

### Required Environment Variables Dashboard Config:

```env
# Server Runtime
PORT=5051
ASPNETCORE_ENVIRONMENT=Production

# Database (Supabase Dedicated PPLG Instance)
DATABASE_URL=Host=db.ryskvrqcrytmdsorviie.supabase.co;Port=5432;Database=postgres;Username=postgres.ryskvrqcrytmdsorviie;Password=<SUPABASE_DB_PASSWORD>;SSL Mode=Require;Trust Server Certificate=true

# Authentication (HMAC-SHA256 JWT)
JWT_SECRET=<STRONG_RANDOM_64_CHAR_JWT_SECRET>
JWT_ISSUER=PPLGCenter
JWT_AUDIENCE=PPLGCenterApp

# CORS Configuration
CORS__AllowedOrigins=https://pplgcenter.vercel.app

# Cloudinary Signed Upload Gateway
CLOUDINARY__CLOUDNAME=<CLOUDINARY_CLOUD_NAME>
CLOUDINARY__APIKEY=<CLOUDINARY_API_KEY>
CLOUDINARY__APISECRET=<CLOUDINARY_API_SECRET>
```

---

## 3. Vercel Deployment Configuration (Frontend App Router)

- **Framework Preset:** Next.js
- **Root Directory:** `frontend/`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

### Required Environment Variables Dashboard Config:

```env
# Public Backend API Gateway URL
NEXT_PUBLIC_API_BASE_URL=https://pplgcenter-api.onrender.com

# Public App URL
NEXT_PUBLIC_APP_URL=https://pplgcenter.vercel.app
```

---

## 4. Verification Checkpoints Before Deployment

1. **Database Schema:** Confirm Supabase PostgreSQL (`rwopazhqgvvrosdizmvt`) contains all 59 public tables. Do NOT execute EF Core migrations against production.
2. **CORS Headers:** Confirm `NEXT_PUBLIC_API_BASE_URL` in Vercel matches the exact Render service URL.
3. **Cloudinary Uploads:** Verify that all image/document uploads pass through `POST /api/upload`.
