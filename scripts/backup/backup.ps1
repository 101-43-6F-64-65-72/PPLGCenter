# PostgreSQL Production Database Backup Script
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "./backups"
if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

$backupFile = "$backupDir/studentcenter_$timestamp.sql"
Write-Host "Creating database backup at $backupFile..."

# Execute pg_dump
docker exec -t studentcenter-db-1 pg_dump -U studentcenter studentcenter > $backupFile
Write-Host "Backup completed successfully!"
