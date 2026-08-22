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

    private static string? Clean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim().Trim('"').Trim('\'');
    }

    private (string? CloudName, string? ApiKey, string? ApiSecret, string? UploadPreset) GetCredentials()
    {
        var cloudName = Clean(_configuration["Cloudinary:CloudName"]
            ?? _configuration["CLOUDINARY_CLOUD_NAME"]
            ?? _configuration["CLOUDINARY__CLOUDNAME"]
            ?? Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME")
            ?? Environment.GetEnvironmentVariable("CLOUDINARY__CLOUDNAME")
            ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"));

        var apiKey = Clean(_configuration["Cloudinary:ApiKey"]
            ?? _configuration["CLOUDINARY_API_KEY"]
            ?? _configuration["CLOUDINARY__APIKEY"]
            ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY")
            ?? Environment.GetEnvironmentVariable("CLOUDINARY__APIKEY")
            ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_CLOUDINARY_API_KEY"));

        var apiSecret = Clean(_configuration["Cloudinary:ApiSecret"]
            ?? _configuration["CLOUDINARY_API_SECRET"]
            ?? _configuration["CLOUDINARY__APISECRET"]
            ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET")
            ?? Environment.GetEnvironmentVariable("CLOUDINARY__APISECRET"));

        var uploadPreset = Clean(_configuration["Cloudinary:UploadPreset"]
            ?? _configuration["CLOUDINARY_UPLOAD_PRESET"]
            ?? _configuration["CLOUDINARY__UPLOADPRESET"]
            ?? Environment.GetEnvironmentVariable("CLOUDINARY_UPLOAD_PRESET")
            ?? Environment.GetEnvironmentVariable("CLOUDINARY__UPLOADPRESET")
            ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"));

        // Support CLOUDINARY_URL (e.g. cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
        var cloudinaryUrl = Clean(_configuration["Cloudinary:Url"]
            ?? _configuration["CLOUDINARY_URL"]
            ?? _configuration["CLOUDINARY__URL"]
            ?? Environment.GetEnvironmentVariable("CLOUDINARY_URL")
            ?? Environment.GetEnvironmentVariable("CLOUDINARY__URL"));

        if (!string.IsNullOrWhiteSpace(cloudinaryUrl))
        {
            try
            {
                var raw = cloudinaryUrl.Replace("cloudinary://", "");
                var atIndex = raw.LastIndexOf('@');
                if (atIndex > 0)
                {
                    var userInfo = raw.Substring(0, atIndex);
                    var parsedCloudName = raw.Substring(atIndex + 1).Trim('/');

                    var credParts = userInfo.Split(':');
                    if (credParts.Length == 2)
                    {
                        if (string.IsNullOrWhiteSpace(apiKey)) apiKey = credParts[0];
                        if (string.IsNullOrWhiteSpace(apiSecret)) apiSecret = credParts[1];
                    }
                    if (string.IsNullOrWhiteSpace(cloudName))
                    {
                        cloudName = parsedCloudName;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse CLOUDINARY_URL");
            }
        }

        return (cloudName, apiKey, apiSecret, uploadPreset);
    }

    private string DefaultFolder => Clean(_configuration["Cloudinary:Folder"] ?? Environment.GetEnvironmentVariable("CLOUDINARY_FOLDER")) ?? "student-center";

    public bool IsConfigured
    {
        get
        {
            var (cloudName, apiKey, apiSecret, uploadPreset) = GetCredentials();
            return !string.IsNullOrWhiteSpace(cloudName) &&
                (!string.IsNullOrWhiteSpace(uploadPreset) || (!string.IsNullOrWhiteSpace(apiKey) && !string.IsNullOrWhiteSpace(apiSecret)));
        }
    }

    private static void AddFormField(MultipartFormDataContent content, string name, string value)
    {
        var fieldContent = new StringContent(value, Encoding.UTF8);
        fieldContent.Headers.ContentType = null;
        content.Add(fieldContent, name);
    }

    public async Task<string> UploadImageAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "student-center",
        CancellationToken cancellationToken = default)
    {
        var (cloudName, apiKey, apiSecret, uploadPreset) = GetCredentials();

        if (string.IsNullOrWhiteSpace(cloudName) ||
            (string.IsNullOrWhiteSpace(uploadPreset) && (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))))
        {
            throw new InvalidOperationException("Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL) environment variables.");
        }

        var targetFolder = string.IsNullOrWhiteSpace(folder) ? DefaultFolder : folder.Trim();
        using var content = new MultipartFormDataContent();

        var fileContent = new StreamContent(fileStream);
        if (!string.IsNullOrWhiteSpace(contentType))
        {
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        }

        content.Add(fileContent, "file", fileName);

        if (!string.IsNullOrWhiteSpace(apiKey) && !string.IsNullOrWhiteSpace(apiSecret))
        {
            // Signed upload mode using SHA1 signature (preferred & secure)
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

            var sortedParams = new SortedDictionary<string, string>
            {
                { "folder", targetFolder },
                { "timestamp", timestamp }
            };

            var paramString = string.Join("&", sortedParams.Select(kv => $"{kv.Key}={kv.Value}"));
            var stringToSign = $"{paramString}{apiSecret}";

            using var sha1 = SHA1.Create();
            var hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
            var signature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

            AddFormField(content, "api_key", apiKey);
            AddFormField(content, "timestamp", timestamp);
            AddFormField(content, "folder", targetFolder);
            AddFormField(content, "signature", signature);

            _logger.LogInformation("Uploading image '{FileName}' to Cloudinary cloud '{CloudName}' using signed API key '{ApiKey}'...", fileName, cloudName, apiKey);
        }
        else if (!string.IsNullOrWhiteSpace(uploadPreset))
        {
            // Unsigned upload mode using preset
            AddFormField(content, "upload_preset", uploadPreset);
            if (!string.IsNullOrWhiteSpace(targetFolder))
            {
                AddFormField(content, "folder", targetFolder);
            }
            _logger.LogInformation("Uploading image '{FileName}' to Cloudinary using unsigned upload preset '{Preset}'...", fileName, uploadPreset);
        }
        else
        {
            throw new InvalidOperationException("Neither valid Cloudinary API key/secret nor upload preset was provided.");
        }

        var uploadUrl = $"https://api.cloudinary.com/v1_1/{cloudName}/image/upload";
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
        var (cloudName, apiKey, apiSecret, _) = GetCredentials();

        if (string.IsNullOrWhiteSpace(imageUrlOrPublicId) || string.IsNullOrWhiteSpace(cloudName) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
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
            var stringToSign = $"public_id={publicId}&timestamp={timestamp}{apiSecret}";

            using var sha1 = SHA1.Create();
            var hashBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
            var signature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

            using var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("public_id", publicId),
                new KeyValuePair<string, string>("api_key", apiKey!),
                new KeyValuePair<string, string>("timestamp", timestamp),
                new KeyValuePair<string, string>("signature", signature)
            });

            var destroyUrl = $"https://api.cloudinary.com/v1_1/{cloudName}/image/destroy";
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
