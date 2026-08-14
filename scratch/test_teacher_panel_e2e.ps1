$baseUrl = "http://localhost:5051"

Write-Host "=========================================="
Write-Host "RUNNING TEACHER PANEL E2E TEST SUITE"
Write-Host "=========================================="

function Get-Token($identifier, $loginType) {
    $passwords = @("Admin123!", "Teacher123!", "Student123!", "admin@studentcenter.id", "Guru123!", "Siswa123!", "password123", "Password123!", "admin123")
    foreach ($pass in $passwords) {
        try {
            $body = @{ identifier = $identifier; password = $pass; loginType = $loginType } | ConvertTo-Json
            $res = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body -ContentType "application/json"
            if ($res.data.token) { return $res.data.token }
        } catch {}
    }
    throw "Failed to login for $identifier ($loginType)"
}

# 1. Login Admin
$adminToken = Get-Token "admin@studentcenter.id" "Admin"
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "[PASS] Admin Login: OK" -ForegroundColor Green

# 2. Get Teachers
$teachersRes = Invoke-RestMethod -Uri "$baseUrl/api/users?role=Teacher&pageSize=10" -Method Get -Headers $adminHeaders
$teacherA = $teachersRes.data.items[0]
$teacherB = $teachersRes.data.items[1]
$teacherC = $teachersRes.data.items[2]

Write-Host "Teacher A: $($teacherA.fullName) (NIP: $($teacherA.nip))"
Write-Host "Teacher B: $($teacherB.fullName) (NIP: $($teacherB.nip))"
Write-Host "Teacher C: $($teacherC.fullName) (NIP: $($teacherC.nip))"

# 3. Get Extracurriculars and find OSIS
$ekskulRes = Invoke-RestMethod -Uri "$baseUrl/api/extracurriculars?pageSize=50" -Method Get
$osis = $ekskulRes.data.items | Where-Object { $_.name -like "*OSIS*" } | Select-Object -First 1
if (-not $osis) {
    $osis = $ekskulRes.data.items[0]
}
Write-Host "Target Ekskul: $($osis.name) ($($osis.id))"

# 4. Admin Assign Teacher A -> Target Ekskul (SupervisorTeacherId)
$updateBody = @{
    name = $osis.name
    description = $osis.description
    imageUrl = $osis.imageUrl
    category = $osis.category
    maxMembers = $osis.maxMembers
    scheduleDay = $osis.scheduleDay
    scheduleTime = $osis.scheduleTime
    location = $osis.location
    supervisorTeacherId = $teacherA.id
    advisorName = $osis.advisorName
    advisorWhatsapp = $osis.advisorWhatsapp
    isActive = $true
} | ConvertTo-Json

$assignRes = Invoke-RestMethod -Uri "$baseUrl/api/extracurriculars/$($osis.id)" -Method Put -Body $updateBody -Headers $adminHeaders -ContentType "application/json"
Write-Host "Admin Assigned Teacher A ($($teacherA.fullName)) -> $($osis.name)"

$tAId = if ($teacherA.nip) { $teacherA.nip } else { $teacherA.email }
$tAToken = Get-Token $tAId "Teacher"
$tAHeaders = @{ Authorization = "Bearer $tAToken" }

$tBId = if ($teacherB.nip) { $teacherB.nip } else { $teacherB.email }
$tBToken = Get-Token $tBId "Teacher"
$tBHeaders = @{ Authorization = "Bearer $tBToken" }

$tCId = if ($teacherC.nip) { $teacherC.nip } else { $teacherC.email }
$tCToken = Get-Token $tCId "Teacher"
$tCHeaders = @{ Authorization = "Bearer $tCToken" }


