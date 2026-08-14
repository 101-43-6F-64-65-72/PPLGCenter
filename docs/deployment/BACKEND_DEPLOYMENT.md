# Backend Independent Deployment Guide

## Overview
`StudentCenter.Api` is an ASP.NET Core 10 Web API application designed for standalone containerized or bare-metal Linux deployment.

## Prerequisites
- .NET 10 SDK / Runtime
- PostgreSQL 16+
- Docker & Docker Compose (optional for containerized setup)

## Standalone Deployment (Docker)
```bash
# Navigate to backend directory
cd backend

# Build Docker image
docker build -t studentcenter-api:1.0.0 .

# Run container with environment variables
docker run -d \
  --name studentcenter-api \
  -p 5051:5051 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e DATABASE_URL="Host=postgres-host;Port=5432;Database=studentcenter;Username=app_user;Password=app_password" \
  -e JWT_SECRET="your-32-byte-secure-jwt-signing-key" \
  -e JWT_ISSUER="StudentCenter" \
  -e JWT_AUDIENCE="StudentCenterApp" \
  -e CORS__AllowedOrigins="https://yourdomain.com" \
  studentcenter-api:1.0.0
```

## Bare-Metal Systemd Deployment
```bash
cd backend
dotnet publish StudentCenter.Api/StudentCenter.Api.csproj -c Release -o /var/www/studentcenter-api

# Configure /etc/systemd/system/studentcenter-api.service
# Run: systemctl daemon-reload && systemctl enable --now studentcenter-api
```
