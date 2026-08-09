using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Infrastructure.Data.Seeders;

public static class OperationDataSeeder
{
    private static readonly PasswordHasher<User> PasswordHasher = new();

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetService<ILogger<AppDbContext>>();

        if (await context.ExtracurricularMembers.AnyAsync())
        {
            return;
        }

        // ── 1. Subjects (14 Mapel SMK Realistis) ─────────────────────────────
        var defaultSubjects = new List<(string Code, string Name, string Description)>
        {
            ("RPL-KDD", "Pemrograman Dasar", "Dasar logika pemrograman, variabel, dan algoritma"),
            ("RPL-WEB", "Pemrograman Web & Perangkat Bergerak", "Pengembangan aplikasi web modern & mobile"),
            ("RPL-BDAT", "Sistem Basis Data", "Manajemen Sistem Basis Data Relasional & SQL"),
            ("RPL-PBO", "Pemrograman Berbasis Objek", "Pemrograman Berorientasi Objek (C# & Java)"),
            ("TKJ-JARKOM", "Jaringan Komputer", "Dasar Jaringan Komputer & Infrastruktur Routing"),
            ("AKL-AKUN", "Akuntansi Dasar & Keuangan", "Prinsip akuntansi dan pembukuan keuangan lembaga"),
            ("MTK", "Matematika Terapan SMK", "Mata pelajaran Matematika Terapan SMK"),
            ("BIND", "Bahasa Indonesia", "Komunikasi ilmiah dan bahasa Indonesia"),
            ("BING", "Bahasa Inggris Komunikasi Teknis", "Bahasa Inggris untuk profesi dan dunia kerja"),
            ("PKK", "Projek Kreatif & Kewirausahaan", "Kewirausahaan dan pembuatan produk kreatif siswa"),
            ("PAI", "Pendidikan Agama Islam", "Pendidikan Agama & Budi Pekerti Islam"),
            ("PJOK", "Pendidikan Jasmani & Olahraga", "Pendidikan Jasmani, Olahraga, & Kesehatan"),
            ("DKV-DESAIN", "Desain Grafis & UI/UX", "Pembuatan desain komunikasi visual dan antarmuka"),
            ("RPL-AI", "Kecerdasan Buatan & Data", "Pengenalan AI, Machine Learning, dan analitika data")
        };

