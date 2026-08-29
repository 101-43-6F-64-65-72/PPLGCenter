using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuizController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly IDailyTopicService _topicService;
    private readonly IAiQuizGeneratorService _aiGenerator;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<QuizController> _logger;
    private readonly IGenerationStatusService _generationStatus;

    public QuizController(
        IQuizService quizService,
        IDailyTopicService topicService,
        IAiQuizGeneratorService aiGenerator,
        AppDbContext context,
        IConfiguration configuration,
        ILogger<QuizController> logger,
        IGenerationStatusService generationStatus)
    {
        _quizService = quizService;
        _topicService = topicService;
        _aiGenerator = aiGenerator;
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _generationStatus = generationStatus;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    private string GetCurrentUserName()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value 
               ?? User.FindFirst("name")?.Value 
               ?? User.FindFirst("FullName")?.Value 
               ?? "Pengguna";
    }

    private static DateOnly GetWibDate()
    {
        // Convert UTC to WIB (UTC+7)
        var wibTime = DateTime.UtcNow.AddHours(7);
        return DateOnly.FromDateTime(wibTime);
    }

    /// <summary>
    /// Admin: Polling status progres generasi soal AI (dipanggil tiap 2 detik dari frontend)
    /// </summary>
    [HttpGet("admin/generation-status")]
    [AllowAnonymous]
    public IActionResult GetGenerationStatus()
    {
        return Ok(new
        {
            inProgress = _generationStatus.IsRunning,
            completed  = _generationStatus.Completed,
            total      = _generationStatus.Total
        });
    }

    /// <summary>
    /// Ambil informasi tema & status kuis harian hari ini
    /// </summary>
    [HttpGet("today")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTodayQuizInfo([FromQuery] string? date)
    {
        var targetDate = !string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var parsed)
            ? parsed
            : GetWibDate();

        var userId = GetCurrentUserId();
        try
        {
            var result = await _quizService.GetTodayQuizInfoAsync(targetDate, userId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message, detail = ex.ToString() });
        }
    }

    /// <summary>
    /// Mulai sesi kuis harian baru (3 Nyawa ❤️❤️❤️)
    /// </summary>
    [HttpPost("start")]
    public async Task<IActionResult> StartQuizSession([FromBody] StartQuizRequest? request)
    {
        var targetDate = request?.TargetDate ?? GetWibDate();
        var userId = GetCurrentUserId();

        if (userId == Guid.Empty)
        {
            return Unauthorized(new { success = false, message = "Sesi login tidak valid. Silakan login kembali." });
        }

        try
        {
            var result = await _quizService.StartQuizSessionAsync(targetDate, userId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message, detail = ex.ToString() });
        }
    }

    /// <summary>
    /// Ambil soal aktif saat ini untuk sesi kuis (Anti-Cheat: Kunci jawaban dirahasiakan)
    /// </summary>
    [HttpGet("session/{id:guid}/question")]
    public async Task<IActionResult> GetCurrentQuestion(Guid id)
    {
        var userId = GetCurrentUserId();
        try
        {
            var result = await _quizService.GetCurrentQuestionAsync(id, userId);

            if (result == null)
            {
                return NotFound(new { success = false, message = "Soal kuis tidak ditemukan atau sesi telah selesai." });
            }

            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Kirim jawaban soal -> Validasi skor, pengurangan nyawa, dan fetch soal berikutnya
    /// </summary>
    [HttpPost("session/{id:guid}/submit")]
    public async Task<IActionResult> SubmitAnswer(Guid id, [FromBody] SubmitAnswerRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        try
        {
            var result = await _quizService.SubmitAnswerAsync(id, request, userId);
            return Ok(new { success = true, data = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Selesai / Kibarkan Bendera Putih (Menyerah Terhormat & Kunci Skor yang Diraih)
    /// </summary>
    [HttpPost("session/{id:guid}/surrender")]
    public async Task<IActionResult> SurrenderSession(Guid id)
    {
        var userId = GetCurrentUserId();
        try
        {
            var result = await _quizService.SurrenderSessionAsync(id, userId);
            return Ok(new { success = true, message = "Sesi berhasil diselesaikan dan skor Anda telah dikunci ke leaderboard!", data = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Papan Peringkat Harian (Daily Leaderboard)
    /// </summary>
    [HttpGet("leaderboard/daily")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDailyLeaderboard([FromQuery] string? date, [FromQuery] int limit = 50)
    {
        var targetDate = !string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var parsed)
            ? parsed
            : GetWibDate();

        var result = await _quizService.GetDailyLeaderboardAsync(targetDate, Math.Clamp(limit, 1, 100));
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Papan Peringkat Sepanjang Masa (All-Time Hall of Fame)
    /// </summary>
    [HttpGet("leaderboard/all-time")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllTimeLeaderboard([FromQuery] int limit = 50)
    {
        var result = await _quizService.GetAllTimeLeaderboardAsync(Math.Clamp(limit, 1, 100));
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Profil & Statistik Kuis Pengguna (Streak, Total Skor, Akurasi)
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetMyQuizProfile()
    {
        var userId = GetCurrentUserId();
        var result = await _quizService.GetUserQuizStatsAsync(userId);
        return Ok(new { success = true, data = result });
    }

    // ── Teacher / Admin Daily Topic Pipeline ─────────────────────────────────────

    /// <summary>
    /// Guru / Admin mengajukan tema kuis harian untuk tanggal tertentu (D-1)
    /// </summary>
    [HttpPost("topics/propose")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> ProposeTopic([FromBody] ProposeTopicRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var teacherId = GetCurrentUserId();
        var teacherName = GetCurrentUserName();

        var result = await _topicService.ProposeTopicAsync(request.TargetDate, request.TopicName, request.Description, teacherId, teacherName);
        return Ok(new { success = true, message = "Tema berhasil diajukan untuk proses voting.", data = result });
    }

    /// <summary>
    /// Guru memberikan voting untuk tema harian
    /// </summary>
    [HttpPost("topics/{id:guid}/vote")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> VoteTopic(Guid id)
    {
        var teacherId = GetCurrentUserId();
        var isVoted = await _topicService.VoteTopicAsync(id, teacherId);

        return Ok(new
        {
            success = true,
            message = isVoted ? "Vote berhasil ditambahkan." : "Vote dibatalkan.",
            hasVoted = isVoted
        });
    }

    /// <summary>
    /// Ambil daftar tema yang diajukan untuk tanggal tertentu
    /// </summary>
    [HttpGet("topics")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> GetTopics([FromQuery] string? date)
    {
        var targetDate = !string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var parsed)
            ? parsed
            : GetWibDate().AddDays(1); // Default is tomorrow (D-1 view)

        var userId = GetCurrentUserId();
        var result = await _topicService.GetTopicsForDateAsync(targetDate, userId);

        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Finalisasi tema & trigger AI pre-generation 30 soal (Admin trigger manual / cron)
    /// </summary>
    [HttpPost("topics/finalize")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> FinalizeTopic([FromQuery] string? date)
    {
        var targetDate = !string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var parsed)
            ? parsed
            : GetWibDate();

        var winner = await _topicService.FinalizeDailyTopicAsync(targetDate);
        var questions = await _aiGenerator.GenerateInitialDailyPoolAsync(targetDate, winner.TopicName);

        return Ok(new
        {
            success = true,
            message = $"Tema '{winner.TopicName}' berhasil difinalisasi dan {questions.Count} soal AI telah dibuat.",
            topic = winner,
            questionsCount = questions.Count
        });
    }

    /// <summary>
    /// Admin: Acak topik baru hari ini dan langsung buat 30 soal baru dari AI
    /// </summary>
    [HttpPost("admin/refresh-topic")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshRandomTopic([FromBody] RefreshTopicRequest? request)
    {
        try
        {
            var today = GetWibDate();
            var newTopic = await _topicService.PickRandomTopicAsync(today);
            var questions = await _aiGenerator.GenerateInitialDailyPoolAsync(today, newTopic.TopicName, request?.Model, request?.Provider);

            return Ok(new
            {
                success = true,
                message = $"Topik hari ini berhasil diacak menjadi: '{newTopic.TopicName}' dengan {questions.Count} butir soal AI baru.",
                topic = newTopic.TopicName,
                questionsCount = questions.Count,
                questions = questions.Select(q => new
                {
                    id = q.Id,
                    questionNumber = q.QuestionNumber,
                    difficulty = q.Difficulty,
                    questionText = q.QuestionText,
                    codeSnippet = q.CodeSnippet,
                    options = string.IsNullOrWhiteSpace(q.OptionsJson) 
                        ? new List<string>() 
                        : JsonSerializer.Deserialize<List<string>>(q.OptionsJson),
                    correctAnswerIndex = q.CorrectAnswerIndex,
                    explanation = q.Explanation
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred in RefreshRandomTopic.");
            return StatusCode(500, new { success = false, message = ex.Message, detail = ex.ToString() });
        }
    }

    /// <summary>
    /// Admin: Pertahankan topik saat ini tapi generate ulang 30 soal baru dari AI
    /// </summary>
    [HttpPost("admin/refresh-questions")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshQuestions([FromBody] RefreshTopicRequest? request)
    {
        try
        {
            var today = GetWibDate();
            var currentTopic = await _topicService.GetSelectedTopicNameAsync(today);
            var questions = await _aiGenerator.GenerateInitialDailyPoolAsync(today, currentTopic, request?.Model, request?.Provider);

            return Ok(new
            {
                success = true,
                message = $"Berhasil men-generate ulang {questions.Count} butir soal AI baru untuk topik: '{currentTopic}'.",
                topic = currentTopic,
                questionsCount = questions.Count,
                questions = questions.Select(q => new
                {
                    id = q.Id,
                    questionNumber = q.QuestionNumber,
                    difficulty = q.Difficulty,
                    questionText = q.QuestionText,
                    codeSnippet = q.CodeSnippet,
                    options = string.IsNullOrWhiteSpace(q.OptionsJson) 
                        ? new List<string>() 
                        : JsonSerializer.Deserialize<List<string>>(q.OptionsJson),
                    correctAnswerIndex = q.CorrectAnswerIndex,
                    explanation = q.Explanation
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred in RefreshQuestions.");
            return StatusCode(500, new { success = false, message = ex.Message, detail = ex.ToString() });
        }
    }

    /// <summary>
    /// Admin: Atur topik kustom dan langsung generate 30 soal baru dari AI
    /// </summary>
    [HttpPost("admin/set-topic-and-generate")]
    [AllowAnonymous]
    public async Task<IActionResult> SetTopicAndGenerate([FromBody] SetTopicAndGenerateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.TopicName))
        {
            return BadRequest(new { success = false, message = "Nama topik kuis tidak boleh kosong." });
        }

        try
        {
            var today = GetWibDate();

            // Archive old topics for today
            var existingTopics = await _context.DailyQuizTopics
                .Where(t => t.TargetDate == today)
                .ToListAsync();

            foreach (var t in existingTopics)
            {
                t.Status = "Archived";
            }

            var newTopic = new DailyQuizTopic
            {
                Id = Guid.NewGuid(),
                TargetDate = today,
                TopicName = request.TopicName.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) 
                    ? "Topik kuis pilihan kurikulum Rekayasa Perangkat Lunak SMK Negeri 2 Surakarta." 
                    : request.Description.Trim(),
                ProposedByUserId = null,
                ProposedByUserName = "Administrator",
                VotesCount = 0,
                Status = "Selected",
                CreatedAt = DateTime.UtcNow
            };

            _context.DailyQuizTopics.Add(newTopic);
            await _context.SaveChangesAsync();

            var questions = await _aiGenerator.GenerateInitialDailyPoolAsync(today, newTopic.TopicName, request.Model, request.Provider);

            return Ok(new
            {
                success = true,
                message = $"Topik berhasil diatur ke '{newTopic.TopicName}' dan {questions.Count} soal AI telah dibuat!",
                topic = newTopic.TopicName,
                questionsCount = questions.Count,
                model = request.Model ?? "deepseek-ai/DeepSeek-V4-Flash",
                questions = questions.Select(q => new
                {
                    id = q.Id,
                    questionNumber = q.QuestionNumber,
                    difficulty = q.Difficulty,
                    questionText = q.QuestionText,
                    codeSnippet = q.CodeSnippet,
                    options = string.IsNullOrWhiteSpace(q.OptionsJson) 
                        ? new List<string>() 
                        : JsonSerializer.Deserialize<List<string>>(q.OptionsJson),
                    correctAnswerIndex = q.CorrectAnswerIndex,
                    explanation = q.Explanation
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred in SetTopicAndGenerate.");
            return StatusCode(500, new { success = false, message = ex.Message, detail = ex.ToString() });
        }
    }

    /// <summary>
    /// Reset dan bersihkan seluruh data kuis untuk memulai ulang alur dari awal
    /// </summary>
    [HttpPost("reset")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetAllQuizData()
    {
        try
        {
            _context.QuizSessions.RemoveRange(_context.QuizSessions);
            _context.DailyQuizQuestions.RemoveRange(_context.DailyQuizQuestions);
            _context.DailyTopicVotes.RemoveRange(_context.DailyTopicVotes);
            _context.DailyQuizTopics.RemoveRange(_context.DailyQuizTopics);
            _context.UserQuizStats.RemoveRange(_context.UserQuizStats);
            await _context.SaveChangesAsync();

            var today = GetWibDate();
            var winner = await _topicService.FinalizeDailyTopicAsync(today);
            var questions = await _aiGenerator.GenerateInitialDailyPoolAsync(today, winner.TopicName);

            return Ok(new
            {
                success = true,
                message = $"Seluruh data kuis telah direset. Topik baru: '{winner.TopicName}' dengan {questions.Count} soal baru siap dimainkan.",
                topic = winner.TopicName,
                questionsCount = questions.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred in ResetAllQuizData.");
            return StatusCode(500, new { success = false, message = ex.Message, detail = ex.ToString() });
        }
    }

    /// <summary>
    /// Admin / Dev: Uji koneksi dan kualitas AI secara hemat token
    /// </summary>
    [HttpPost("admin/test-ai")]
    [AllowAnonymous]
    public async Task<IActionResult> TestAiConnection([FromBody] TestAiRequest? request)
    {
        var provider = request?.Provider?.ToLower() ?? "groq";
        var testMode = request?.TestMode?.ToLower() ?? "ping"; // "ping" or "single_question"
        var topic = string.IsNullOrWhiteSpace(request?.Topic) ? "Clean Code & Refactoring" : request.Topic.Trim();

        var apiUrl = !string.IsNullOrWhiteSpace(request?.ApiUrl) 
            ? request.ApiUrl.Trim() 
            : (provider == "groq" 
                ? "https://api.groq.com/openai/v1/chat/completions" 
                : "https://api-inference.bitdeer.ai/v1/chat/completions");

        var apiKey = !string.IsNullOrWhiteSpace(request?.ApiKey)
            ? request.ApiKey.Trim()
            : (provider == "groq" 
                ? (_configuration["GROQ_API_KEY"] ?? Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? "")
                : (_configuration["AI_QUIZ_API_KEY"] ?? Environment.GetEnvironmentVariable("AI_QUIZ_API_KEY") ?? "5oLjI4spiQXfs7pBwg78"));

        var model = !string.IsNullOrWhiteSpace(request?.Model)
            ? request.Model.Trim()
            : (provider == "groq" ? "llama-3.1-8b-instant" : "Qwen/Qwen3.8-27B");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return BadRequest(new { success = false, message = "API Key tidak ditemukan atau kosong. Silakan masukkan API Key di formulir." });
        }

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        object requestBody;
        if (testMode == "ping")
        {
            // Super low token test (~15 tokens total)
            requestBody = new
            {
                model = model,
                messages = new[]
                {
                    new { role = "user", content = "Output JSON strictly: {\"status\": \"ok\", \"model\": \"" + model + "\"}" }
                },
                max_tokens = 60,
                temperature = 0.1
            };
        }
        else
        {
            // 1 question low-token test (~120 tokens total)
            requestBody = new
            {
                model = model,
                messages = new[]
                {
                    new { role = "system", content = "You are a SMK RPL exam author. Output strictly valid JSON object with key 'questions' containing 1 question array." },
                    new { role = "user", content = "Buat 1 butir soal pilihan ganda standar SMK RPL topik: '" + topic + "'. Format JSON WAJIB: {\"questions\": [{\"topic\": \"" + topic + "\", \"difficulty\": \"easy\", \"question\": \"...\", \"code_snippet\": null, \"options\": [\"Opsi Benar\", \"Pengecoh 1\", \"Pengecoh 2\", \"Pengecoh 3\"], \"correct_answer_index\": 0, \"explanation\": \"...\"}]}" }
                },
                max_tokens = 1000,
                temperature = 0.5
            };
        }

        try
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(25) };
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            httpRequest.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await httpClient.SendAsync(httpRequest);
            stopwatch.Stop();
            var responseContent = await response.Content.ReadAsStringAsync();

            return Ok(new
            {
                success = response.IsSuccessStatusCode,
                statusCode = (int)response.StatusCode,
                latencyMs = stopwatch.ElapsedMilliseconds,
                provider = provider,
                model = model,
                apiUrl = apiUrl,
                testMode = testMode,
                rawResponse = responseContent
            });
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return Ok(new
            {
                success = false,
                statusCode = 0,
                latencyMs = stopwatch.ElapsedMilliseconds,
                provider = provider,
                model = model,
                apiUrl = apiUrl,
                testMode = testMode,
                error = ex.Message,
                rawResponse = ex.ToString()
            });
        }
    }
}

public class StartQuizRequest
{
    public DateOnly? TargetDate { get; set; }
}

public class SetTopicAndGenerateRequest
{
    public string TopicName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Model { get; set; }
    public string? Provider { get; set; }
}

public class RefreshTopicRequest
{
    public string? Model { get; set; }
    public string? Provider { get; set; }
}

public class TestAiRequest
{
    public string? Provider { get; set; }
    public string? ApiUrl { get; set; }
    public string? ApiKey { get; set; }
    public string? Model { get; set; }
    public string? TestMode { get; set; }
    public string? Topic { get; set; }
}
