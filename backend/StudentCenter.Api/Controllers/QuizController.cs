using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuizController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly IDailyTopicService _topicService;
    private readonly IAiQuizGeneratorService _aiGenerator;

    public QuizController(
        IQuizService quizService,
        IDailyTopicService topicService,
        IAiQuizGeneratorService aiGenerator)
    {
        _quizService = quizService;
        _topicService = topicService;
        _aiGenerator = aiGenerator;
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
}

public class StartQuizRequest
{
    public DateOnly? TargetDate { get; set; }
}
