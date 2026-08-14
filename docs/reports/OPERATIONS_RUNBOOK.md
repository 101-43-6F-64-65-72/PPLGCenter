# StudentCenter — Operations Runbook

## 1. Initial Deployment

```bash
# 1. Clone and configure secrets
cp .env.example .env
echo "DB_PASS" > secrets/db_password.txt
echo "JWT_SECRET_32CHARS" > secrets/jwt_secret.txt

# 2. Build and start production
.\scripts\deploy.ps1
# or
docker-compose -f docker-compose.production.yml up -d --build

# 3. Verify health
curl https://studentcenter.smkn2surakarta.sch.id/health
```

## 2. Health Checks

| Endpoint | Expected | Purpose |
|---|---|---|
| `/health` | `{"status":"Healthy"}` | Overall system |
| `/ready` | `{"status":"Healthy"}` | DB connectivity |
| `/live` | `{"status":"Healthy"}` | Process alive |
| `/metrics` | Prometheus text | Metrics scraping |

## 3. Database Backup & Restore

```powershell
# Backup (with 7-day retention)
.\scripts\backup-retention.ps1

# Manual backup
.\scripts\backup.ps1

# Restore
.\scripts\restore.ps1 -BackupFile .\backups\studentcenter_20260804.sql
```

## 4. Rolling Update (Zero Downtime)

```bash
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d --no-deps backend
docker-compose -f docker-compose.production.yml up -d --no-deps frontend
```

## 5. Rollback

```powershell
.\scripts\rollback.ps1
```

## 6. Monitoring

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access
Prometheus: http://server:9090
Grafana:    http://server:3001 (admin / $GRAFANA_PASSWORD)
Alertmanager: http://server:9093
```

## 7. SSL Certificate Renewal (Let's Encrypt)

```bash
certbot renew --nginx --non-interactive
docker-compose -f docker-compose.production.yml restart nginx
```

## 8. Log Access

```bash
# Backend (Serilog rolling logs)
docker exec studentcenter-backend-prod cat /app/logs/app.log

# Nginx
docker exec studentcenter-proxy-prod cat /var/log/nginx/access.log

# All services
docker-compose -f docker-compose.production.yml logs -f
```

## 9. Common Issues

| Issue | Cause | Fix |
|---|---|---|
| 502 Bad Gateway | Backend not ready | Check `/health`, restart backend |
| DB connection refused | PostgreSQL not started | `docker-compose restart db` |
| JWT invalid | Wrong secret or expired | Check `jwt_secret.txt`, re-login |
| Migration failed | Dirty schema | Run `dotnet ef database update` manually |
| High memory | Memory leak | Restart backend container |
