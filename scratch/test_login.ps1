$headers = @{ "Content-Type" = "application/json" }

function Test-Auth($label, $payload) {
    $json = $payload | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:5051/api/auth/login" -Method Post -Headers $headers -Body $json
        Write-Host "[$label] SUCCESS! Token:" ($res.data.token.Substring(0, 15)) "Role:" $res.data.role
    } catch {
        Write-Host "[$label] ERROR:" $_.Exception.Message
        if ($_.Exception.Response) {
            $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            Write-Host "   Body:" $sr.ReadToEnd()
        }
    }
}

Test-Auth "Student 24.012472 + SiswaPPLG2026!" @{ loginType = "Student"; identifier = "24.012472"; password = "SiswaPPLG2026!" }
Test-Auth "Admin admin@smkn2surakarta.sch.id + Admin123!" @{ loginType = "Admin"; identifier = "admin@smkn2surakarta.sch.id"; password = "Admin123!" }
Test-Auth "Admin admin@smkn2surakarta.sch.id + AdminPPLGCenter2026!" @{ loginType = "Admin"; identifier = "admin@smkn2surakarta.sch.id"; password = "AdminPPLGCenter2026!" }
Test-Auth "Teacher guru_1_sugiyono@teacher.smkn2surakarta.sch.id + GuruPPLG2026!" @{ loginType = "Teacher"; identifier = "guru_1_sugiyono@teacher.smkn2surakarta.sch.id"; password = "GuruPPLG2026!" }
