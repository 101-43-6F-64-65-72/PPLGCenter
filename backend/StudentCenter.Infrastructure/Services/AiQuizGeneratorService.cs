using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AiQuizGeneratorService : IAiQuizGeneratorService
{
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(60) };
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiQuizGeneratorService> _logger;

    public AiQuizGeneratorService(
        AppDbContext context,
        IConfiguration configuration,
        ILogger<AiQuizGeneratorService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<List<GeneratedQuestionJsonItem>> GenerateQuestionsChunkAsync(string topic, string difficulty, int count)
    {
        // 1. Bitdeer AI Primary Configuration
        var apiUrl = _configuration["AI_QUIZ_API_URL"] 
                     ?? Environment.GetEnvironmentVariable("AI_QUIZ_API_URL") 
                     ?? "https://api-inference.bitdeer.ai/v1/chat/completions";

        var apiKey = _configuration["AI_QUIZ_API_KEY"] 
                     ?? Environment.GetEnvironmentVariable("AI_QUIZ_API_KEY") 
                     ?? "5oLjI4spiQXfs7pBwg78";

        var model = _configuration["AI_QUIZ_MODEL"] 
                    ?? Environment.GetEnvironmentVariable("AI_QUIZ_MODEL") 
                    ?? "Qwen/Qwen3.8-27B";

        var systemPrompt = @"You are a friendly and enthusiastic Software Engineering Teacher for SMK RPL (Rekayasa Perangkat Lunak) students.
Create VERY EASY, fun, clear, and beginner-friendly multiple-choice questions for SMK students.
Language: Indonesian (Bahasa Indonesia yang santai, jelas, tidak berbelit-belit, dan mudah dipahami anak SMK pemula).
Goal: Make it encouraging and enjoyable so students easily understand the core logic and basic concepts.
Output strictly a JSON object.";

        var difficultyGuideline = difficulty.ToLower() switch
        {
            "easy" => "Sangat Mudah: Pertanyaan dasar seputar istilah coding, fungsi umum, atau hal yang sering dijumpai sehari-hari di lab komputer.",
            "medium" => "Mudah & Praktis: Potongan kode 1-3 baris yang sangat simpel (misal: if/else, variabel, tag HTML, atau SELECT SQL sederhana).",
            "hard" => "Menantang Sederhana: Praktik baik coding sehari-hari (misal: password yang kuat, fungsi git commit, atau pencegahan error sederhana).",
            _ => "Sangat mudah dan ramah pemula."
        };

        var userPrompt = $@"Buatlah tepat {count} butir soal pilihan ganda yang MUDAH, MENYENANGKAN, dan RAMAH PEMULA untuk siswa SMK RPL tentang topik: '{topic}'.
Tingkat Kesulitan: '{difficulty}'.
Panduan: {difficultyGuideline}

Format JSON WAJIB:
{{
  ""questions"": [
    {{
      ""topic"": ""{topic}"",
      ""difficulty"": ""{difficulty.ToLower()}"",
      ""question"": ""Pertanyaan yang ringkas, simpel, dan mudah dipahami siswa SMK"",
      ""code_snippet"": null,
      ""options"": [
        ""Jawaban Benar yang Jelas"",
        ""Pengecoh 1 yang masuk akal"",
        ""Pengecoh 2 yang jelas salah"",
        ""Pengecoh 3 yang lucu/salah""
      ],
      ""correct_answer_index"": 0,
      ""explanation"": ""Penjelasan singkat 1 kalimat yang mudah dipahami.""
    }}
  ]
}}

Aturan:
1. Buat pertanyaan yang MUDAH dan tidak membingungkan siswa.
2. Gunakan kata-kata yang simpel.
3. Soal berkaitan dengan topik '{topic}'.";

        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            max_tokens = 3000,
            temperature = 0.7,
            stream = false
        };

        try
        {
            using var requestMessage = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            requestMessage.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(requestMessage);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(responseJson);
                var content = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                if (!string.IsNullOrWhiteSpace(content))
                {
                    var cleanedJson = ExtractJsonBlock(content);
                    var envelope = JsonSerializer.Deserialize<GeneratedQuestionsBatchEnvelope>(cleanedJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (envelope?.questions != null && envelope.questions.Count > 0)
                    {
                        _logger.LogInformation("Successfully generated {Count} questions from Bitdeer AI ({Model}) for topic {Topic}.", envelope.questions.Count, model, topic);
                        return envelope.questions;
                    }
                }
            }
            else
            {
                _logger.LogWarning("Bitdeer AI error {StatusCode}: {Body}. Trying Groq backup...", response.StatusCode, responseJson);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Exception contacting Bitdeer AI API. Trying backup...");
        }

        // 2. Groq Backup Call
        return await TryGroqBackupAsync(topic, difficulty, count);
    }

    private async Task<List<GeneratedQuestionJsonItem>> TryGroqBackupAsync(string topic, string difficulty, int count)
    {
        var groqKey = _configuration["GROQ_API_KEY"] ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");
        if (string.IsNullOrWhiteSpace(groqKey))
        {
            return GetFallbackQuestions(topic, difficulty, count);
        }

        try
        {
            var systemPrompt = @"You are a software engineering teacher for SMK RPL. Output strictly JSON.";
            var userPrompt = $@"Buat {count} soal pilihan ganda tentang topik: '{topic}' tingkat '{difficulty}'. Format JSON: {{ ""questions"": [ {{ ""topic"": ""{topic}"", ""difficulty"": ""{difficulty}"", ""question"": ""..."", ""code_snippet"": null, ""options"": [""Opsi A"", ""Opsi B"", ""Opsi C"", ""Opsi D""], ""correct_answer_index"": 0, ""explanation"": ""..."" }} ] }}";

            var reqBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                response_format = new { type = "json_object" },
                temperature = 0.6
            };

            using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", groqKey);
            req.Content = new StringContent(JsonSerializer.Serialize(reqBody), Encoding.UTF8, "application/json");

            var res = await _httpClient.SendAsync(req);
            if (res.IsSuccessStatusCode)
            {
                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                if (!string.IsNullOrWhiteSpace(content))
                {
                    var envelope = JsonSerializer.Deserialize<GeneratedQuestionsBatchEnvelope>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (envelope?.questions != null && envelope.questions.Count > 0)
                    {
                        return envelope.questions;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Groq backup also failed.");
        }

        return GetFallbackQuestions(topic, difficulty, count);
    }

    private static string ExtractJsonBlock(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "{}";

        // If wrapped in ```json ... ```
        var match = Regex.Match(text, @"```(?:json)?\s*([\s\S]*?)\s*```", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            return match.Groups[1].Value.Trim();
        }

        // Find outer curly braces
        int firstOpen = text.IndexOf('{');
        int lastClose = text.LastIndexOf('}');
        if (firstOpen >= 0 && lastClose > firstOpen)
        {
            return text.Substring(firstOpen, lastClose - firstOpen + 1);
        }

        return text.Trim();
    }

    public async Task<List<DailyQuizQuestion>> GenerateInitialDailyPoolAsync(DateOnly date, string topic)
    {
        // 1. Wipe existing questions for this date to start completely fresh as requested
        var existing = await _context.DailyQuizQuestions
            .Where(q => q.TargetDate == date)
            .ToListAsync();

        if (existing.Count > 0)
        {
            _context.DailyQuizQuestions.RemoveRange(existing);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted {Count} old questions for date {Date} to re-generate fresh pool.", existing.Count, date);
        }

        _logger.LogInformation("Generating 30 fresh Daily Quiz Questions from AI for date {Date} topic '{Topic}'...", date, topic);

        // 2. Generate chunks (10 Easy, 10 Medium, 10 Hard)
        var chunk1 = await GenerateQuestionsChunkAsync(topic, "easy", 10);
        var chunk2 = await GenerateQuestionsChunkAsync(topic, "medium", 10);
        var chunk3 = await GenerateQuestionsChunkAsync(topic, "hard", 10);

        var allItems = new List<DailyQuizQuestion>();
        var seenQuestions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int currentNum = 1;

        void AddChunkItems(List<GeneratedQuestionJsonItem> chunk, string diff)
        {
            foreach (var item in chunk)
            {
                var qText = item.question?.Trim();
                if (string.IsNullOrWhiteSpace(qText) || seenQuestions.Contains(qText))
                {
                    continue;
                }
                seenQuestions.Add(qText);
                allItems.Add(MapToEntity(item, date, topic, currentNum++, diff));
            }
        }

        AddChunkItems(chunk1, "easy");
        AddChunkItems(chunk2, "medium");
        AddChunkItems(chunk3, "hard");

        // If deduplication resulted in fewer than 30 questions, supplement with topic-matched questions
        if (allItems.Count < 30)
        {
            var supplements = GetFallbackQuestions(topic, "mixed", 30 - allItems.Count);
            foreach (var item in supplements)
            {
                var qText = item.question?.Trim();
                if (!string.IsNullOrWhiteSpace(qText) && !seenQuestions.Contains(qText))
                {
                    seenQuestions.Add(qText);
                    allItems.Add(MapToEntity(item, date, topic, currentNum++, item.difficulty ?? "easy"));
                }
            }
        }

        // Sequential renumbering 1..N
        for (int i = 0; i < allItems.Count; i++)
        {
            allItems[i].QuestionNumber = i + 1;
        }

        // 3. Save to Database
        _context.DailyQuizQuestions.AddRange(allItems);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully generated and saved {Count} fresh Daily Quiz Questions for date {Date}.", allItems.Count, date);
        return allItems;
    }

    public async Task<List<DailyQuizQuestion>> GenerateEndlessBatchAsync(DateOnly date, string topic, int startQuestionNumber, int count = 10)
    {
        _logger.LogInformation("Generating Endless Batch of {Count} Questions for date {Date} starting at #{StartNumber}...", count, date, startQuestionNumber);

        var batch = await GenerateQuestionsChunkAsync(topic, "hard", count);
        var entities = new List<DailyQuizQuestion>();
        int currentNum = startQuestionNumber;

        foreach (var item in batch)
        {
            entities.Add(MapToEntity(item, date, topic, currentNum++, "hard"));
        }

        _context.DailyQuizQuestions.AddRange(entities);
        await _context.SaveChangesAsync();

        return entities;
    }

    private static DailyQuizQuestion MapToEntity(GeneratedQuestionJsonItem item, DateOnly date, string topic, int number, string defaultDifficulty)
    {
        var rawOptions = item.options != null && item.options.Count == 4
            ? item.options.ToList()
            : new List<string> { "Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D" };

        var originalCorrectIndex = Math.Clamp(item.correct_answer_index, 0, 3);
        var correctOptionText = rawOptions[originalCorrectIndex];

        // Shuffle options so correct answer is randomly distributed across A, B, C, D
        var rng = new Random();
        var shuffledOptions = rawOptions.OrderBy(_ => rng.Next()).ToList();
        var newCorrectIndex = shuffledOptions.IndexOf(correctOptionText);
        if (newCorrectIndex < 0) newCorrectIndex = 0;

        return new DailyQuizQuestion
        {
            Id = Guid.NewGuid(),
            TargetDate = date,
            Topic = string.IsNullOrWhiteSpace(item.topic) ? topic : item.topic,
            QuestionNumber = number,
            Difficulty = string.IsNullOrWhiteSpace(item.difficulty) ? defaultDifficulty : item.difficulty.ToLower(),
            QuestionText = item.question ?? $"Pertanyaan #{number} seputar {topic}",
            CodeSnippet = string.IsNullOrWhiteSpace(item.code_snippet) ? null : item.code_snippet.Trim(),
            OptionsJson = JsonSerializer.Serialize(shuffledOptions),
            CorrectAnswerIndex = newCorrectIndex,
            Explanation = item.explanation ?? "Penjelasan jawaban benar sesuai prinsip kejuruan RPL.",
            CreatedAt = DateTime.UtcNow
        };
    }

    private static List<GeneratedQuestionJsonItem> GetFallbackQuestions(string topic, string difficulty, int count)
    {
        var list = new List<GeneratedQuestionJsonItem>();
        var tLower = topic.ToLower();

        if (tLower.Contains("cyber") || tLower.Contains("security") || tLower.Contains("owasp") || tLower.Contains("keamanan"))
        {
            var securityQuestions = new[]
            {
                ("Apa tujuan utama dari teknik hashing password menggunakan algoritma seperti Bcrypt atau Argon2?",
                 "Menyimpan password dalam bentuk one-way hash yang tidak dapat didekripsi kembali jika database bocor",
                 "Mempercepat waktu autentikasi login pengguna",
                 "Mengompres ukuran database agar lebih hemat penyimpanan",
                 "Membuat password bisa dibaca langsung oleh admin website"),

                ("Manakah kerentanan keamanan web di mana penyerang menyisipkan skrip JavaScript berbahaya ke halaman yang dibuka pengguna lain?",
                 "Cross-Site Scripting (XSS)",
                 "SQL Injection (SQLi)",
                 "Distributed Denial of Service (DDoS)",
                 "Man-in-the-Middle (MitM)"),

                ("Bagaimanakah langkah paling tepat untuk mencegah serangan SQL Injection pada aplikasi web?",
                 "Menggunakan Parameterized Queries / Prepared Statements pada setiap query database",
                 "Menonaktifkan sistem login dan autentikasi",
                 "Menghapus password database pada server",
                 "Menggunakan koneksi HTTP tanpa enkripsi SSL"),

                ("Dalam OWASP Top 10, kerentanan 'Broken Access Control' terjadi ketika...",
                 "Pengguna biasa dapat mengakses atau memodifikasi data milik pengguna lain / admin karena otorisasi yang lemah",
                 "Server website kehabisan kuota RAM dan CPU",
                 "Kode JavaScript gagal ter-compile di browser",
                 "Kabel LAN lab komputer mengalami gangguan fisik"),

                ("Apa fungsi utama dari token CSRF (Cross-Site Request Forgery) pada formulir web?",
                 "Memastikan bahwa permintaan POST benar-benar dikirimkan secara sengaja oleh pengguna yang sah dari form asli",
                 "Mempercepat proses pengiriman data form",
                 "Menyembunyikan form dari mesin pencari Google",
                 "Mengubah warna tombol submit secara dinamis"),

                ("Protokol keamanan web manakah yang mengenkripsi seluruh komunikasi data antara browser klien dan server web?",
                 "HTTPS (SSL/TLS)",
                 "HTTP 1.0",
                 "FTP Plain Text",
                 "Telnet Protocol"),

                ("Manakah praktik pembuatan password yang paling aman untuk akun administrator sistem?",
                 "Kombinasi minimal 12 karakter acak (huruf besar, kecil, angka, simbol) dan tidak memakai kata umum",
                 "Menggunakan tanggal lahir atau nama panggilan pribadi",
                 "Menggunakan kombinasi sederhana 'admin12345'",
                 "Menyamakan password dengan username akun"),

                ("Dalam keamanan autentikasi, apa keunggulan utama dari Two-Factor Authentication (2FA)?",
                 "Memerlukan dua lapis bukti identitas (misal password + kode OTP authenticator) sebelum login",
                 "Membuat pengguna tidak perlu mengingat password sama sekali",
                 "Mengizinkan login tanpa menggunakan koneksi internet",
                 "Menghapus kebutuhan akan verifikasi email"),

                ("Kerentanan 'Security Misconfiguration' pada server aplikasi biasanya disebabkan oleh...",
                 "Membiarkan kredensial default admin aktif dan menampilkan pesan error stack trace lengkap ke publik",
                 "Mengaktifkan firewall dan update patch keamanan OS",
                 "Menulis kode program menggunakan bahasa C# atau JavaScript",
                 "Memasang sertifikat SSL yang valid"),

                ("Apa yang dimaksud dengan prinsip 'Least Privilege' dalam manajemen hak akses aplikasi?",
                 "Memberikan pengguna hanya izin akses minimal yang mutlak diperlukan untuk menyelesaikan tugasnya",
                 "Memberikan hak akses super-admin ke seluruh siswa tanpa batasan",
                 "Menghapus seluruh akun database setelah selesai jam sekolah",
                 "Membiarkan port database terbuka untuk seluruh IP publik di internet")
            };

            for (int i = 0; i < count; i++)
            {
                var q = securityQuestions[i % securityQuestions.Length];
                list.Add(new GeneratedQuestionJsonItem
                {
                    topic = topic,
                    difficulty = difficulty == "hard" ? "hard" : difficulty == "medium" ? "medium" : "easy",
                    question = $"{q.Item1}" + (i >= securityQuestions.Length ? $" [Variasi {i + 1}]" : ""),
                    code_snippet = null,
                    options = new List<string> { q.Item2, q.Item3, q.Item4, q.Item5 },
                    correct_answer_index = 0,
                    explanation = $"Pilihan '{q.Item2}' adalah prinsip keamanan standar industri yang tertera pada panduan OWASP."
                });
            }
            return list;
        }

        var generalQuestions = new[]
        {
            ("Dalam pemrograman dasar, manakah deklarasi variabel JavaScript yang nilainya bersifat konstan (tidak dapat diubah)?",
             "const nilai = 100;", "var nilai = 100;", "let nilai = 100;", "static nilai = 100;"),
            ("Tag HTML5 manakah yang digunakan untuk membuat tautan atau hyperlink ke halaman web lain?",
             "<a href=\"https://smkn2solo.sch.id\">Website</a>", "<link src=\"https://smkn2solo.sch.id\">Website</link>", "<url path=\"https://smkn2solo.sch.id\">Website</url>", "<href link=\"https://smkn2solo.sch.id\">Website</href>"),
            ("Perintah Git dasar apakah yang digunakan untuk menyimpan perubahan file ke staging area?",
             "git add .", "git push origin main", "git commit -m \"update\"", "git clone <url>"),
            ("Dalam logika algoritma, apakah tipe data yang hanya dapat bernilai true (benar) atau false (salah)?",
             "Boolean", "Integer", "String", "Float / Double"),
            ("Property CSS apakah yang digunakan untuk mengubah warna latar belakang sebuah elemen HTML?",
             "background-color", "font-color", "text-align", "border-radius"),
            ("Perintah SQL manakah yang benar untuk menampilkan seluruh data siswa dari tabel 'students' dengan kelas '11-RPL-1'?",
             "SELECT * FROM students WHERE class_name = '11-RPL-1';", "GET ALL FROM students FILTER class_name = '11-RPL-1';", "SELECT students WHERE class_name EQUALS '11-RPL-1';", "SHOW TABLE students WHERE class_name IS '11-RPL-1';"),
            ("Dalam OOP, konsep apakah yang memungkinkan sebuah Class mewarisi properti dan method dari Class induknya?",
             "Inheritance (Pewarisan)", "Polymorphism", "Encapsulation", "Abstraction"),
            ("Dalam arsitektur REST API, kode HTTP Status 201 Created memiliki arti bahwa...",
             "Permintaan berhasil dan data/entitas baru berhasil dibuat di server", "Halaman atau endpoint tidak ditemukan (Not Found)", "Terjadi error internal pada server", "Pengguna belum login (Unauthorized)"),
            ("Manakah teknik paling efektif untuk mencegah kerentanan SQL Injection pada query database aplikasi?",
             "Menggunakan Prepared Statements / Parameterized Queries (ORM EF Core / PDO)", "Menonaktifkan firewall port database", "Mengenkripsi nama tabel database dengan Base64", "Menggabungkan input pengguna langsung ke query string"),
            ("Bagaimanakah cara menangani proses asynchronous di JavaScript agar kode mudah dibaca dan bebas dari callback hell?",
             "Menggunakan sintaks 'async' dan 'await' dengan blok 'try-catch'", "Menghapus seluruh pemanggilan fetch()", "Menggunakan perulangan blocking while(true)", "Menggunakan fungsi alert() di setiap baris kode")
        };

        for (int i = 0; i < count; i++)
        {
            var q = generalQuestions[i % generalQuestions.Length];
            list.Add(new GeneratedQuestionJsonItem
            {
                topic = topic,
                difficulty = difficulty == "hard" ? "hard" : difficulty == "medium" ? "medium" : "easy",
                question = q.Item1 + (i >= generalQuestions.Length ? $" [Variasi {i + 1}]" : ""),
                code_snippet = null,
                options = new List<string> { q.Item2, q.Item3, q.Item4, q.Item5 },
                correct_answer_index = 0,
                explanation = $"Pilihan '{q.Item2}' adalah jawaban yang tepat sesuai standar kurikulum kejuruan RPL SMK."
            });
        }

        return list;
    }
}