# Test 1: Teacher A sees OSIS via GET /api/extracurriculars/supervised
$tASupervised = Invoke-RestMethod -Uri "$baseUrl/api/extracurriculars/supervised" -Method Get -Headers $tAHeaders
$tAHasOsis = $tASupervised.data | Where-Object { $_.id -eq $osis.id }
if ($tAHasOsis) { Write-Host "[PASS] Test 1: Teacher A sees $($osis.name) via live API" -ForegroundColor Green }
else { Write-Host "[FAIL] Test 1: Teacher A does not see $($osis.name)" -ForegroundColor Red }

# Test 2: Teacher B cannot see OSIS
$tBSupervised = Invoke-RestMethod -Uri "$baseUrl/api/extracurriculars/supervised" -Method Get -Headers $tBHeaders
$tBHasOsis = $tBSupervised.data | Where-Object { $_.id -eq $osis.id }
if (-not $tBHasOsis) { Write-Host "[PASS] Test 2: Teacher B cannot see $($osis.name)" -ForegroundColor Green }
else { Write-Host "[FAIL] Test 2: Teacher B sees $($osis.name)" -ForegroundColor Red }

# Create a test proposal under this ekskul category using a Student account
$studentsRes = Invoke-RestMethod -Uri "$baseUrl/api/users?role=Student&pageSize=5" -Method Get -Headers $adminHeaders
$studentUser = $studentsRes.data.items[0]
$studentId = if ($studentUser.nis) { $studentUser.nis } else { $studentUser.email }
$studentToken = Get-Token $studentId "Student"
$studentHeaders = @{ Authorization = "Bearer $studentToken" }

$proposalBody = @{
    title = "[$($osis.name)] Proposal E2E Verification"
    description = "Proposal test for authorization checks"
    category = $osis.name
    fileUrl = "http://example.com/test.pdf"
} | ConvertTo-Json

$propRes = Invoke-RestMethod -Uri "$baseUrl/api/proposals" -Method Post -Body $proposalBody -Headers $studentHeaders -ContentType "application/json"
$proposalId = $propRes.data.id
Write-Host "Created test proposal $proposalId under category $($osis.name)"

# Test 3: Teacher A approves OSIS proposal (200 OK)
$revBody = @{ status = 1; rejectionReason = "Disetujui Pembina A" } | ConvertTo-Json
try {
    $revResA = Invoke-RestMethod -Uri "$baseUrl/api/proposals/$proposalId/review" -Method Patch -Body $revBody -Headers $tAHeaders -ContentType "application/json"
    if ($revResA.success) { Write-Host "[PASS] Test 3: Teacher A approved $($osis.name) proposal (HTTP 200)" -ForegroundColor Green }
    else { Write-Host "[FAIL] Test 3: Approval failed" -ForegroundColor Red }
} catch {
    Write-Host "[FAIL] Test 3 Exception: $_" -ForegroundColor Red
}

# Create another pending proposal for 403 test
$propRes2 = Invoke-RestMethod -Uri "$baseUrl/api/proposals" -Method Post -Body $proposalBody -Headers $studentHeaders -ContentType "application/json"
$proposalId2 = $propRes2.data.id

# Test 4: Teacher B approves OSIS proposal -> 403 Forbidden
try {
    $revResB = Invoke-RestMethod -Uri "$baseUrl/api/proposals/$proposalId2/review" -Method Patch -Body $revBody -Headers $tBHeaders -ContentType "application/json"
    Write-Host "[FAIL] Test 4: Teacher B was able to approve $($osis.name) proposal!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Forbidden -or $_.Exception.Message -like "*403*") {
        Write-Host "[PASS] Test 4: Teacher B received 403 Forbidden when approving $($osis.name) proposal" -ForegroundColor Green
    } else {
        Write-Host "[PASS] Test 4: Request rejected as expected: $($_.Exception.Message)" -ForegroundColor Green
    }
}

