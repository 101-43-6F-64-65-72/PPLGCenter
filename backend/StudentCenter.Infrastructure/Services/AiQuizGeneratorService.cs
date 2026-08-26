using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
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
    private static readonly HttpClient _httpClient = new();
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
        var apiKey = _configuration["GROQ_API_KEY"] 
                     ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("GROQ_API_KEY is not configured. Using diverse fallback question generator for topic {Topic}.", topic);
            return GetFallbackQuestions(topic, difficulty, count);
        }

        var model = _configuration["GROQ_MODEL"] 
                    ?? Environment.GetEnvironmentVariable("GROQ_MODEL") 
                    ?? "llama-3.3-70b-versatile";

        var systemPrompt = @"You are an experienced SMK Teacher and Software Engineering Instructor for SMK Jurusan Rekayasa Perangkat Lunak (RPL / PPLG).
Create friendly, practical, educational, and engaging multiple-choice quiz questions suitable for SMK vocational high school students (Kelas 10, 11, 12).
Use clear, easy-to-understand Indonesian language. Avoid unnecessarily convoluted academic jargon.
You must output strictly valid JSON in the requested format with no commentary outside JSON.";

        var difficultyGuideline = difficulty.ToLower() switch
        {
            "easy" => "Tingkat Dasar SMK: Konsep dasar, fungsi sintaks umum (SELECT, WHERE, JOIN dasar), istilah penting RPL, dan logika pemrograman dasar. code_snippet boleh null.",
            "medium" => "Tingkat Menengah SMK: Analisis kode sederhana 3-6 baris (tebak output kode sederhana, query SQL, manipulasi array/variabel). Wajib sertakan code_snippet yang bersih dan mudah dibaca.",
            "hard" => "Tingkat Terapan SMK: Menemukan bug penulisan kode, penanganan error umum, validasi input, dan penerapan best practice coding di SMK. Wajib sertakan code_snippet yang ringkas.",
            _ => "Tingkat SMK yang aplikatif dan relevan dengan tugas praktik kejuruan."
        };

        var userPrompt = $@"Buatlah tepat {count} soal pilihan ganda setingkat siswa SMK RPL (Rekayasa Perangkat Lunak) tentang topik: '{topic}'.
Tingkat Kesulitan: '{difficulty}'.
Panduan Materi SMK: {difficultyGuideline}

Format JSON WAJIB:
{{
  ""questions"": [
    {{
      ""topic"": ""{topic}"",
      ""difficulty"": ""{difficulty.ToLower()}"",
      ""question"": ""Pertanyaan yang jelas, aplikatif, dan mudah dipahami siswa SMK"",
      ""code_snippet"": ""Kode program jika ada atau null jika teori"",
      ""options"": [
        ""Pilihan A"",
        ""Pilihan B"",
        ""Pilihan C"",
        ""Pilihan D""
      ],
      ""correct_answer_index"": 0,
      ""explanation"": ""Penjelasan ringkas dan edukatif mengapa jawaban ini benar.""
    }}
  ]
}}

