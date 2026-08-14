# Load backend/.env if present and DATABASE_URL is not set
if (-not $env:DATABASE_URL -and (Test-Path "backend/.env")) {
    Get-Content "backend/.env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split('=', 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $val = $parts[1].Trim().Trim('"').Trim("'")
                if (-not (Test-Path "env:$key")) {
                    Set-Item "env:$key" $val
                }
            }
        }
    }
}

if (-not $env:JWT_ISSUER) { $env:JWT_ISSUER = "PPLGCenter" }
if (-not $env:JWT_AUDIENCE) { $env:JWT_AUDIENCE = "PPLGCenterApp" }
if (-not $env:CORS__AllowedOrigins) { $env:CORS__AllowedOrigins = "http://localhost:3000" }

$requiredVars = @("DATABASE_URL", "JWT_SECRET")
foreach ($var in $requiredVars) {
    if (-not (Test-Path "env:$var")) {
        Write-Error "Required environment variable $var is missing. Please set it in backend/.env or process environment."
        exit 1
    }
}

Start-Process dotnet -ArgumentList "run --project backend/StudentCenter.Api --launch-profile http" -NoNewWindow
Start-Sleep -Seconds 10

$healthCheckUrl = "http://localhost:5051/health"
$maxRetries = 12
$retryCount = 0
$healthy = $false

while ($retryCount -lt $maxRetries -and -not $healthy) {
    try {
        $response = Invoke-WebRequest -Uri $healthCheckUrl -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            Write-Host "Backend is healthy!"
        }
    } catch {
        Write-Host "Waiting for backend... (attempt $($retryCount + 1))"
        Start-Sleep -Seconds 5
        $retryCount++
    }
}

if (-not $healthy) {
    Write-Error "Backend failed to become healthy. Please check logs."
    exit 1
}
