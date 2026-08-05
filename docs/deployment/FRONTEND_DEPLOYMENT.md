# Frontend Independent Deployment Guide

## Overview
The `StudentCenter` frontend is a Next.js 16 App Router web application designed for standalone deployment on Vercel, Node.js VPS, or Docker.

## Prerequisites
- Node.js 20+ LTS / npm 10+
- Docker (for containerized deployment)

## Standalone Deployment (Docker)
```bash
# Navigate to frontend directory
cd frontend

# Build Docker image
docker build -t studentcenter-frontend:1.0.0 .

# Run container with environment variables
docker run -d \
  --name studentcenter-frontend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_BASE_URL="https://api.yourdomain.com" \
  studentcenter-frontend:1.0.0
```

## PM2 Bare-Metal Deployment
```bash
cd frontend
npm install
npm run build
pm2 start npm --name "studentcenter-frontend" -- start
```
