using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class UserImportService : IUserImportService
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;

    public UserImportService(AppDbContext context)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<ImportSummaryResponse> ImportStudentsCsvAsync(string csvContent)
    {
        var summary = new ImportSummaryResponse();
        if (string.IsNullOrWhiteSpace(csvContent))
        {
            summary.Errors.Add("CSV content is empty.");
            return summary;
        }

        var lines = csvContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length <= 1)
        {
            summary.Errors.Add("CSV file contains no data rows.");
            return summary;
        }

        // Header parsing
        var header = ParseCsvLine(lines[0]);
        var colMap = header.Select((h, i) => new { Name = h.Trim().ToLower(), Index = i })
                           .ToDictionary(x => x.Name, x => x.Index);

        // Pre-fetch departments and classes for fast lookup
        var departments = await _context.Departments.AsNoTracking().ToListAsync();
        var classes = await _context.SchoolClasses.AsNoTracking().ToListAsync();

        var existingNis = await _context.Users.Where(u => u.NIS != null).Select(u => u.NIS!.ToLower()).ToHashSetAsync();
        var existingNisn = await _context.Users.Where(u => u.NISN != null).Select(u => u.NISN!.ToLower()).ToHashSetAsync();
        var existingEmails = await _context.Users.Select(u => u.Email.ToLower()).ToHashSetAsync();

        var batchNis = new HashSet<string>();
        var batchNisn = new HashSet<string>();
        var batchEmails = new HashSet<string>();

        var newUsers = new List<User>();

        for (int i = 1; i < lines.Length; i++)
        {
            summary.TotalRead++;
            var row = ParseCsvLine(lines[i]);
            if (row.All(string.IsNullOrWhiteSpace)) continue;

            string GetVal(string colName) => colMap.TryGetValue(colName, out var idx) && idx < row.Count ? row[idx].Trim() : string.Empty;

            var fullName = GetVal("nama");
            if (string.IsNullOrWhiteSpace(fullName)) fullName = GetVal("nama siswa");
            if (string.IsNullOrWhiteSpace(fullName)) fullName = GetVal("nama lengkap");

            var nis = GetVal("nis");
            var nisn = GetVal("nisn");
            var deptStr = GetVal("jurusan");
            var classStr = GetVal("kelas");
            var email = GetVal("email");
            var phone = GetVal("hp");
            var gender = GetVal("gender");
            var birthStr = GetVal("tanggal lahir");
            var address = GetVal("alamat");
            var studentNumStr = GetVal("nomor absen");
            var password = GetVal("password");

            if (string.IsNullOrWhiteSpace(fullName))
            {
                summary.FailedCount++;
                summary.Errors.Add($"Row {i + 1}: Nama is required.");
                continue;
            }

            // Validate Kelas exists
            var schoolClass = classes.FirstOrDefault(c =>
                c.Name.Equals(classStr, StringComparison.OrdinalIgnoreCase));
            if (schoolClass == null)
            {
                summary.FailedCount++;
                summary.Errors.Add($"Row {i + 1}: Kelas '{classStr}' does not exist in master data.");
                continue;
            }

            // Validate Jurusan exists
            var dept = string.IsNullOrWhiteSpace(deptStr)
                ? departments.FirstOrDefault(d => d.Id == schoolClass.DepartmentId)
                : departments.FirstOrDefault(d =>
                    d.Code.Equals(deptStr, StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Equals(deptStr, StringComparison.OrdinalIgnoreCase));

            if (dept == null)
            {
                summary.FailedCount++;
                summary.Errors.Add($"Row {i + 1}: Jurusan '{deptStr}' does not exist in master data.");
                continue;
            }

            // Check duplicate NIS
            if (!string.IsNullOrWhiteSpace(nis))
            {
                var nisLower = nis.ToLower();
                if (existingNis.Contains(nisLower) || batchNis.Contains(nisLower))
                {
                    summary.SkippedCount++;
                    summary.Errors.Add($"Row {i + 1}: Skipped duplicate NIS '{nis}'.");
                    continue;
                }
                batchNis.Add(nisLower);
            }

            // Check duplicate NISN
            if (!string.IsNullOrWhiteSpace(nisn))
            {
                var nisnLower = nisn.ToLower();
                if (existingNisn.Contains(nisnLower) || batchNisn.Contains(nisnLower))
                {
                    summary.SkippedCount++;
                    summary.Errors.Add($"Row {i + 1}: Skipped duplicate NISN '{nisn}'.");
                    continue;
                }
                batchNisn.Add(nisnLower);
            }

            // Fallback email if empty
            if (string.IsNullOrWhiteSpace(email))
            {
                var prefix = !string.IsNullOrWhiteSpace(nis) ? nis : Guid.NewGuid().ToString("N")[..8];
                email = $"{prefix}@student.smkn2surakarta.sch.id";
            }

            if (existingEmails.Contains(email.ToLower()) || batchEmails.Contains(email.ToLower()))
            {
                email = $"{Guid.NewGuid().ToString("N")[..6]}_{email}";
            }
            batchEmails.Add(email.ToLower());

            DateTime? birthDate = null;
            if (DateTime.TryParse(birthStr, out var parsedBirth)) birthDate = parsedBirth;

            int? studentNumber = null;
            if (int.TryParse(studentNumStr, out var parsedNum)) studentNumber = parsedNum;

            var defaultPassword = string.IsNullOrWhiteSpace(password) ? "Siswa123!" : password;

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = fullName,
                NIS = string.IsNullOrWhiteSpace(nis) ? null : nis,
                NISN = string.IsNullOrWhiteSpace(nisn) ? null : nisn,
                ClassId = schoolClass.Id,
                Email = email,
                PhoneNumber = string.IsNullOrWhiteSpace(phone) ? null : phone,
                Gender = string.IsNullOrWhiteSpace(gender) ? null : gender,
                BirthDate = birthDate,
                Address = string.IsNullOrWhiteSpace(address) ? null : address,
                StudentNumber = studentNumber,
                Role = UserRole.Student,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, defaultPassword);
            newUsers.Add(user);
            summary.SuccessCount++;
        }

        if (newUsers.Any())
        {
            _context.Users.AddRange(newUsers);
            await _context.SaveChangesAsync();
        }

        return summary;
    }

    public async Task<ImportSummaryResponse> ImportTeachersCsvAsync(string csvContent)
    {
        var summary = new ImportSummaryResponse();
        if (string.IsNullOrWhiteSpace(csvContent))
        {
            summary.Errors.Add("CSV content is empty.");
            return summary;
        }

        var lines = csvContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length <= 1)
        {
            summary.Errors.Add("CSV file contains no data rows.");
            return summary;
        }

        var header = ParseCsvLine(lines[0]);
        var colMap = header.Select((h, i) => new { Name = h.Trim().ToLower(), Index = i })
                           .ToDictionary(x => x.Name, x => x.Index);

        var existingNip = await _context.Users.Where(u => u.NIP != null).Select(u => u.NIP!.ToLower()).ToHashSetAsync();
        var existingEmails = await _context.Users.Select(u => u.Email.ToLower()).ToHashSetAsync();

        var batchNip = new HashSet<string>();
        var batchEmails = new HashSet<string>();

        var newUsers = new List<User>();

        for (int i = 1; i < lines.Length; i++)
        {
            summary.TotalRead++;
            var row = ParseCsvLine(lines[i]);
            if (row.All(string.IsNullOrWhiteSpace)) continue;

            string GetVal(string colName) => colMap.TryGetValue(colName, out var idx) && idx < row.Count ? row[idx].Trim() : string.Empty;

            var fullName = GetVal("nama");
            if (string.IsNullOrWhiteSpace(fullName)) fullName = GetVal("nama lengkap");
            if (string.IsNullOrWhiteSpace(fullName)) fullName = GetVal("nama guru");

            var nip = GetVal("nip");
            if (string.IsNullOrWhiteSpace(nip) || nip == "-") nip = GetVal("kode guru");
            var email = GetVal("email");
            var phone = GetVal("hp");
            var address = GetVal("alamat");
            var gender = GetVal("gender");
            var birthStr = GetVal("tanggal lahir");
            var position = GetVal("position");
            var password = GetVal("password");

            if (string.IsNullOrWhiteSpace(fullName))
            {
                summary.FailedCount++;
                summary.Errors.Add($"Row {i + 1}: Nama is required.");
                continue;
            }

            // Check duplicate NIP
            if (!string.IsNullOrWhiteSpace(nip))
            {
                var nipLower = nip.ToLower();
                if (existingNip.Contains(nipLower) || batchNip.Contains(nipLower))
                {
                    summary.SkippedCount++;
                    summary.Errors.Add($"Row {i + 1}: Skipped duplicate NIP '{nip}'.");
                    continue;
                }
                batchNip.Add(nipLower);
            }

            // Fallback email if empty
            if (string.IsNullOrWhiteSpace(email))
            {
                var prefix = !string.IsNullOrWhiteSpace(nip) ? nip : Guid.NewGuid().ToString("N")[..8];
                email = $"{prefix}@teacher.smkn2surakarta.sch.id";
            }

            if (existingEmails.Contains(email.ToLower()) || batchEmails.Contains(email.ToLower()))
            {
                email = $"{Guid.NewGuid().ToString("N")[..6]}_{email}";
            }
            batchEmails.Add(email.ToLower());

            DateTime? birthDate = null;
            if (DateTime.TryParse(birthStr, out var parsedBirth)) birthDate = parsedBirth;

            var defaultPassword = string.IsNullOrWhiteSpace(password) ? "Guru123!" : password;

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = fullName,
                NIP = string.IsNullOrWhiteSpace(nip) ? null : nip,
                Email = email,
                PhoneNumber = string.IsNullOrWhiteSpace(phone) ? null : phone,
                Address = string.IsNullOrWhiteSpace(address) ? null : address,
                Gender = string.IsNullOrWhiteSpace(gender) ? null : gender,
                BirthDate = birthDate,
                Position = string.IsNullOrWhiteSpace(position) ? "Guru" : position,
                Role = UserRole.Teacher,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, defaultPassword);
            newUsers.Add(user);
            summary.SuccessCount++;
        }

        if (newUsers.Any())
        {
            _context.Users.AddRange(newUsers);
            await _context.SaveChangesAsync();
        }

        return summary;
    }

    public async Task<byte[]> ExportStudentsCsvAsync(Guid? classId = null, Guid? departmentId = null)
    {
        var query = _context.Users
            .AsNoTracking()
            .Include(u => u.Class)
                .ThenInclude(c => c!.Department)
            .Where(u => u.Role == UserRole.Student)
            .AsQueryable();

        if (classId.HasValue)
            query = query.Where(u => u.ClassId == classId.Value);

        if (departmentId.HasValue)
            query = query.Where(u => u.Class != null && u.Class.DepartmentId == departmentId.Value);

        var students = await query.OrderBy(u => u.FullName).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Nama,NIS,NISN,Jurusan,Kelas,Email,HP,Gender,Tanggal Lahir,Alamat,Nomor Absen");

        foreach (var s in students)
        {
            var birth = s.BirthDate.HasValue ? s.BirthDate.Value.ToString("yyyy-MM-dd") : "";
            sb.AppendLine($"\"{EscapeCsv(s.FullName)}\",\"{s.NIS}\",\"{s.NISN}\",\"{s.Class?.Department?.Code}\",\"{s.Class?.Name}\",\"{s.Email}\",\"{s.PhoneNumber}\",\"{s.Gender}\",\"{birth}\",\"{EscapeCsv(s.Address ?? "")}\",\"{s.StudentNumber}\"");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var sb = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    sb.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(sb.ToString().Trim());
                sb.Clear();
            }
            else
            {
                sb.Append(c);
            }
        }
        result.Add(sb.ToString().Trim());
        return result;
    }

    private static string EscapeCsv(string str)
    {
        if (string.IsNullOrEmpty(str)) return "";
        return str.Replace("\"", "\"\"");
    }
}
