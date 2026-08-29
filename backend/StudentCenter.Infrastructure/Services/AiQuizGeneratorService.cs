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
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

/// <summary>
/// 100% FULL REAL-TIME GENERATIVE AI QUIZ ENGINE (Ultra-Efficient Groq Cloud Architecture)
/// Dioptimasi khusus untuk kecepatan kilat (<1s per chunk) dan konsumsi token efisien (100% aman dari Groq 6000 TPM limit).
/// </summary>
public class AiQuizGeneratorService : IAiQuizGeneratorService
{
    private readonly HttpClient _httpClient;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AiQuizGeneratorService> _logger;
    private readonly IGenerationStatusService _status;

    public AiQuizGeneratorService(
        IHttpClientFactory httpClientFactory,
        AppDbContext context,
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory,
        ILogger<AiQuizGeneratorService> logger,
        IGenerationStatusService status)
    {
        _httpClient = httpClientFactory != null ? httpClientFactory.CreateClient() : new HttpClient();
        _context = context;
        _configuration = configuration;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _status = status;
    }

    /// <summary>
    /// Men-generate chunk butir soal 100% MURNI dari AI Generatif secara real-time.
    /// Menggunakan Groq Llama 3.1 8B Instant sebagai engine utama (super cepat ~0.8s, presisi JSON).
    /// </summary>
    public async Task<List<GeneratedQuestionJsonItem>> GenerateQuestionsChunkAsync(
        string topic,
        string difficulty,
        int count,
        string? requestedModel = null,
        string? requestedProvider = null)
    {
        var failureReasons = new List<string>();

        // 1. Jika Admin memilih model tertentu secara spesifik di UI
        if (!string.IsNullOrWhiteSpace(requestedModel) && !requestedModel.Contains("DeepSeek-V4"))
        {
            try
            {
                _logger.LogInformation("[Live AI] Calling Model '{Model}' for '{Topic}' [{Diff}]...", requestedModel, topic, difficulty);
                var questions = await CallGroqModelAsync(topic, difficulty, count, requestedModel.Trim());
                if (questions != null && questions.Count > 0)
                {
                    return questions;
                }
            }
            catch (Exception ex)
            {
                failureReasons.Add($"Model ({requestedModel}): {ex.Message}");
                _logger.LogWarning("[Live AI] Model '{Model}' failed: {Error}. Falling back to default Groq 8B...", requestedModel, ex.Message);
            }
        }

        // Tier 1: Groq Cloud Llama 3.1 8B Instant (Ultra-cepat, token hemat, format JSON baku)
        try
        {
            _logger.LogInformation("[Live AI] Tier 1: Groq llama-3.1-8b-instant for '{Topic}' [{Diff}]...", topic, difficulty);
            var questions = await CallGroqModelAsync(topic, difficulty, count, "llama-3.1-8b-instant");
            if (questions != null && questions.Count > 0)
            {
                _logger.LogInformation("[Live AI] SUCCESS: Generated {Count} questions via Groq Llama 3.1 8B.", questions.Count);
                return questions;
            }
        }
        catch (Exception ex)
        {
            failureReasons.Add($"Groq 8B: {ex.Message}");
            _logger.LogWarning("[Live AI] Tier 1 Groq 8B failed ({Error}). Escalating to Tier 2 Groq 70B...", ex.Message);
        }

        // Tier 2: Groq Cloud Llama 3.3 70B Versatile (Deep Reasoning)
        try
        {
            _logger.LogInformation("[Live AI] Tier 2: Groq llama-3.3-70b-versatile for '{Topic}' [{Diff}]...", topic, difficulty);
            var questions = await CallGroqModelAsync(topic, difficulty, count, "llama-3.3-70b-versatile");
            if (questions != null && questions.Count > 0)
            {
                _logger.LogInformation("[Live AI] SUCCESS: Generated {Count} questions via Groq Llama 3.3 70B.", questions.Count);
                return questions;
            }
        }
        catch (Exception ex)
        {
            failureReasons.Add($"Groq 70B: {ex.Message}");
            _logger.LogWarning("[Live AI] Tier 2 Groq 70B failed ({Error}). Trying Bitdeer Cloud fallback...", ex.Message);
        }

        // Tier 3: Bitdeer Cloud Qwen 27B
        try
        {
            _logger.LogInformation("[Live AI] Tier 3: Bitdeer Qwen/Qwen3.8-27B for '{Topic}' [{Diff}]...", topic, difficulty);
            var questions = await CallBitdeerModelAsync(topic, difficulty, count, "Qwen/Qwen3.8-27B");
            if (questions != null && questions.Count > 0)
            {
                _logger.LogInformation("[Live AI] SUCCESS: Generated {Count} questions via Bitdeer Qwen.", questions.Count);
                return questions;
            }
        }
        catch (Exception ex)
        {
            failureReasons.Add($"Bitdeer Qwen: {ex.Message}");
            _logger.LogError(ex, "[Live AI] All AI generation tiers failed for topic '{Topic}'.", topic);
        }

        throw new InvalidOperationException($"Gagal men-generate soal AI untuk topik '{topic}'. Detail error: [{string.Join(" | ", failureReasons)}].");
    }

