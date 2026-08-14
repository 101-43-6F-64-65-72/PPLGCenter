# Production Deployment Script
Write-Host "Starting Production Deployment for StudentCenter..." -ForegroundColor Green

# 1. Pull latest code & build containers
docker-compose -f docker-compose.production.yml build --no-cache

# 2. Deploy services
docker-compose -f docker-compose.production.yml up -d

Write-Host "Production deployment completed successfully!" -ForegroundColor Green
