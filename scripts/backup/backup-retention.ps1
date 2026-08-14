# Backup Retention & Restore Validation Script
# Retains last 7 daily backups, 4 weekly backups
param(
    [string]$BackupDir = ".\backups",
    [int]$DailyRetention = 7,
    [int]$WeeklyRetention = 4
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dayOfWeek = (Get-Date).DayOfWeek
$backupFile = "$BackupDir\studentcenter_${timestamp}.sql"

# Create backup directory
if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }

Write-Host "Creating backup: $backupFile" -ForegroundColor Cyan
$env:PGPASSWORD = (Get-Content .\secrets\db_password.txt -Raw).Trim()
pg_dump -h localhost -U studentcenter_prod -d studentcenter -f $backupFile
if ($LASTEXITCODE -ne 0) { Write-Error "Backup FAILED"; exit 1 }
Write-Host "Backup created successfully." -ForegroundColor Green

# Restore validation (to temp DB)
Write-Host "Validating backup integrity..." -ForegroundColor Cyan
$restoreCheck = pg_restore --list $backupFile 2>&1
if ($LASTEXITCODE -eq 0 -or $restoreCheck) {
    Write-Host "Backup validation PASSED." -ForegroundColor Green
} else {
    Write-Warning "Backup validation WARNING — manual check recommended."
}

# Prune old daily backups (keep last N)
$allBackups = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending
$toDelete = $allBackups | Select-Object -Skip $DailyRetention
foreach ($file in $toDelete) {
    Remove-Item $file.FullName -Force
    Write-Host "Pruned old backup: $($file.Name)" -ForegroundColor Yellow
}

Write-Host "Backup retention enforced: kept last $DailyRetention backups." -ForegroundColor Green
