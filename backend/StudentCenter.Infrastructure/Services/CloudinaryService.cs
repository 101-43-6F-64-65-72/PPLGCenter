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

    private string? Clean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim().Trim('"').Trim('\'');
    }

    private string? CloudName => Clean(_configuration["Cloudinary:CloudName"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME"));
    private string? ApiKey => Clean(_configuration["Cloudinary:ApiKey"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY"));
    private string? ApiSecret => Clean(_configuration["Cloudinary:ApiSecret"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET"));
    private string? UploadPreset => Clean(_configuration["Cloudinary:UploadPreset"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_UPLOAD_PRESET"));

    private string DefaultFolder => Clean(_configuration["Cloudinary:Folder"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_FOLDER")) ?? "student-center";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(CloudName) &&
        (!string.IsNullOrWhiteSpace(UploadPreset) || (!string.IsNullOrWhiteSpace(ApiKey) && !string.IsNullOrWhiteSpace(ApiSecret)));

    public async Task<string> UploadImageAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "student-center",
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_UPLOAD_PRESET) environment variables.");
        }

        var targetFolder = string.IsNullOrWhiteSpace(folder) ? DefaultFolder : folder.Trim();
        using var content = new MultipartFormDataContent();

        var fileContent = new StreamContent(fileStream);
        if (!string.IsNullOrWhiteSpace(contentType))
        {
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        }

        content.Add(fileContent, "file", fileName);

        if (!string.IsNullOrWhiteSpace(UploadPreset))
        {
            // Unsigned upload mode using preset
            content.Add(new StringContent(UploadPreset), "upload_preset");
            if (!string.IsNullOrWhiteSpace(targetFolder))
            {
                content.Add(new StringContent(targetFolder), "folder");
            }
            _logger.LogInformation("Uploading image '{FileName}' to Cloudinary using unsigned upload preset '{Preset}'...", fileName, UploadPreset);
        }
        else
        {
            // Signed upload mode using SHA1 signature
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

            var sortedParams = new SortedDictionary<string, string>
            {
                { "folder", targetFolder },
                { "timestamp", timestamp }
            };

            var paramString = string.Join("&", sortedParams.Select(kv => $"{kv.Key}={kv.Value}"));
            var stringToSign = $"{paramString}{ApiSecret}";

            using var sha1 = SHA1.Create();
            var hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
            var signature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

            content.Add(new StringContent(ApiKey!), "api_key");
            content.Add(new StringContent(timestamp), "timestamp");
            content.Add(new StringContent(targetFolder), "folder");
            content.Add(new StringContent(signature), "signature");

            _logger.LogInformation("Uploading image '{FileName}' to Cloudinary using signed API key '{ApiKey}'...", fileName, ApiKey);
        }

        var uploadUrl = $"https://api.cloudinary.com/v1_1/{CloudName}/image/upload";
        var response = await _httpClient.PostAsync(uploadUrl, content, cancellationToken);
        var jsonResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Cloudinary API Upload Failed [{StatusCode}]: {Response}", response.StatusCode, jsonResponse);
            throw new InvalidOperationException($"Cloudinary Upload Failed [{response.StatusCode}]: {jsonResponse}");
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
        if (string.IsNullOrWhiteSpace(imageUrlOrPublicId) || !IsConfigured || string.IsNullOrWhiteSpace(ApiKey) || string.IsNullOrWhiteSpace(ApiSecret))
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

        try
        {
            var uri = new Uri(input);
            var path = uri.AbsolutePath;
            var uploadIndex = path.IndexOf("/upload/", StringComparison.OrdinalIgnoreCase);
            if (uploadIndex < 0) return null;

            var afterUpload = path.Substring(uploadIndex + "/upload/".Length);
            var segments = afterUpload.Split('/');

            var startIndex = (segments.Length > 0 && segments[0].StartsWith("v") && long.TryParse(segments[0].Substring(1), out _))
                ? 1
                : 0;

            var publicIdWithExt = string.Join("/", segments.Skip(startIndex));
            var lastDot = publicIdWithExt.LastIndexOf('.');
            return lastDot > 0 ? publicIdWithExt.Substring(0, lastDot) : publicIdWithExt;
        }
        catch
        {
            return null;
        }
    }
}
