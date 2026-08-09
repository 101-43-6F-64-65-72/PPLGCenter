using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.Interfaces;

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
    private readonly HttpClient _httpClient;

    public UploadController(
        IWebHostEnvironment environment,
        IConfiguration configuration,
        IFileStorageService fileStorageService)
    {
        _environment = environment;
        _configuration = configuration;
        _fileStorageService = fileStorageService;
        _httpClient = new HttpClient();
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

        if (!AllowedExtensions.Contains(extension) || !AllowedMimeTypes.Contains(file.ContentType))
        {
            return BadRequest(ApiResponse<object>.Fail("Only JPG, PNG, WEBP, GIF images, and PDF documents are allowed."));
        }

        var isPdf = string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase);

        // ── PDF UPLOAD PATH: SUPABASE STORAGE ──
        if (isPdf)
        {
            var folder = string.IsNullOrWhiteSpace(request.Folder) ? "proposals" : request.Folder.Trim();

            if (_fileStorageService.IsConfigured)
            {
                try
                {
                    using var stream = file.OpenReadStream();
                    var storagePath = await _fileStorageService.UploadPdfAsync(stream, file.FileName, file.ContentType, folder);
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
                    Console.WriteLine($"[Supabase PDF Upload Error] {ex.Message}");
                    return BadRequest(ApiResponse<object>.Fail($"Gagal mengunggah dokumen PDF: {ex.Message}"));
                }
            }
            else
            {
                return BadRequest(ApiResponse<object>.Fail("Layanan penyimpanan PDF belum dikonfigurasi pada server."));
            }
        }

        // ── IMAGE & FALLBACK FILE UPLOAD PATH: CLOUDINARY OR LOCAL DISK ──
        var cloudName = _configuration["Cloudinary:CloudName"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
        var apiKey = _configuration["Cloudinary:ApiKey"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
        var apiSecret = _configuration["Cloudinary:ApiSecret"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

        if (!string.IsNullOrWhiteSpace(cloudName) && !string.IsNullOrWhiteSpace(apiKey) && !string.IsNullOrWhiteSpace(apiSecret))
        {
            try
            {
                var cloudinaryUrl = await UploadToCloudinaryAsync(file, cloudName, apiKey, apiSecret);
                if (!string.IsNullOrEmpty(cloudinaryUrl))
                {
                    return Ok(ApiResponse<UploadResponse>.Ok("File berhasil diunggah.", new UploadResponse
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
                Console.WriteLine($"[Cloudinary Upload Error] {ex.Message}. Falling back to local storage.");
            }
        }

        // Fallback: Local Disk Storage
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
            ?? Environment.GetEnvironmentVariable("PUBLIC_BASE_URL");

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
    /// Generates a signed URL for a private file object path.
    /// </summary>
    [HttpGet("signed-url")]
    [Authorize]
    public async Task<IActionResult> GetSignedUrl([FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return BadRequest(ApiResponse<object>.Fail("Path file is required."));
        }

        var signedUrl = await _fileStorageService.CreateSignedUrlAsync(path);
        return Ok(ApiResponse<object>.Ok("Signed URL generated.", new { Url = signedUrl }));
    }

    private async Task<string?> UploadToCloudinaryAsync(IFormFile file, string cloudName, string apiKey, string apiSecret)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var stringToSign = $"timestamp={timestamp}{apiSecret}";
        
        using var sha1 = SHA1.Create();
        var hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
        var signature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

        using var content = new MultipartFormDataContent();
        
        using var stream = file.OpenReadStream();
        var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
        
        content.Add(fileContent, "file", file.FileName);
        content.Add(new StringContent(apiKey), "api_key");
        content.Add(new StringContent(timestamp), "timestamp");
        content.Add(new StringContent(signature), "signature");

        var uploadUrl = $"https://api.cloudinary.com/v1_1/{cloudName}/auto/upload";
        var response = await _httpClient.PostAsync(uploadUrl, content);

        if (!response.IsSuccessStatusCode)
        {
            var errorResponse = await response.Content.ReadAsStringAsync();
            throw new Exception($"Cloudinary API returned {response.StatusCode}: {errorResponse}");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonResponse);
        if (doc.RootElement.TryGetProperty("secure_url", out var secureUrlProp))
        {
            return secureUrlProp.GetString();
        }
        if (doc.RootElement.TryGetProperty("url", out var urlProp))
        {
            return urlProp.GetString();
        }

        return null;
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


