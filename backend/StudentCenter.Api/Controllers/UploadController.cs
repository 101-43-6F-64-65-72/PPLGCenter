using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

public class UploadFileRequest
{
    public IFormFile? File { get; set; }
}

/// <summary>
/// Production Image and Document Upload Controller supporting Cloudinary Direct Upload with Local Fallback.
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
    private readonly HttpClient _httpClient;

    public UploadController(IWebHostEnvironment environment, IConfiguration configuration)
    {
        _environment = environment;
        _configuration = configuration;
        _httpClient = new HttpClient();
    }

    /// <summary>
    /// Uploads an image or document file to Cloudinary (or fallback local storage).
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
            return BadRequest(ApiResponse<object>.Fail("File size exceeds 10MB limit."));
        }

        var extension = Path.GetExtension(file.FileName);

        if (string.IsNullOrEmpty(extension) || ExecutableExtensions.Contains(extension))
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid file type. Executable files are prohibited."));
        }

        if (!AllowedExtensions.Contains(extension) || !AllowedMimeTypes.Contains(file.ContentType))
        {
            return BadRequest(ApiResponse<object>.Fail("Only JPG, PNG, WEBP, GIF images, PDF, and Office documents are allowed."));
        }

        // Check for Cloudinary configuration
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
                    return Ok(ApiResponse<UploadResponse>.Ok("File uploaded successfully to Cloudinary.", new UploadResponse
                    {
                        Url = cloudinaryUrl,
                        FileName = file.FileName,
                        Size = file.Length,
                        MimeType = file.ContentType
                    }));
                }
            }
            catch (Exception ex)
            {
                // Log and fallback to local disk
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

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var fileUrl = $"{baseUrl}/uploads/{uniqueFileName}";

        return Ok(ApiResponse<UploadResponse>.Ok("File uploaded successfully.", new UploadResponse
        {
            Url = fileUrl,
            FileName = uniqueFileName,
            Size = file.Length,
            MimeType = file.ContentType
        }));
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
    public string FileName { get; set; } = string.Empty;
    public long Size { get; set; }
    public string MimeType { get; set; } = string.Empty;
}