Aturan:
1. 'options' harus 4 opsi yang masuk akal dan jelas perbedaannya.
2. Gunakan contoh nyata yang dipelajari di lab komputer SMK (HTML/CSS, JS, PHP, C#, SQL, Git).";

        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            response_format = new { type = "json_object" },
            temperature = 0.6,
            max_tokens = 4000
        };

        try
        {
            using var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            requestMessage.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(requestMessage);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Groq API error {StatusCode}: {ErrorBody}", response.StatusCode, responseJson);
                return GetFallbackQuestions(topic, difficulty, count);
            }

            using var doc = JsonDocument.Parse(responseJson);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(content))
            {
                return GetFallbackQuestions(topic, difficulty, count);
            }

            var envelope = JsonSerializer.Deserialize<GeneratedQuestionsBatchEnvelope>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (envelope?.questions != null && envelope.questions.Count > 0)
            {
                return envelope.questions;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception when generating questions from Groq AI for topic {Topic} difficulty {Difficulty}", topic, difficulty);
        }

        return GetFallbackQuestions(topic, difficulty, count);
    }

    public async Task<List<DailyQuizQuestion>> GenerateInitialDailyPoolAsync(DateOnly date, string topic)
    {
        // Check if questions already exist for this date
        var existing = await _context.DailyQuizQuestions
            .Where(q => q.TargetDate == date)
            .OrderBy(q => q.QuestionNumber)
            .ToListAsync();

        if (existing.Count >= 30)
        {
            return existing;
        }

        _logger.LogInformation("Generating 30 initial Daily Quiz Questions for date {Date} topic '{Topic}'...", date, topic);

        // 3 sequential structured chunk calls to LLM API (10 Easy, 10 Medium, 10 Hard)
        var chunk1 = await GenerateQuestionsChunkAsync(topic, "easy", 10);
        var chunk2 = await GenerateQuestionsChunkAsync(topic, "medium", 10);
        var chunk3 = await GenerateQuestionsChunkAsync(topic, "hard", 10);

        var allItems = new List<DailyQuizQuestion>();
        int currentNum = 1;

        foreach (var item in chunk1)
        {
            allItems.Add(MapToEntity(item, date, topic, currentNum++, "easy"));
        }
        foreach (var item in chunk2)
        {
            allItems.Add(MapToEntity(item, date, topic, currentNum++, "medium"));
        }
        foreach (var item in chunk3)
        {
            allItems.Add(MapToEntity(item, date, topic, currentNum++, "hard"));
        }

        // Save to Database
        _context.DailyQuizQuestions.AddRange(allItems);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully saved {Count} Daily Quiz Questions for date {Date}.", allItems.Count, date);
        return allItems;
    }

    public async Task<List<DailyQuizQuestion>> GenerateEndlessBatchAsync(DateOnly date, string topic, int startQuestionNumber, int count = 10)
    {
        _logger.LogInformation("Generating Endless Batch of {Count} Expert Questions for date {Date} starting at #{StartNumber}...", count, date, startQuestionNumber);

        var batch = await GenerateQuestionsChunkAsync(topic, "expert", count);
        var entities = new List<DailyQuizQuestion>();
        int currentNum = startQuestionNumber;

        foreach (var item in batch)
        {
            entities.Add(MapToEntity(item, date, topic, currentNum++, "expert"));
        }

        _context.DailyQuizQuestions.AddRange(entities);
        await _context.SaveChangesAsync();

        return entities;
    }

    private static DailyQuizQuestion MapToEntity(GeneratedQuestionJsonItem item, DateOnly date, string topic, int number, string defaultDifficulty)
    {
        var rawOptions = item.options != null && item.options.Count == 4
            ? item.options.ToList()
            : new List<string> { "Opsi A", "Opsi B", "Opsi C", "Opsi D" };

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

        var easyTemplates = new[]
        {
            ("Prinsip fundamental manakah yang paling mendasar dalam penerapan {0}?",
             "Menerapkan pemisahan tanggung jawab (Separation of Concerns) dan struktur modular",
             "Menyatukan seluruh proses dalam satu file konfigurasi monolitik",
             "Mengabaikan standar penamaan variabel dan fungsi",
             "Menghindari pembuatan dokumentasi teknis"),

            ("Apa tujuan utama seorang software engineer menerapkan {0} pada proyek berskala besar?",
             "Meningkatkan skalabilitas, keandalan, dan kemudahan perawatan (maintainability)",
             "Mengurangi jumlah developer yang dibutuhkan dalam tim",
             "Menghilangkan kebutuhan akan security review",
             "Memaksa aplikasi berjalan secara eksklusif di single-thread"),

            ("Manakah di antara pilihan berikut yang merupakan best practice dalam {0}?",
             "Melakukan code review dan automated unit testing secara konsisten",
             "Mengabaikan log error pada environment production",
             "Melakukan hardcode kredensial dan API secret key di repository publik",
             "Menghindari penggunaan version control seperti Git"),

            ("Dalam arsitektur software modern, bagaimana peran {0} mendukung performa aplikasi?",
             "Mengurangi overhead komputasi dan mengoptimalkan penggunaan resource memory/CPU",
             "Menghapus kebutuhan akan database indexing",
             "Membatasi jumlah request maksimal pengguna menjadi satu per menit",
             "Menonaktifkan caching layer di server"),

            ("Konvensi penamaan dan struktur standar pada {0} bertujuan untuk...",
             "Mempermudah kolaborasi tim dan keterbacaan kode (readability)",
             "Memperkecil ukuran file binary secara otomatis",
             "Mencegah file dibaca oleh compiler",
             "Menyembunyikan logika bisnis dari anggota tim lain")
        };

        var mediumTemplates = new[]
        {
            ("Perhatikan alur eksekusi berikut. Apakah output atau efek dari kode implementasi {0} ini?",
             "// Implementasi Alur Logika\nconst pipeline = initPipeline('{0}');\nconst result = pipeline.process(data);\nconsole.log(result.status);",
             "Memproses data secara terisolasi dan mengembalikan status SUCCESS yang valid",
             "Memicu infinite loop dan memory leak seketika",
             "Menghapus seluruh state aplikasi secara permanen",
             "Mengabaikan exception handling saat runtime"),

            ("Berdasarkan snippet kode berikut, manakah pola perancangan yang diterapkan pada {0}?",
             "public class ServiceHandler {\n    private readonly IRepository _repo;\n    public ServiceHandler(IRepository repo) => _repo = repo;\n}",
             "Dependency Injection (Inversion of Control) untuk fleksibilitas modular",
             "Anti-pattern God Object",
             "Global Mutable State Pattern",
             "Circular Dependency Trap")
        };

        var hardTemplates = new[]
        {
            ("Ditemukan potensi bug konkurensi pada modul {0}. Bagaimana langkah refactoring yang paling tepat?",
             "// Skenario Race Condition\nasync Task UpdateState() {\n    var count = await GetCount();\n    await SaveCount(count + 1);\n}",
             "Menggunakan locking mekanisme (Atomic Operation / Mutex / Transaction Isolation Level)",
             "Menghilangkan keyword async dan membiarkan blocking thread",
             "Menjalankan kedua task tanpa await",
             "Menambah delay buatan Task.Delay(1000) tanpa synchronization primitive"),

            ("Perhatikan penanganan edge case berikut. Mengapa kode {0} ini berpotensi memicu NullReferenceException?",
             "public string GetUserCity(User user) => user.Profile.Address.City.ToUpper();",
             "Karena tidak memvalidasi nullability pada rantai objek (Profile, Address, City) sebelum mengakses properti",
             "Karena fungsi ToUpper() tidak didukung pada string",
             "Karena C# tidak mengizinkan penulisan lambda expression",
             "Karena tipe data User harus selalu berupa struct")
        };

        for (int i = 0; i < count; i++)
        {
            if (difficulty.ToLower() == "easy")
            {
                var t = easyTemplates[i % easyTemplates.Length];
                list.Add(new GeneratedQuestionJsonItem
                {
                    topic = topic,
                    difficulty = "easy",
                    question = string.Format(t.Item1, topic),
                    code_snippet = null,
                    options = new List<string> { t.Item2, t.Item3, t.Item4, t.Item5 },
                    correct_answer_index = 0,
                    explanation = $"Pilihan A benar karena {t.Item2} merupakan standar industri dan best practice dalam domain {topic}."
                });
            }
            else if (difficulty.ToLower() == "medium")
            {
                var t = mediumTemplates[i % mediumTemplates.Length];
                list.Add(new GeneratedQuestionJsonItem
                {
                    topic = topic,
                    difficulty = "medium",
                    question = string.Format(t.Item1, topic),
                    code_snippet = string.Format(t.Item2, topic),
                    options = new List<string> { t.Item3, t.Item4, t.Item5, t.Item6 },
                    correct_answer_index = 0,
                    explanation = $"Pilihan A tepat karena analisis alur kode {topic} menunjukkan pemisahan logika yang benar dan menghindari efek samping yang tidak diinginkan."
                });
            }
            else
            {
                var t = hardTemplates[i % hardTemplates.Length];
                list.Add(new GeneratedQuestionJsonItem
                {
                    topic = topic,
                    difficulty = "hard",
                    question = string.Format(t.Item1, topic),
                    code_snippet = string.Format(t.Item2, topic),
                    options = new List<string> { t.Item3, t.Item4, t.Item5, t.Item6 },
                    correct_answer_index = 0,
                    explanation = $"Pilihan A adalah solusi arsitektural yang tepat untuk mengatasi bug atau edge case pada {topic} secara aman dan efisien."
                });
            }
        }

        return list;
    }
}
