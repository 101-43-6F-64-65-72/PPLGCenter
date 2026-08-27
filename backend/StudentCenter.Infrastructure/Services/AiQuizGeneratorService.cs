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

        var systemPrompt = @"You are a professional Senior Software Engineer and Vocational High School (SMK RPL / PPLG) Examination Board Author.
Create high-quality, formal, and academically rigorous multiple-choice questions for vocational students (Kelas 10, 11, 12).

CRITICAL LANGUAGE & FORMALITY RULES:
1. Use standard, formal, and grammatically correct Indonesian (Bahasa Indonesia baku, formal, dan edukatif sesuai kaidah EYD/PUEBI standar ujian kejuruan sekolah).
2. STRICTLY PROHIBITED: Do NOT use slang, colloquial Indonesian, informal words, or conversational tones (dilarang keras menggunakan bahasa gaul, kata santai, atau kata tidak baku).
3. All 4 options (A, B, C, D) MUST be genuine, plausible, and realistic technical terms, valid code snippets, or real concepts.
4. Output strictly a valid JSON object matching the requested schema.";

        var difficultyGuideline = difficulty.ToLower() switch
        {
            "easy" => "Tingkat Dasar (Kelas 10): Konsep fundamental, sintaks dasar yang benar, dan istilah inti RPL (misal: tipe data, selector CSS, tag HTML, perintah Git dasar). Pertanyaan jelas dan to-the-point dengan opsi istilah teknis yang nyata.",
            "medium" => "Tingkat Menengah (Kelas 11): Pemahaman alur kode sederhana 2-5 baris (misal: tebak output if/loop/array, fungsi method, atau query SQL WHERE/JOIN). Opsi jawaban berupa output atau solusi teknis yang masuk akal.",
            "hard" => "Tingkat Terapan & Tantangan (Kelas 12): Analisis keamanan (OWASP, SQL Injection, sanitasi data, JWT), pencegahan bug/error, best practice arsitektur REST API, dan manajemen state/basis data. Opsi jawaban membutuhkan penalaran teknis mendalam.",
            _ => "Tingkat SMK yang aplikatif dan relevan dengan tugas praktik kejuruan."
        };

        var userPrompt = $@"Buatlah tepat {count} butir soal pilihan ganda standar ujian resmi kejuruan SMK RPL mengenai topik: '{topic}'.
Tingkat Kesulitan: '{difficulty}'.
Panduan Materi: {difficultyGuideline}

Format JSON WAJIB:
{{
  ""questions"": [
    {{
      ""topic"": ""{topic}"",
      ""difficulty"": ""{difficulty.ToLower()}"",
      ""question"": ""Teks pertanyaan teknis formal yang spesifik dan langsung mengenai {topic}"",
      ""code_snippet"": null,
      ""options"": [
        ""Opsi Jawaban Benar (Teknis & Baku)"",
        ""Pengecoh 1 (Istilah Teknis Riil Baku)"",
        ""Pengecoh 2 (Istilah Teknis Riil Baku)"",
        ""Pengecoh 3 (Istilah Teknis Riil Baku)""
      ],
      ""correct_answer_index"": 0,
      ""explanation"": ""Penjelasan teknis formal dan edukatif mengapa jawaban ini benar.""
    }}
  ]
}}

Aturan Mutlak:
1. Bahasa WAJIB Bahasa Indonesia baku, formal, dan rapi (tidak boleh gaul/informal).
2. Soal HARUS 100% relevan dengan topik '{topic}'.
3. 4 OPSI JAWABAN WAJIB SEMUANYA ISTILAH/KODE TEKNIS ASLI (Dilarang opsi lelucon/ngawur).
4. Pengecoh harus tampak meyakinkan bagi siswa yang belum memahami konsep secara mendalam.";

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
            var systemPrompt = @"You are a professional software engineering teacher for SMK RPL. Output strictly valid JSON. All 4 options MUST be real, plausible technical concepts without any silly/joke answers.";
            var userPrompt = $@"Buatlah {count} butir soal pilihan ganda teknis profesional untuk siswa SMK RPL mengenai topik: '{topic}' tingkat kesulitan: '{difficulty}'. 4 opsi jawaban WAJIB berupa istilah atau sintaks teknis nyata yang meyakinkan.";

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
