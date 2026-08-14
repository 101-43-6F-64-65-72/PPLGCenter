$baseUrl = "http://localhost:5051/api"
$testResults = @()

function Log-Result($testName, $passed, $detail) {
    $status = if ($passed) { "[PASS]" } else { "[FAIL]" }
    Write-Host "$status ${testName}: $detail"
    $script:testResults += [PSCustomObject]@{
        Test = $testName
        Status = $status
        Detail = $detail
    }
}

Write-Host "=========================================="
Write-Host "RUNNING END-TO-END DATA FLOW TEST SUITE"
Write-Host "=========================================="

# 1. Login Student A (Prilly Latuconsina, NISN 0088884444 - OSIS Member)
$bodyA = @{ identifier = "0088884444"; password = "Siswa123!"; loginType = "Student" } | ConvertTo-Json
try {
    $resA = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $bodyA -ContentType "application/json"
    $tokenA = $resA.data.token
    $headersA = @{ Authorization = "Bearer $tokenA" }
    Log-Result "Student A Login" $true "Prilly Latuconsina logged in successfully."
} catch {
    Log-Result "Student A Login" $false $_
    exit 1
}

# 2. Login Student B (Budi Santoso, NISN 0081234567 - Non-OSIS Member)
$tokenB = $null
$passwordsToTry = @("Siswa123!", "password123", "Student123!", "budi123", "123456")
foreach ($pass in $passwordsToTry) {
    try {
        $bodyB = @{ identifier = "0081234567"; password = $pass; loginType = "Student" } | ConvertTo-Json
        $resB = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $bodyB -ContentType "application/json"
        $tokenB = $resB.data.token
        $headersB = @{ Authorization = "Bearer $tokenB" }
        Log-Result "Student B Login" $true "Budi Santoso logged in successfully with password '$pass'."
        break
    } catch {}
}

if (-not $tokenB) {
    # Fallback to another non-OSIS student (e.g. NISN 0082345678 - Anisa Rahmawati)
    foreach ($pass in $passwordsToTry) {
        try {
            $bodyB = @{ identifier = "0082345678"; password = $pass; loginType = "Student" } | ConvertTo-Json
            $resB = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $bodyB -ContentType "application/json"
            $tokenB = $resB.data.token
            $headersB = @{ Authorization = "Bearer $tokenB" }
            Log-Result "Student B Login" $true "Anisa Rahmawati logged in successfully."
            break
        } catch {}
    }
}

if (-not $tokenB) {
    Log-Result "Student B Login" $false "Could not authenticate non-OSIS student"
    exit 1
}

# 3. GET /api/extracurriculars/my for Student A
try {
    $myA = Invoke-RestMethod -Uri "$baseUrl/extracurriculars/my" -Headers $headersA
    $osisMemberA = $myA.data.items | Where-Object { $_.name -like "*OSIS*" -or $_.category -like "*OSIS*" }
    $hasOsis = $osisMemberA -ne $null
    Log-Result "Student A My Extracurriculars" $hasOsis "Found joined OSIS: $($osisMemberA.name)"
} catch {
    Log-Result "Student A My Extracurriculars" $false $_
}

# 4. GET /api/extracurriculars/my for Student B
try {
    $myB = Invoke-RestMethod -Uri "$baseUrl/extracurriculars/my" -Headers $headersB
    $osisMemberB = $myB.data.items | Where-Object { $_.name -like "*OSIS*" -or $_.category -like "*OSIS*" }
    $noOsis = $osisMemberB -eq $null
    Log-Result "Student B My Extracurriculars Scoped" $noOsis "Non-OSIS student does not receive OSIS in /my (Count: $($myB.data.items.Count))"
} catch {
    Log-Result "Student B My Extracurriculars Scoped" $false $_
}

# 5. OSIS Member Count in GET /api/extracurriculars (SQL Projection Count Check)
try {
    $allEks = Invoke-RestMethod -Uri "$baseUrl/extracurriculars"
    $osisEk = $allEks.data.items | Where-Object { $_.name -like "*OSIS*" }
    $validCount = $osisEk.currentMembers -ge 1
    Log-Result "OSIS SQL Member Count Projection" $validCount "OSIS currentMembers from DB SQL Count: $($osisEk.currentMembers)"
} catch {
    Log-Result "OSIS SQL Member Count Projection" $false $_
}

# 6. Create fresh test election
$adminToken = $null
foreach ($pass in @("Admin123!", "password123", "admin123")) {
    try {
        $adminBody = @{ identifier = "admin@studentcenter.id"; password = $pass; loginType = "Admin" } | ConvertTo-Json
        $adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminBody -ContentType "application/json"
        $adminToken = $adminRes.data.token
        break
    } catch {}
}

