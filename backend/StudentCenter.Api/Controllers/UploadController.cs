using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.Interfaces;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Api.Controllers;

public class UploadFileRequest
{
    public IFormFile? File { get; set; }
    public string? Folder { get; set; }
}

/// <summary>
/// Production Image and Document Upload Controller supporting Supabase Storage for PDFs and Cloudinary/Local for Images.
/// </summary>
[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.ms-excel"
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
        ".pdf",
        ".docx",
        ".doc",
        ".xlsx",
        ".xls"
    };

    private static readonly HashSet<string> ExecutableExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".dll", ".sh", ".php", ".asp", ".aspx", ".js", ".bat", ".cmd", ".py", ".rb", ".cgi", ".pl", ".vbs", ".ps1"
    };

    private const long MaxFileSizeInBytes = 10 * 1024 * 1024; // 10MB

    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly AppDbContext _context;

    public UploadController(
        IWebHostEnvironment environment,
        IConfiguration configuration,
        IFileStorageService fileStorageService,
        ICloudinaryService cloudinaryService,
        AppDbContext context)
    {
        _environment = environment;
        _configuration = configuration;
        _fileStorageService = fileStorageService;
        _cloudinaryService = cloudinaryService;
        _context = context;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    private string? GetUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value;
    }

    /// <summary>
    /// Uploads an image (Cloudinary/Local) or PDF document (Supabase Storage).
    /// </summary>
    [HttpPost]
    [Authorize]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<UploadResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadFile([FromForm] UploadFileRequest request)
    {
        var file = request.File;
        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<object>.Fail("File is required."));
        }

        if (file.Length > MaxFileSizeInBytes)
        {
            return BadRequest(ApiResponse<object>.Fail("Ukuran file melebihi batas maksimum 10 MB."));
        }

        var extension = Path.GetExtension(file.FileName);

        if (string.IsNullOrEmpty(extension) || ExecutableExtensions.Contains(extension))
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid file type. Executable files are prohibited."));
        }

        var isPdf = string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(file.ContentType, "application/x-pdf", StringComparison.OrdinalIgnoreCase);

        var isAllowedMime = AllowedMimeTypes.Contains(file.ContentType) ||
                            (isPdf && (string.Equals(file.ContentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(file.ContentType)));

        if (!AllowedExtensions.Contains(extension) || !isAllowedMime)
        {
            return BadRequest(ApiResponse<object>.Fail("Only JPG, PNG, WEBP, GIF images, and PDF documents are allowed."));
        }

        // ── PDF UPLOAD PATH: SUPABASE STORAGE (WITH LOCAL FALLBACK) ──
        if (isPdf)
        {
            var pdfFolder = string.IsNullOrWhiteSpace(request.Folder) ? "proposals" : request.Folder.Trim();

            if (_fileStorageService.IsConfigured)
            {
                try
                {
                    using var stream = file.OpenReadStream();
                    var storagePath = await _fileStorageService.UploadPdfAsync(stream, file.FileName, file.ContentType, pdfFolder);
                    var signedUrl = await _fileStorageService.CreateSignedUrlAsync(storagePath);

                    return Ok(ApiResponse<UploadResponse>.Ok("Dokumen berhasil diunggah.", new UploadResponse
                    {
                        Url = signedUrl,
                        Path = storagePath,
                        FileName = file.FileName,
                        Size = file.Length,
                        MimeType = file.ContentType
                    }));
                }
                catch (ArgumentException ex)
                {
                    return BadRequest(ApiResponse<object>.Fail(ex.Message));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Supabase PDF Upload Warning, falling back to local disk] {ex.Message}");
                }
            }
        }

        // ── IMAGE UPLOAD PATH: CLOUDINARY OR LOCAL DISK FALLBACK ──
        var imageFolder = string.IsNullOrWhiteSpace(request.Folder) ? "images" : request.Folder.Trim();

        if (_cloudinaryService.IsConfigured)
        {
            try
            {
                using var stream = file.OpenReadStream();
                var cloudinaryUrl = await _cloudinaryService.UploadImageAsync(stream, file.FileName, file.ContentType, imageFolder);

                if (!string.IsNullOrEmpty(cloudinaryUrl))
                {
                    return Ok(ApiResponse<UploadResponse>.Ok("Gambar berhasil diunggah ke Cloudinary.", new UploadResponse
                    {
                        Url = cloudinaryUrl,
                        Path = cloudinaryUrl,
                        FileName = file.FileName,
                        Size = file.Length,
                        MimeType = file.ContentType
                    }));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Cloudinary Upload Error] {ex.Message}");
                if (!_environment.IsDevelopment())
                {
                    return BadRequest(ApiResponse<object>.Fail($"Gagal mengunggah gambar ke Cloudinary: {ex.Message}"));
                }
            }
        }

        // Local Disk Storage (Fallback for local dev if Cloudinary is not configured)
        var uploadPathEnv = _configuration["UPLOAD_PATH"]
            ?? Environment.GetEnvironmentVariable("UPLOAD_PATH");

        var uploadsFolder = !string.IsNullOrWhiteSpace(uploadPathEnv)
            ? (Path.IsPathRooted(uploadPathEnv) ? uploadPathEnv : Path.Combine(_environment.ContentRootPath, uploadPathEnv))
            : Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads");

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var publicBaseUrl = _configuration["PUBLIC_BASE_URL"] 
            ?? Environment.GetEnvironmentVariable("PUBLIC_BASE_URL")
            ?? _configuration["APP_BASE_URL"]
            ?? Environment.GetEnvironmentVariable("APP_BASE_URL")
            ?? _configuration["AppBaseUrl"];

        string baseUrl;
        if (!string.IsNullOrWhiteSpace(publicBaseUrl))
        {
            baseUrl = publicBaseUrl.TrimEnd('/');
        }
        else
        {
            var scheme = Request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? Request.Scheme;
            if (string.Equals(scheme, "http", StringComparison.OrdinalIgnoreCase) &&
                !Request.Host.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) &&
                !Request.Host.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
            {
                scheme = "https";
            }
            baseUrl = $"{scheme}://{Request.Host}";

            if (!_environment.IsDevelopment() && (baseUrl.Contains("localhost") || baseUrl.Contains("127.0.0.1")))
            {
                baseUrl = "https://pplgcenter.onrender.com";
            }
        }

        var fileUrl = $"{baseUrl}/uploads/{uniqueFileName}";

        return Ok(ApiResponse<UploadResponse>.Ok("File berhasil diunggah.", new UploadResponse
        {
            Url = fileUrl,
            Path = fileUrl,
            FileName = uniqueFileName,
            Size = file.Length,
            MimeType = file.ContentType
        }));
    }

    /// <summary>
    /// Generates a signed URL for a private file object path after verifying user authorization.
    /// </summary>
    [HttpGet("signed-url")]
    [Authorize]
    public async Task<IActionResult> GetSignedUrl([FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return BadRequest(ApiResponse<object>.Fail("Path file is required."));
        }

        var userId = GetUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(ApiResponse<object>.Fail("User is not authenticated."));
        }

        var role = GetUserRole();
        bool isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);

        if (!isAdmin)
        {
            var normalizedPath = path.Trim();

            // Verify access across entities matching this path
            bool isProposalAccess = await _context.Proposals.AsNoTracking().AnyAsync(p =>
                (p.FileUrl == normalizedPath || (p.FileUrl != null && p.FileUrl.EndsWith(normalizedPath))) &&
                (p.SubmittedByUserId == userId || p.ReviewedByUserId == userId));

            bool isSubmissionAccess = await _context.Submissions.AsNoTracking().AnyAsync(s =>
                (s.FileUrl == normalizedPath || (s.FileUrl != null && s.FileUrl.EndsWith(normalizedPath))) &&
                (s.StudentId == userId || (s.Assignment != null && s.Assignment.CreatedByUserId == userId)));

            bool isMessageAttachmentAccess = await _context.MessageAttachments.AsNoTracking().AnyAsync(m =>
                (m.Url == normalizedPath || (m.Url != null && m.Url.EndsWith(normalizedPath))) &&
                m.Message.Conversation.Members.Any(cm => cm.UserId == userId));

            bool isDiscussionReplyAccess = await _context.DiscussionReplies.AsNoTracking().AnyAsync(r =>
                (r.AttachmentUrl == normalizedPath || (r.AttachmentUrl != null && r.AttachmentUrl.EndsWith(normalizedPath))) &&
                (r.CreatedByUserId == userId ||
                 _context.Users.Any(u => u.Id == userId && u.ClassId.HasValue && u.ClassId == r.Thread.ClassSubject.ClassId) ||
                 r.Thread.ClassSubject.TeacherSubject.TeacherId == userId));

            bool isLessonMaterialAccess = await _context.LessonMaterials.AsNoTracking().AnyAsync(m =>
                (m.FileUrl == normalizedPath || (m.FileUrl != null && m.FileUrl.EndsWith(normalizedPath))) &&
                (m.CreatedBy == userId ||
                 m.ClassSubject.TeacherSubject.TeacherId == userId ||
                 _context.Users.Any(u => u.Id == userId && u.ClassId.HasValue && u.ClassId == m.ClassSubject.ClassId)));

            if (!isProposalAccess && !isSubmissionAccess && !isMessageAttachmentAccess && !isDiscussionReplyAccess && !isLessonMaterialAccess)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Anda tidak memiliki izin untuk mengakses file ini."));
            }
        }

        var signedUrl = await _fileStorageService.CreateSignedUrlAsync(path);
        return Ok(ApiResponse<object>.Ok("Signed URL generated.", new { Url = signedUrl }));
    }
}

public class UploadResponse
{
    public string Url { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long Size { get; set; }
    public string MimeType { get; set; } = string.Empty;
}