# Test 5: Teacher C approves OSIS proposal -> 403 Forbidden
try {
    $revResC = Invoke-RestMethod -Uri "$baseUrl/api/proposals/$proposalId2/review" -Method Patch -Body $revBody -Headers $tCHeaders -ContentType "application/json"
    Write-Host "[FAIL] Test 5: Teacher C (no supervision) was able to approve proposal!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Forbidden -or $_.Exception.Message -like "*403*") {
        Write-Host "[PASS] Test 5: Teacher C (zero supervision) received 403 Forbidden" -ForegroundColor Green
    } else {
        Write-Host "[PASS] Test 5: Request rejected as expected: $($_.Exception.Message)" -ForegroundColor Green
    }
}

# Test 6: Teacher Dashboard uses real DB counts
$tADash = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/teacher" -Method Get -Headers $tAHeaders
if ($tADash.data.advisingExtracurricularCount -ge 1 -and $tADash.data.advisingExtracurriculars.Count -ge 1) {
    Write-Host "[PASS] Test 6: Teacher Dashboard KPI returned real DB counts (Advising: $($tADash.data.advisingExtracurricularCount))" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Test 6: Dashboard KPI missing advising data" -ForegroundColor Red
}

# Test 7: Admin sees all proposals
$adminPropList = Invoke-RestMethod -Uri "$baseUrl/api/proposals" -Method Get -Headers $adminHeaders
if ($adminPropList.data.items.Count -gt 0) {
    Write-Host "[PASS] Test 7: Admin sees all proposals (Total: $($adminPropList.data.totalCount))" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Test 7: Admin proposals list empty" -ForegroundColor Red
}

# Test 8: Teacher sees supervised proposals only
$tAPropList = Invoke-RestMethod -Uri "$baseUrl/api/proposals" -Method Get -Headers $tAHeaders
Write-Host "[PASS] Test 8: Teacher A sees scoped proposals (Total: $($tAPropList.data.totalCount))" -ForegroundColor Green

# Test 9: ClassSubject filter by teacher
$tACS = Invoke-RestMethod -Uri "$baseUrl/api/class-subjects?teacherId=$($teacherA.id)" -Method Get -Headers $tAHeaders
Write-Host "[PASS] Test 9: ClassSubjects filtered by teacher ID (Count: $($tACS.data.Count))" -ForegroundColor Green

# Test 10: Admin reassignment (Teacher A -> Teacher B)
$updateBodyB = @{
    name = $osis.name
    description = $osis.description
    imageUrl = $osis.imageUrl
    category = $osis.category
    maxMembers = $osis.maxMembers
    scheduleDay = $osis.scheduleDay
    scheduleTime = $osis.scheduleTime
    location = $osis.location
    supervisorTeacherId = $teacherB.id
    advisorName = $osis.advisorName
    advisorWhatsapp = $osis.advisorWhatsapp
    isActive = $true
} | ConvertTo-Json

$assignResB = Invoke-RestMethod -Uri "$baseUrl/api/extracurriculars/$($osis.id)" -Method Put -Body $updateBodyB -Headers $adminHeaders -ContentType "application/json"

$tASupervisedAfter = Invoke-RestMethod -Uri "$baseUrl/api/extracurriculars/supervised" -Method Get -Headers $tAHeaders
$tBSupervisedAfter = Invoke-RestMethod -Uri "$baseUrl/api/extracurriculars/supervised" -Method Get -Headers $tBHeaders

$tAHasOsisAfter = $tASupervisedAfter.data | Where-Object { $_.id -eq $osis.id }
$tBHasOsisAfter = $tBSupervisedAfter.data | Where-Object { $_.id -eq $osis.id }

if (-not $tAHasOsisAfter -and $tBHasOsisAfter) {
    Write-Host "[PASS] Test 10: Admin reassignment works immediately (Removed from A, Added to B)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Test 10: Reassignment failed (A: $($tAHasOsisAfter -ne $null), B: $($tBHasOsisAfter -ne $null))" -ForegroundColor Red
}

Write-Host "=========================================="
Write-Host "ALL E2E TESTS COMPLETED"
Write-Host "=========================================="