        foreach (var sub in defaultSubjects)
        {
            var codeUpper = sub.Code.ToUpper();
            if (!await context.Subjects.AnyAsync(s => s.Code.ToUpper() == codeUpper))
            {
                context.Subjects.Add(new Subject
                {
                    Id = Guid.NewGuid(),
                    Code = codeUpper,
                    Name = sub.Name,
                    Description = sub.Description,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }
        await context.SaveChangesAsync();

        // ── 2. Teachers (10 Guru Realistis) ──────────────────────────────────
        var teacherDefs = new[]
        {
            (NIP: "198907102015021001", Name: "Dr. Ahmad Hidayat M.Pd.", Email: "ahmad.hidayat@teacher.smkn2surakarta.sch.id", SubjectCode: "RPL-KDD", Position: "Guru Utama RPL"),
            (NIP: "199103152018032002", Name: "Siti Nurhaliza S.Kom.", Email: "siti.nurhaliza@teacher.smkn2surakarta.sch.id", SubjectCode: "RPL-WEB", Position: "Guru Pemrograman Web"),
            (NIP: "198511202010011003", Name: "Bambang Susilo M.Kom.", Email: "bambang.susilo@teacher.smkn2surakarta.sch.id", SubjectCode: "RPL-BDAT", Position: "Wali Kelas X RPL 1"),
            (NIP: "199305042020122004", Name: "Dewi Lestari S.T.", Email: "dewi.lestari@teacher.smkn2surakarta.sch.id", SubjectCode: "TKJ-JARKOM", Position: "Guru Jaringan Komputer"),
            (NIP: "198708122014021005", Name: "Eko Prasetyo S.Pd.", Email: "eko.prasetyo@teacher.smkn2surakarta.sch.id", SubjectCode: "MTK", Position: "Guru Matematika"),
            (NIP: "199009182017042006", Name: "Fitri Handayani M.Pd.", Email: "fitri.handayani@teacher.smkn2surakarta.sch.id", SubjectCode: "BIND", Position: "Guru Bahasa Indonesia"),
            (NIP: "198602252011011007", Name: "Gunawan Wibowo S.Pd.", Email: "gunawan.wibowo@teacher.smkn2surakarta.sch.id", SubjectCode: "BING", Position: "Guru Bahasa Inggris"),
            (NIP: "199401102022032008", Name: "Hany Rahmawati S.SE.", Email: "hany.rahmawati@teacher.smkn2surakarta.sch.id", SubjectCode: "PKK", Position: "Guru PKK & Akuntansi"),
            (NIP: "198806302016021009", Name: "Irfan Maulana S.Ag.", Email: "irfan.maulana@teacher.smkn2surakarta.sch.id", SubjectCode: "PAI", Position: "Guru Agama Islam"),
            (NIP: "199212052019031010", Name: "Joko Widodo S.Or.", Email: "joko.widodo@teacher.smkn2surakarta.sch.id", SubjectCode: "PJOK", Position: "Guru Olahraga & PJOK")
        };

        var teacherUsers = new Dictionary<string, User>();

        foreach (var t in teacherDefs)
        {
            var teacher = await context.Users.FirstOrDefaultAsync(u => u.NIP == t.NIP || u.Email.ToLower() == t.Email.ToLower());
            if (teacher is null)
            {
                teacher = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = t.Name,
                    NIP = t.NIP,
                    Email = t.Email,
                    Username = t.Email.Split('@')[0],
                    Role = UserRole.Teacher,
                    Position = t.Position,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                teacher.PasswordHash = PasswordHasher.HashPassword(teacher, "Guru123!");
                context.Users.Add(teacher);
            }
            teacherUsers[t.NIP] = teacher;
        }
        await context.SaveChangesAsync();

        // Assign Homeroom Teacher for X RPL 1
        var xRpl1Class = await context.SchoolClasses.FirstOrDefaultAsync(c => c.Name == "X RPL 1");
        if (xRpl1Class != null && teacherUsers.TryGetValue("198511202010011003", out var homeroomTeacher))
        {
            xRpl1Class.HomeroomTeacherId = homeroomTeacher.Id;
            await context.SaveChangesAsync();
        }

        // ── 3. TeacherSubjects Mapping ────────────────────────────────────────
        foreach (var t in teacherDefs)
        {
            if (!teacherUsers.TryGetValue(t.NIP, out var teacher)) continue;
            var subject = await context.Subjects.FirstOrDefaultAsync(s => s.Code == t.SubjectCode);
            if (subject is null) continue;

            var exists = await context.TeacherSubjects
                .AnyAsync(ts => ts.TeacherId == teacher.Id && ts.SubjectId == subject.Id);

            if (!exists)
            {
                context.TeacherSubjects.Add(new TeacherSubject
                {
                    Id = Guid.NewGuid(),
                    TeacherId = teacher.Id,
                    SubjectId = subject.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
        await context.SaveChangesAsync();

        // ── 4. Students (42 Siswa Realistis across Classes) ─────────────────
        var targetClasses = await context.SchoolClasses.ToListAsync();
        var defaultClass = targetClasses.FirstOrDefault(c => c.Name == "X RPL 1") ?? targetClasses.FirstOrDefault();

        if (defaultClass != null)
        {
            var rpl1 = targetClasses.FirstOrDefault(c => c.Name == "X RPL 1") ?? defaultClass;
            var rpl2 = targetClasses.FirstOrDefault(c => c.Name == "X RPL 2") ?? defaultClass;
            var xiRpl1 = targetClasses.FirstOrDefault(c => c.Name == "XI RPL 1") ?? defaultClass;
            var xiiRpl1 = targetClasses.FirstOrDefault(c => c.Name == "XII RPL 1") ?? defaultClass;
            var tkj1 = targetClasses.FirstOrDefault(c => c.Name == "X TKJ 1") ?? defaultClass;
            var akl1 = targetClasses.FirstOrDefault(c => c.Name == "X AKL 1") ?? defaultClass;

            var studentSeedData = new List<(string NIS, string NISN, string Name, string Email, SchoolClass Class, int Absen)>
            {
                ("2310001", "0081234567", "Budi Santoso", "budi.santoso@student.smkn2surakarta.sch.id", rpl1, 1),
                ("2310002", "0082345678", "Anisa Rahmawati", "anisa.rahmawati@student.smkn2surakarta.sch.id", rpl1, 2),
                ("2310003", "0083456789", "Candra Wijaya", "candra.wijaya@student.smkn2surakarta.sch.id", rpl1, 3),
                ("2310004", "0084567890", "Dian Kusuma", "dian.kusuma@student.smkn2surakarta.sch.id", rpl1, 4),
                ("2310005", "0085678901", "Eka Pratama", "eka.pratama@student.smkn2surakarta.sch.id", rpl1, 5),
                ("2310006", "0086789012", "Fani Febrianti", "fani.febrianti@student.smkn2surakarta.sch.id", rpl1, 6),
                ("2310007", "0087890123", "Gilang Ramadhan", "gilang.ramadhan@student.smkn2surakarta.sch.id", rpl1, 7),
                ("2310008", "0088901234", "Hendra Setiawan", "hendra.setiawan@student.smkn2surakarta.sch.id", rpl1, 8),
                ("2310009", "0089012345", "Indah Permata", "indah.permata@student.smkn2surakarta.sch.id", rpl1, 9),
                ("2310010", "0080123456", "Jefri Kurniawan", "jefri.kurniawan@student.smkn2surakarta.sch.id", rpl1, 10),

                ("2310011", "0081112223", "Kiki Amelia", "kiki.amelia@student.smkn2surakarta.sch.id", rpl2, 1),
                ("2310012", "0082223334", "Lukman Hakim", "lukman.hakim@student.smkn2surakarta.sch.id", rpl2, 2),
                ("2310013", "0083334445", "Maya Safitri", "maya.safitri@student.smkn2surakarta.sch.id", rpl2, 3),
                ("2310014", "0084445556", "Naufal Rizky", "naufal.rizky@student.smkn2surakarta.sch.id", rpl2, 4),
                ("2310015", "0085556667", "Olivia Putri", "olivia.putri@student.smkn2surakarta.sch.id", rpl2, 5),
                ("2310016", "0086667778", "Panji Utomo", "panji.utomo@student.smkn2surakarta.sch.id", rpl2, 6),
                ("2310017", "0087778889", "Qori Maharani", "qori.maharani@student.smkn2surakarta.sch.id", rpl2, 7),
                ("2310018", "0088889990", "Rian Hidayat", "rian.hidayat@student.smkn2surakarta.sch.id", rpl2, 8),

                ("2210001", "0071234567", "Siska Wardani", "siska.wardani@student.smkn2surakarta.sch.id", xiRpl1, 1),
                ("2210002", "0072345678", "Tegar Prasetya", "tegar.prasetya@student.smkn2surakarta.sch.id", xiRpl1, 2),
                ("2210003", "0073456789", "Umar Faruq", "umar.faruq@student.smkn2surakarta.sch.id", xiRpl1, 3),
                ("2210004", "0074567890", "Vina Melati", "vina.melati@student.smkn2surakarta.sch.id", xiRpl1, 4),
                ("2210005", "0075678901", "Wahyu Nugroho", "wahyu.nugroho@student.smkn2surakarta.sch.id", xiRpl1, 5),
                ("2210006", "0076789012", "Xena Gabriel", "xena.gabriel@student.smkn2surakarta.sch.id", xiRpl1, 6),
                ("2210007", "0077890123", "Yusuf Habibie", "yusuf.habibie@student.smkn2surakarta.sch.id", xiRpl1, 7),
                ("2210008", "0078901234", "Zahra Aulia", "zahra.aulia@student.smkn2surakarta.sch.id", xiRpl1, 8),

                ("2110001", "0061234567", "Agus Setiawan", "agus.setiawan@student.smkn2surakarta.sch.id", xiiRpl1, 1),
                ("2110002", "0062345678", "Bella Bella", "bella.bella@student.smkn2surakarta.sch.id", xiiRpl1, 2),
                ("2110003", "0063456789", "Citra Lestari", "citra.lestari@student.smkn2surakarta.sch.id", xiiRpl1, 3),
                ("2110004", "0064567890", "David Saputra", "david.saputra@student.smkn2surakarta.sch.id", xiiRpl1, 4),
                ("2110005", "0065678901", "Erwin Susanto", "erwin.susanto@student.smkn2surakarta.sch.id", xiiRpl1, 5),
                ("2110006", "0066789012", "Farah Nabila", "farah.nabila@student.smkn2surakarta.sch.id", xiiRpl1, 6),
                ("2110007", "0067890123", "Gita Gutawa", "gita.gutawa@student.smkn2surakarta.sch.id", xiiRpl1, 7),
                ("2110008", "0068901234", "Hafiz Mahendra", "hafiz.mahendra@student.smkn2surakarta.sch.id", xiiRpl1, 8),

                ("2320001", "0089991111", "Irfan Hakim", "irfan.hakim@student.smkn2surakarta.sch.id", tkj1, 1),
                ("2320002", "0089992222", "Jessica Iskandar", "jessica.iskandar@student.smkn2surakarta.sch.id", tkj1, 2),
                ("2320003", "0089993333", "Kevin Sanjaya", "kevin.sanjaya@student.smkn2surakarta.sch.id", tkj1, 3),
                ("2320004", "0089994444", "Lia Waode", "lia.waode@student.smkn2surakarta.sch.id", tkj1, 4),

                ("2330001", "0088881111", "Mita The Virgin", "mita.tv@student.smkn2surakarta.sch.id", akl1, 1),
                ("2330002", "0088882222", "Nino Fernandez", "nino.fernandez@student.smkn2surakarta.sch.id", akl1, 2),
                ("2330003", "0088883333", "Olla Ramlan", "olla.ramlan@student.smkn2surakarta.sch.id", akl1, 3),
                ("2330004", "0088884444", "Prilly Latuconsina", "prilly.latuconsina@student.smkn2surakarta.sch.id", akl1, 4)
            };

            foreach (var st in studentSeedData)
            {
                var student = await context.Users.FirstOrDefaultAsync(u => u.NIS == st.NIS || u.Email.ToLower() == st.Email.ToLower());
                if (student is null)
                {
                    student = new User
                    {
                        Id = Guid.NewGuid(),
                        FullName = st.Name,
                        NIS = st.NIS,
                        NISN = st.NISN,
                        Email = st.Email,
                        Username = st.Email.Split('@')[0],
                        Role = UserRole.Student,
                        ClassId = st.Class.Id,
                        StudentNumber = st.Absen,
                        Gender = st.Absen % 2 == 0 ? "Female" : "Male",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    student.PasswordHash = PasswordHasher.HashPassword(student, "Siswa123!");
                    context.Users.Add(student);
                }
                else
                {
                    if (student.ClassId == null)
                    {
                        student.ClassId = st.Class.Id;
                    }
                }
            }
            await context.SaveChangesAsync();
        }

        // Ensure all students in DB are assigned to default class if ClassId is null
        var unassignedStudentsList = await context.Users
            .Where(u => u.Role == UserRole.Student && u.ClassId == null)
            .ToListAsync();

        if (unassignedStudentsList.Any() && defaultClass != null)
        {
            foreach (var s in unassignedStudentsList)
            {
                s.ClassId = defaultClass.Id;
            }
            await context.SaveChangesAsync();
        }

        // ── 5. ClassSubjects Mapping ──────────────────────────────────────────
        var teacherSubjectList = await context.TeacherSubjects
            .Include(ts => ts.Subject)
            .Include(ts => ts.Teacher)
            .ToListAsync();

        foreach (var cls in targetClasses)
        {
            foreach (var ts in teacherSubjectList)
            {
                var exists = await context.ClassSubjects
                    .AnyAsync(cs => cs.ClassId == cls.Id && cs.TeacherSubjectId == ts.Id);

                if (!exists)
                {
                    context.ClassSubjects.Add(new ClassSubject
                    {
                        Id = Guid.NewGuid(),
                        ClassId = cls.Id,
                        TeacherSubjectId = ts.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }
        // ── 6. Seed Calendar Events ──────────────────────────────────────────
        if (!await context.CalendarEvents.AnyAsync())
        {
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
            var adminId = adminUser?.Id ?? Guid.NewGuid();
            var currentYear = DateTime.UtcNow.Year;
            var currentMonth = DateTime.UtcNow.Month;

            var sampleEvents = new List<CalendarEvent>
            {
                new CalendarEvent
                {
                    Id = Guid.NewGuid(),
                    Title = "Masa Bimbingan & Orientasi Siswa",
                    Description = "Pengarahan program akademik dan kegiatan pembekalan siswa baru.",
                    StartDate = new DateTime(currentYear, currentMonth, 3, 7, 30, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(currentYear, currentMonth, 5, 14, 0, 0, DateTimeKind.Utc),
                    Category = "Akademik",
                    Location = "Aula SMKN 2 Surakarta",
                    Visibility = "Public",
                    IsAllDay = true,
                    CreatedByUserId = adminId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CalendarEvent
                {
                    Id = Guid.NewGuid(),
                    Title = "Rapat Koordinasi Pengurus OSIS & MPK",
                    Description = "Musyawarah evaluasi bulanan dan persiapan kegiatan sekolah.",
                    StartDate = new DateTime(currentYear, currentMonth, 10, 9, 0, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(currentYear, currentMonth, 10, 12, 0, 0, DateTimeKind.Utc),
                    Category = "OSIS",
                    Location = "Ruang OSIS SMKN 2 Surakarta",
                    Visibility = "Public",
                    IsAllDay = false,
                    StartTime = "09:00",
                    EndTime = "12:00",
                    CreatedByUserId = adminId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CalendarEvent
                {
                    Id = Guid.NewGuid(),
                    Title = "Hari Pramuka & Latihan Gabungan",
                    Description = "Kegiatan peringatan Hari Pramuka dan apel serentak seluruh tingkat.",
                    StartDate = new DateTime(currentYear, currentMonth, 14, 7, 0, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(currentYear, currentMonth, 14, 11, 30, 0, DateTimeKind.Utc),
                    Category = "Ekstrakurikuler",
                    Location = "Halaman SMKN 2 Surakarta",
                    Visibility = "Public",
                    IsAllDay = false,
                    StartTime = "07:00",
                    EndTime = "11:30",
                    CreatedByUserId = adminId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CalendarEvent
                {
                    Id = Guid.NewGuid(),
                    Title = "Upacara Bendera HUT Kemerdekaan RI",
                    Description = "Seluruh siswa dan bapak/ibu guru mengikuti upacara peringatan HUT Kemerdekaan RI.",
                    StartDate = new DateTime(currentYear, currentMonth, 17, 7, 0, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(currentYear, currentMonth, 17, 10, 0, 0, DateTimeKind.Utc),
                    Category = "Libur Nasional",
                    Location = "Lapangan Utama SMKN 2 Surakarta",
                    Visibility = "Public",
                    IsAllDay = true,
                    CreatedByUserId = adminId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CalendarEvent
                {
                    Id = Guid.NewGuid(),
                    Title = "Penilaian Tengah Semester (PTS)",
                    Description = "Pelaksanaan evaluasi pembelajaran PTS berbasis CBT.",
                    StartDate = new DateTime(currentYear, currentMonth, 24, 7, 30, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(currentYear, currentMonth, 27, 15, 0, 0, DateTimeKind.Utc),
                    Category = "Ujian",
                    Location = "Ruang Kelas & Lab Komputer",
                    Visibility = "Public",
                    IsAllDay = true,
                    CreatedByUserId = adminId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.CalendarEvents.AddRange(sampleEvents);
            await context.SaveChangesAsync();
        }

        logger?.LogInformation("OperationDataSeeder: Comprehensive UAT data initialized successfully.");
    }
}
