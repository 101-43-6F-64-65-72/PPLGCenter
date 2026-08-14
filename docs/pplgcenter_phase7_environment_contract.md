# PPLG CENTER — PHASE 7 ENVIRONMENT & CONFIGURATION CONTRACT

**Date:** 2026-08-13  
**Author:** Principal Software Architect / Senior DevOps Engineer  
**Status:** VERIFIED & HARDENED FOR PRODUCTION DEPLOYMENT

---

## 1. Executive Summary

This document defines the strict configuration and environment contract between the Next.js Frontend (hosted on Vercel), the ASP.NET Core REST API (hosted on Render), the Supabase PostgreSQL Database, and Cloudinary CDN.

---

## 2. Global Secret Isolation Policy

- **PUBLIC VARIABLES:** Only variables prefixed with `NEXT_PUBLIC_` are accessible to the browser client.
- **PRIVATE VARIABLES:** All backend secrets (`JWT_SECRET`, `DATABASE_URL`, `CLOUDINARY__APISECRET`, `CLOUDINARY__APIKEY`, `CLOUDINARY__CLOUDNAME`) must be stored exclusively in server environment settings (Render) and git-ignored local `.env` files.
- **ZERO BROWSER SECRET EXPOSURE:** Neither Cloudinary API secrets nor JWT signing keys will ever be transmitted to or stored in client-side bundles.

---

## 3. Environment Variable Classification Matrix

| Subsystem | Variable Name | Purpose | Target Platform | Scope | Public vs Private |
|---|---|---|---|---|---|
| **Backend** | `PORT` | Dynamic HTTP server port binding | Render | Runtime | **PRIVATE** |
| **Backend** | `DATABASE_URL` | PostgreSQL connection string | Render | Runtime | **PRIVATE** |
| **Backend** | `JWT_SECRET` | HMAC-SHA256 signing secret for JWT tokens | Render | Runtime | **PRIVATE** |
| **Backend** | `JWT_ISSUER` | Token issuer validation claim | Render | Runtime | **PRIVATE** |
| **Backend** | `JWT_AUDIENCE` | Token audience validation claim | Render | Runtime | **PRIVATE** |
| **Backend** | `CORS__AllowedOrigins` | Production CORS allowed origins | Render | Runtime | **PRIVATE** |
| **Backend** | `CLOUDINARY__CLOUDNAME` | Cloudinary account name | Render | Runtime | **PRIVATE** |
| **Backend** | `CLOUDINARY__APIKEY` | Cloudinary public API key | Render | Runtime | **PRIVATE** |
| **Backend** | `CLOUDINARY__APISECRET` | Cloudinary signing secret | Render | Runtime | **PRIVATE** |
| **Frontend** | `NEXT_PUBLIC_API_BASE_URL` | ASP.NET Core API Base URL | Vercel | Build & Runtime | **PUBLIC** |
| **Frontend** | `NEXT_PUBLIC_APP_URL` | Next.js Frontend App URL | Vercel | Build & Runtime | **PUBLIC** |

---

## 4. Subsystem Hardening Contracts

### A. ASP.NET Core Backend (Render)
- **Port Dynamic Binding:** Binds to `Environment.GetEnvironmentVariable("PORT") ?? "5051"`.
- **CORS Hardening:** Production policy permits wildcard subdomains of `.vercel.app` and explicitly configured origins from `CORS__AllowedOrigins`. `AllowAnyOrigin()` is forbidden for authenticated endpoints.
- **Database Connection Parsing:** Automatic URI conversion (`postgres://user:pass@host:port/db`) to Npgsql format with forced SSL (`SSL Mode=Require;Trust Server Certificate=true`).
- **Signed Cloudinary Upload Gateway:** Endpoint `POST /api/upload` authenticates user identity via JWT before generating server-side SHA-1 signatures to Cloudinary.
- **Health Check Endpoint:** `GET /health` mapped and returning HTTP 200 `Healthy` without exposing system metadata.

### B. Next.js Frontend (Vercel)
- **API Resolution:** Base API requests route through `process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5051"`. Zero hardcoded production localhost URLs.
- **Client Security:** No API secrets stored in `localStorage`, `sessionStorage`, or embedded JS artifacts.

---

## 5. Local Development vs Production Contract

```
DEVELOPMENT (Local Workstation)
  Frontend: http://localhost:3000
  Backend: http://localhost:5051
  Config: Local backend/.env (git-ignored)

PRODUCTION (Cloud Deployment)
  Frontend: https://pplgcenter.vercel.app (Vercel)
  Backend: https://pplgcenter-api.onrender.com (Render)
  Config: Platform Environment Variables (Vercel & Render Dashboards)
```