    private async Task<List<GeneratedQuestionJsonItem>> CallGroqModelAsync(
        string topic,
        string difficulty,
        int count,
        string model)
    {
        var groqKey = _configuration["GROQ_API_KEY"] 
                      ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");

        if (string.IsNullOrWhiteSpace(groqKey))
        {
            throw new InvalidOperationException("GROQ_API_KEY belum dikonfigurasi.");
        }

        var promptInfo = BuildPrompt(topic, difficulty, count);

        // Max tokens 1400 is plenty for 10 compact JSON questions (~900 tokens actual usage)
        // Keeps us safely under Groq's 6,000 TPM limit!
        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = promptInfo.systemPrompt },
                new { role = "user", content = promptInfo.userPrompt }
            },
            response_format = new { type = "json_object" },
            max_tokens = 1400,
            temperature = 0.5,
            stream = false
        };

        using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(25));
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", groqKey);
        req.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var res = await _httpClient.SendAsync(req, cts.Token);
        var resJson = await res.Content.ReadAsStringAsync(cts.Token);

        if (!res.IsSuccessStatusCode)
        {
            // If Rate limited (429), wait 2.5s and retry once
            if ((int)res.StatusCode == 429)
            {
                _logger.LogWarning("[Groq] Rate limit (429) reached. Waiting 2.5s before retry...");
                await Task.Delay(2500);
                using var retryReq = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
                retryReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", groqKey);
                retryReq.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                var retryRes = await _httpClient.SendAsync(retryReq);
                var retryJson = await retryRes.Content.ReadAsStringAsync();
                if (!retryRes.IsSuccessStatusCode)
                {
                    throw new HttpRequestException($"Groq API returned {retryRes.StatusCode}: {retryJson}");
                }
                return ParseAiResponse(retryJson);
            }

            throw new HttpRequestException($"Groq API returned {res.StatusCode}: {resJson}");
        }

        return ParseAiResponse(resJson);
    }

    private async Task<List<GeneratedQuestionJsonItem>> CallBitdeerModelAsync(
        string topic,
        string difficulty,
        int count,
        string model)
    {
        var apiUrl = _configuration["AI_QUIZ_API_URL"] 
                     ?? Environment.GetEnvironmentVariable("AI_QUIZ_API_URL") 
                     ?? "https://api-inference.bitdeer.ai/v1/chat/completions";

        var apiKey = _configuration["AI_QUIZ_API_KEY"] 
                     ?? Environment.GetEnvironmentVariable("AI_QUIZ_API_KEY");

        var promptInfo = BuildPrompt(topic, difficulty, count);

        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = promptInfo.systemPrompt },
                new { role = "user", content = promptInfo.userPrompt }
            },
            max_tokens = 1500,
            temperature = 0.6,
            stream = false
        };

        using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(30));
        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        if (!requestMessage.Headers.Contains("X-API-Key"))
        {
            requestMessage.Headers.Add("X-API-Key", apiKey);
        }
        requestMessage.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(requestMessage, cts.Token);
        var responseJson = await response.Content.ReadAsStringAsync(cts.Token);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Bitdeer API returned {response.StatusCode}: {responseJson}");
        }

        return ParseAiResponse(responseJson);
    }

    private static (string systemPrompt, string userPrompt) BuildPrompt(string topic, string difficulty, int count)
    {
        var systemPrompt = @"You are a Senior Software Engineer & Vocational High School Examination Board Author for SMK Rekayasa Perangkat Lunak (RPL / PPLG).
Create strictly formal, academically sound multiple-choice questions for vocational software engineering students.
Output ONLY a valid JSON object matching the requested schema with no surrounding text.";

        var difficultyGuideline = difficulty.ToLower() switch
        {
            "easy" => "Tingkat Dasar (Kelas 10): Konsep fundamental, sintaks dasar, penamaan variabel, tag HTML/CSS, dan perintah dasar. Pertanyaan to-the-point dengan opsi teknis nyata.",
            "medium" => "Tingkat Menengah (Kelas 11): Alur logika kode 2-5 baris, trace output percabangan/perulangan/array, query SQL WHERE/JOIN, dan penggunaan method/fungsi.",
            "hard" => "Tingkat Terapan & Tantangan (Kelas 12): Analisis arsitektur REST API, keamanan aplikasi (OWASP, SQL Injection, JWT, sanitasi input), optimasi database, dan penanganan bug/error.",
            _ => "Tingkat kejuruan RPL yang aplikatif dan berbasis industri."
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
      ""question"": ""Teks pertanyaan teknis formal mengenai {topic}"",
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
1. Bahasa Indonesia formal & baku (EYD/PUEBI).
2. Soal 100% fokus pada topik '{topic}'.
3. Semua 4 opsi jawaban adalah istilah atau kode teknis nyata.
4. Kunci jawaban berada pada index 0.";

        return (systemPrompt, userPrompt);
    }

    private static List<GeneratedQuestionJsonItem> ParseAiResponse(string rawResponseJson)
    {
        if (string.IsNullOrWhiteSpace(rawResponseJson))
        {
            throw new FormatException("AI returned empty response.");
        }

        string? content = null;

        try
        {
            using var doc = JsonDocument.Parse(rawResponseJson);
            var root = doc.RootElement;

            // 1. Format OpenAI (choices[0].message.content)
            if (root.TryGetProperty("choices", out var choices) && choices.ValueKind == JsonValueKind.Array && choices.GetArrayLength() > 0)
            {
                var message = choices[0].GetProperty("message");
                if (message.TryGetProperty("content", out var contentElem) && contentElem.ValueKind == JsonValueKind.String)
                {
                    content = contentElem.GetString();
                }
                if (string.IsNullOrWhiteSpace(content) && message.TryGetProperty("reasoning_content", out var reasoningElem))
                {
                    content = reasoningElem.GetString();
                }
            }
            // 2. Format Direct JSON
            else if (root.TryGetProperty("questions", out var questionsProp) && questionsProp.ValueKind == JsonValueKind.Array)
            {
                content = rawResponseJson;
            }
        }
        catch
        {
            // rawResponseJson is plain text / markdown JSON string
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            content = rawResponseJson;
        }

        // Strip <think>...</think> reasoning blocks if present (from DeepSeek/Qwen)
        content = Regex.Replace(content, @"<think>[\s\S]*?</think>", "", RegexOptions.IgnoreCase).Trim();

        var cleanedJson = ExtractJsonBlock(content);

        // 1. Try parsing directly as JSON Array: [ { "question": ... }, ... ]
        if (cleanedJson.StartsWith("[") && cleanedJson.EndsWith("]"))
        {
            try
            {
                var directList = JsonSerializer.Deserialize<List<GeneratedQuestionJsonItem>>(cleanedJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (directList != null && directList.Count > 0)
                {
                    return directList;
                }
            }
            catch { /* Fall through to object parsing */ }
        }

        // 2. Try parsing as Envelope: { "questions": [ ... ] }
        using var parsedDoc = JsonDocument.Parse(cleanedJson);
        var parsedRoot = parsedDoc.RootElement;

        foreach (var propName in new[] { "questions", "soal", "items", "data", "quiz" })
        {
            if (parsedRoot.TryGetProperty(propName, out var arrayProp) && arrayProp.ValueKind == JsonValueKind.Array)
            {
                var list = JsonSerializer.Deserialize<List<GeneratedQuestionJsonItem>>(arrayProp.GetRawText(), new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (list != null && list.Count > 0)
                {
                    return list;
                }
            }
        }

        // 3. Fallback standard deserialization
        var envelope = JsonSerializer.Deserialize<GeneratedQuestionsBatchEnvelope>(cleanedJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (envelope?.questions == null || envelope.questions.Count == 0)
        {
            throw new FormatException($"Failed to deserialize AI JSON into questions list. Cleaned JSON: {cleanedJson}");
        }

        return envelope.questions;
    }

    private static string ExtractJsonBlock(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "{}";

        // Strategy 1: Match ```json ... ``` markdown block
        var match = Regex.Match(text, @"```(?:json)?\s*([\s\S]*?)\s*```", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            return match.Groups[1].Value.Trim();
        }

        // Strategy 2: Match outer [ ... ] if root is an array
        int firstBracket = text.IndexOf('[');
        int lastBracket = text.LastIndexOf(']');
        int firstBrace = text.IndexOf('{');
        int lastBrace = text.LastIndexOf('}');

        if (firstBracket >= 0 && lastBracket > firstBracket && (firstBrace < 0 || firstBracket < firstBrace))
        {
            return text.Substring(firstBracket, lastBracket - firstBracket + 1);
        }

        // Strategy 3: Match outer { ... }
        if (firstBrace >= 0 && lastBrace > firstBrace)
        {
            return text.Substring(firstBrace, lastBrace - firstBrace + 1);
        }

        return text.Trim();
    }

    /// <summary>
    /// Men-generate pool 30 soal harian (10 Easy, 10 Medium, 10 Hard) 100% dinamis dari AI secara bertahap & aman.
    /// Dilakukan bertingkat (Easy -> Medium -> Hard) dengan jeda 1.2 detik agar tidak menabrak batas TPM (Tokens Per Minute) Groq.
    /// </summary>
    public async Task<List<DailyQuizQuestion>> GenerateInitialDailyPoolAsync(
        DateOnly date,
        string topic,
        string? model = null,
        string? provider = null)
    {
        // 1. Bersihkan soal lama pada tanggal ini
        var existing = await _context.DailyQuizQuestions
            .Where(q => q.TargetDate == date)
            .ToListAsync();

        if (existing.Count > 0)
        {
            _context.DailyQuizQuestions.RemoveRange(existing);
            await _context.SaveChangesAsync();
            _logger.LogInformation("[AI Generator] Wiped {Count} previous questions for date {Date}.", existing.Count, date);
        }

        _logger.LogInformation("[AI Generator] Generating 100% Full Dynamic AI Daily Pool (30 Questions) for date {Date} topic '{Topic}' using model '{Model}'...", date, topic, model ?? "default");

        // Inisialisasi progress bar (Total 3 langkah: Easy, Medium, Hard)
        _status.Start(3);

        var allItems = new List<DailyQuizQuestion>();
        var seenQuestions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void AddChunkToPool(List<GeneratedQuestionJsonItem> chunk, string diff, int targetCount)
        {
            int added = 0;
            foreach (var item in chunk)
            {
                var qText = item.question?.Trim();
                if (string.IsNullOrWhiteSpace(qText) || seenQuestions.Contains(qText)) continue;
                seenQuestions.Add(qText);
                allItems.Add(MapToEntity(item, date, topic, allItems.Count + 1, diff));
                added++;
                if (added >= targetCount) break;
            }
        }

        try
        {
            // 2. Generate Easy (10 soal) -> update progress 1/3
            _logger.LogInformation("[AI Generator] Generating Step 1/3 (10 Easy Questions) via Live AI for '{Topic}'...", topic);
            var chunkEasy = await GenerateQuestionsChunkAsync(topic, "easy", 10, model, provider);
            AddChunkToPool(chunkEasy, "easy", 10);
            _status.Increment();

            // Jeda 1.2s untuk reset TPM window Groq
            await Task.Delay(1200);

            // 3. Generate Medium (10 soal) -> update progress 2/3
            _logger.LogInformation("[AI Generator] Generating Step 2/3 (10 Medium Questions) via Live AI for '{Topic}'...", topic);
            var chunkMedium = await GenerateQuestionsChunkAsync(topic, "medium", 10, model, provider);
            AddChunkToPool(chunkMedium, "medium", 10);
            _status.Increment();

            // Jeda 1.2s untuk reset TPM window Groq
            await Task.Delay(1200);

            // 4. Generate Hard (10 soal) -> update progress 3/3
            _logger.LogInformation("[AI Generator] Generating Step 3/3 (10 Hard Questions) via Live AI for '{Topic}'...", topic);
            var chunkHard = await GenerateQuestionsChunkAsync(topic, "hard", 10, model, provider);
            AddChunkToPool(chunkHard, "hard", 10);
            _status.Increment();
        }
        catch (Exception ex)
        {
            _status.Finish();
            _logger.LogError(ex, "[AI Generator] Failed while generating 30 daily questions pool for topic '{Topic}'.", topic);
            throw;
        }

        // Penomoran berurutan 1..30
        for (int i = 0; i < allItems.Count; i++)
        {
            allItems[i].QuestionNumber = i + 1;
        }

        // 5. Simpan seluruh 30 soal murni AI ke Database
        _context.DailyQuizQuestions.AddRange(allItems);
        await _context.SaveChangesAsync();

        _status.Finish();
        _logger.LogInformation("[AI Generator] SUCCESS: Saved {Count} 100% pure live AI questions to database for date {Date}.", allItems.Count, date);
        return allItems;
    }

    public async Task<List<DailyQuizQuestion>> GenerateEndlessBatchAsync(
        DateOnly date,
        string topic,
        int startQuestionNumber,
        int count = 10)
    {
        _logger.LogInformation("[AI Generator] Generating Endless Batch of {Count} Questions via Live AI for date {Date} starting at #{StartNumber}...", count, date, startQuestionNumber);

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

    private static DailyQuizQuestion MapToEntity(
        GeneratedQuestionJsonItem item,
        DateOnly date,
        string topic,
        int number,
        string defaultDifficulty)
    {
        var rawOptions = item.options != null && item.options.Count == 4
            ? item.options.ToList()
            : new List<string> { "Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D" };

        var originalCorrectIndex = Math.Clamp(item.correct_answer_index, 0, 3);
        var correctOptionText = rawOptions[originalCorrectIndex];

        // Acak opsi jawaban (shuffle) agar kunci jawaban tersebar merata di A, B, C, D
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
}