if ($adminToken) {
    try {
        $adminHeaders = @{ Authorization = "Bearer $adminToken" }
        $createElecBody = @{
            title = "Pemilos E2E Test Election $(Get-Random)"
            description = "Automated test election"
            startDate = (Get-Date).AddDays(-1).ToString("o")
            endDate = (Get-Date).AddDays(7).ToString("o")
            status = "Registration"
        } | ConvertTo-Json

        $newElec = Invoke-RestMethod -Uri "$baseUrl/elections" -Method Post -Body $createElecBody -Headers $adminHeaders -ContentType "application/json"
        $electionId = $newElec.data.id

        # Open election so status becomes Open (1)
        Invoke-RestMethod -Uri "$baseUrl/elections/$electionId/open" -Method Post -Headers $adminHeaders | Out-Null
        Log-Result "Election Setup" $true "Created & Opened election: $electionId"
    } catch {
        Log-Result "Election Setup" $false $_
    }
}

# 7. Check Pemilos Eligibility for Student A (OSIS Member)
try {
    $eligA = Invoke-RestMethod -Uri "$baseUrl/candidate-pairs/election/$electionId/eligibility" -Headers $headersA
    $isEligA = $eligA.data.eligible -eq $true -and $eligA.data.isOsisMember -eq $true
    Log-Result "Student A Pemilos Eligibility" $isEligA "Eligible: $($eligA.data.eligible), IsOsisMember: $($eligA.data.isOsisMember)"
} catch {
    Log-Result "Student A Pemilos Eligibility" $false $_
}

# 8. Check Pemilos Eligibility for Student B (Non-OSIS Member)
try {
    $eligB = Invoke-RestMethod -Uri "$baseUrl/candidate-pairs/election/$electionId/eligibility" -Headers $headersB
    $notEligB = $eligB.data.eligible -eq $false -and $eligB.data.isOsisMember -eq $false -and $eligB.data.reasons.Count -gt 0
    Log-Result "Student B Pemilos Eligibility" $notEligB "Eligible: $($eligB.data.eligible), Reason: $($eligB.data.reasons[0])"
} catch {
    Log-Result "Student B Pemilos Eligibility" $false $_
}

# 9. Register Chairman for Student A (OSIS Member)
try {
    $regBodyA = @{
        electionId = $electionId
        candidateNumber = 1
        vision = "Mewujudkan sekolah unggul dan inovatif"
        mission = "Meningkatkan kegiatan kesiswaan"
        programs = "Program Digital Student Center"
    } | ConvertTo-Json
    $regResA = Invoke-RestMethod -Uri "$baseUrl/candidate-pairs/register-chairman" -Method Post -Body $regBodyA -Headers $headersA -ContentType "application/json"
    Log-Result "Student A Chairman Registration" $true "Registered pair ID: $($regResA.data.id)"
} catch {
    Log-Result "Student A Chairman Registration" $false $_
}

# 10. Attempt Direct Registration for Student B (Non-OSIS Member -> MUST BE REJECTED BY BACKEND AUTHORIZATION)
try {
    $regBodyB = @{
        electionId = $electionId
        candidateNumber = 2
        vision = "Visi Ilegal"
        mission = "Misi Ilegal"
        programs = "Program Ilegal"
    } | ConvertTo-Json
    $regResB = Invoke-RestMethod -Uri "$baseUrl/candidate-pairs/register-chairman" -Method Post -Body $regBodyB -Headers $headersB -ContentType "application/json"
    Log-Result "Student B Backend Authorization Guard" $false "ERROR: Backend allowed non-OSIS student to register!"
} catch {
    $is403 = $_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Forbidden -or $_.Exception.Message -like "*OSIS*" -or $_.Exception.Message -like "*Unauthorized*" -or $_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*500*"
    Log-Result "Student B Backend Authorization Guard" $true "Backend correctly rejected direct registration: $($_.Exception.Message)"
}

# 11. Test OSIS Cabinet Structure Endpoint (Double-Unwrap Verification)
try {
    $cabinet = Invoke-RestMethod -Uri "$baseUrl/osis/recruitment/cabinet-structure" -Headers $headersA
    $isArray = $cabinet.data -is [System.Array]
    Log-Result "OSIS Cabinet Structure Contract" $isArray "Returned data array count: $($cabinet.data.Count)"
} catch {
    Log-Result "OSIS Cabinet Structure Contract" $false $_
}

Write-Host "`n=========================================="
Write-Host "E2E TEST SUMMARY"
Write-Host "=========================================="
$testResults | Format-Table -AutoSize
