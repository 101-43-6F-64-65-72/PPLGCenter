if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "Host=localhost;Port=5432;Database=studentcenter;Username=studentcenter;Password=sc_test_pw_2026"
}
$env:JWT_SECRET="akjhgfdrtyjnmnbytghytfvbnjykbrcr"
$env:JWT_ISSUER="StudentCenter"
$env:JWT_AUDIENCE="StudentCenterApp"
$env:JWT_EXPIRATION_MINUTES="60"
$env:CORS__AllowedOrigins="http://localhost:3000"
$env:DEFAULT_ADMIN_PASSWORD="admin1234"

$requiredVars = @("DATABASE_URL", "JWT_SECRET")
foreach ($var in $requiredVars) {
    if (-not (Test-Path "env:\$var")) {
        Write-Error "Required environment variable $var is missing."
        exit 1
    }
}

Start-Process dotnet -ArgumentList "run --project backend/StudentCenter.Api --launch-profile http" -NoNewWindow
Start-Sleep -Seconds 10

$healthCheckUrl = "http://localhost:5051/health"
$maxRetries = 5
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
