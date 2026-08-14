$loginUrl = "http://localhost:5051/api/auth/login"
$body = @{
    identifier = "0088884444"
    password = "Siswa123!"
    loginType = "Student"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $body -ContentType "application/json"
    Write-Host "=== LOGIN RESPONSE ==="
    Write-Host "Success: $($loginRes.success)"
    Write-Host "Message: $($loginRes.message)"
    Write-Host "Token present: $([string]::IsNullOrWhiteSpace($loginRes.data.token) -eq $false)"
    Write-Host "User FullName: $($loginRes.data.user.fullName)"
    Write-Host "User ID: $($loginRes.data.user.id)"
    Write-Host "NISN: $($loginRes.data.user.nisn)"
    Write-Host "Memberships Count: $($loginRes.data.memberships.Count)"
    if ($loginRes.data.memberships) {
        $loginRes.data.memberships | Format-Table -AutoSize
    }

    $token = $loginRes.data.token
    $headers = @{ Authorization = "Bearer $token" }

    Write-Host "`n=== GET MY EXTRACURRICULARS ==="
    try {
        $myEk = Invoke-RestMethod -Uri "http://localhost:5051/api/extracurriculars/my" -Headers $headers
        Write-Host "My Extracurriculars TotalCount: $($myEk.data.totalCount)"
        $myEk.data.items | Select-Object id, name, category, currentMembers | Format-Table -AutoSize
    } catch {
        Write-Host "Error GET /api/extracurriculars/my: $_"
    }

    Write-Host "`n=== GET ALL EXTRACURRICULARS (OSIS Check) ==="
    $allEk = Invoke-RestMethod -Uri "http://localhost:5051/api/extracurriculars"
    $osis = $allEk.data.items | Where-Object { $_.name -like "*OSIS*" -or $_.category -like "*OSIS*" }
    Write-Host "OSIS Extracurricular:"
    $osis | Format-List

    Write-Host "`n=== GET OSIS MEMBERS ==="
    if ($osis) {
        try {
            $osisMembers = Invoke-RestMethod -Uri "http://localhost:5051/api/extracurriculars/$($osis.id)/members" -Headers $headers
            Write-Host "OSIS Members TotalCount: $($osisMembers.data.totalCount)"
            $osisMembers.data.items | Format-Table -AutoSize
        } catch {
            Write-Host "Error GET OSIS Members: $_"
        }
    }

} catch {
    Write-Host "Login error: $_"
}
