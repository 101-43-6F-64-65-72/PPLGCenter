# Production Rollback Script
Write-Host "Initiating Production Rollback..." -ForegroundColor Yellow

# 1. Stop production stack
docker-compose -f docker-compose.production.yml down

# 2. Restart previous stable container versions
docker-compose -f docker-compose.prod.yml up -d

Write-Host "Rollback completed successfully!" -ForegroundColor Green
