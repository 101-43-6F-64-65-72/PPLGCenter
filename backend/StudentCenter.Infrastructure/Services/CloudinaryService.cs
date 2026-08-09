using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.Interfaces;

namespace StudentCenter.Infrastructure.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<CloudinaryService> _logger;
    private readonly HttpClient _httpClient;

    public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = new HttpClient();
    }

    private string? CloudName =>
        _configuration["Cloudinary:CloudName"] ??
        Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");

    private string? ApiKey =>
        _configuration["Cloudinary:ApiKey"] ??
        Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");

    private string? ApiSecret =>
        _configuration["Cloudinary:ApiSecret"] ??
        Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

    private string DefaultFolder =>
        _configuration["Cloudinary:Folder"] ??
        Environment.GetEnvironmentVariable("CLOUDINARY_FOLDER") ??
        "student-center";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(CloudName) &&
        !string.IsNullOrWhiteSpace(ApiKey) &&
        !string.IsNullOrWhiteSpace(ApiSecret);

    public async Task<string> UploadImageAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "student-center",
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.");
        }

        var targetFolder = string.IsNullOrWhiteSpace(folder) ? DefaultFolder : folder.Trim();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        // Parameter signature string sorting (alphabetical order per Cloudinary API): folder={folder}&timestamp={timestamp}{apiSecret}
        var stringToSign = $"folder={targetFolder}&timestamp={timestamp}{ApiSecret}";

        using var sha1 = SHA1.Create();
        var hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
        var signature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

        using var content = new MultipartFormDataContent();

        var fileContent = new StreamContent(fileStream);
        if (!string.IsNullOrWhiteSpace(contentType))
        {
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        }

        content.Add(fileContent, "file", fileName);
        content.Add(new StringContent(ApiKey!), "api_key");
        content.Add(new StringContent(timestamp), "timestamp");
        content.Add(new StringContent(targetFolder), "folder");
        content.Add(new StringContent(signature), "signature");

        var uploadUrl = $"https://api.cloudinary.com/v1_1/{CloudName}/image/upload";

        _logger.LogInformation("Uploading image '{FileName}' to Cloudinary folder '{Folder}'...", fileName, targetFolder);

        var response = await _httpClient.PostAsync(uploadUrl, content, cancellationToken);
        var jsonResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Cloudinary API Upload Failed [{StatusCode}]: {Response}", response.StatusCode, jsonResponse);
            throw new InvalidOperationException($"Gagal mengunggah gambar ke Cloudinary: {response.StatusCode} - {jsonResponse}");
        }

        using var doc = JsonDocument.Parse(jsonResponse);
        if (doc.RootElement.TryGetProperty("secure_url", out var secureUrlProp))
        {
            var secureUrl = secureUrlProp.GetString();
            if (!string.IsNullOrEmpty(secureUrl))
            {
                _logger.LogInformation("Cloudinary upload successful. Secure URL: {SecureUrl}", secureUrl);
                return secureUrl;
            }
        }

        if (doc.RootElement.TryGetProperty("url", out var urlProp))
        {
            var url = urlProp.GetString();
            if (!string.IsNullOrEmpty(url))
            {
                return url;
            }
        }

        throw new InvalidOperationException("Cloudinary API response did not contain a valid secure_url.");
    }

    public async Task<bool> DeleteImageAsync(
        string? imageUrlOrPublicId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(imageUrlOrPublicId) || !IsConfigured)
        {
            return false;
        }

        try
        {
            var publicId = ExtractPublicId(imageUrlOrPublicId);
            if (string.IsNullOrWhiteSpace(publicId))
            {
                return false;
            }

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var stringToSign = $"public_id={publicId}&timestamp={timestamp}{ApiSecret}";

            using var sha1 = SHA1.Create();
            var hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
            var signature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

            using var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("public_id", publicId),
                new KeyValuePair<string, string>("api_key", ApiKey!),
                new KeyValuePair<string, string>("timestamp", timestamp),
                new KeyValuePair<string, string>("signature", signature)
            });

            var destroyUrl = $"https://api.cloudinary.com/v1_1/{CloudName}/image/destroy";
            var response = await _httpClient.PostAsync(destroyUrl, content, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully deleted image from Cloudinary: {PublicId}", publicId);
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete Cloudinary image '{UrlOrId}'", imageUrlOrPublicId);
        }

        return false;
    }

    private static string? ExtractPublicId(string input)
    {
        if (!input.StartsWith("http://") && !input.StartsWith("https://"))
        {
            return input.Trim();
        }

        // Example: https://res.cloudinary.com/cloudname/image/upload/v1234567890/student-center/folder/sample.jpg
        try
        {
            var uri = new Uri(input);
            var path = uri.AbsolutePath; // /cloudname/image/upload/v1234567890/student-center/folder/sample.jpg
            var uploadIndex = path.IndexOf("/upload/", StringComparison.OrdinalIgnoreCase);
            if (uploadIndex < 0) return null;

            var afterUpload = path.Substring(uploadIndex + "/upload/".Length); // v1234567890/student-center/folder/sample.jpg
            var segments = afterUpload.Split('/');

            // Skip version segment if present (e.g. v1234567890)
            var startIndex = (segments.Length > 0 && segments[0].StartsWith("v") && long.TryParse(segments[0].Substring(1), out _))
                ? 1
                : 0;

            var publicIdWithExt = string.Join("/", segments.Skip(startIndex)); // student-center/folder/sample.jpg
            var lastDot = publicIdWithExt.LastIndexOf('.');
            return lastDot > 0 ? publicIdWithExt.Substring(0, lastDot) : publicIdWithExt;
        }
        catch
        {
            return null;
        }
    }
}
