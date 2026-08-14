# PostgreSQL Production Database Restore Script
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFilePath
)

if (!(Test-Path $BackupFilePath)) {
    Write-Error "Backup file not found at $BackupFilePath"
    exit 1
}

Write-Host "Restoring database from $BackupFilePath..."
Get-Content $BackupFilePath | docker exec -i studentcenter-db-1 psql -U studentcenter -d studentcenter
Write-Host "Database restore completed successfully!"
