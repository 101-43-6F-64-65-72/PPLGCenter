using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using StudentCenter.Application.Interfaces;

namespace StudentCenter.Infrastructure.Services;

public class SupabaseStorageService : IFileStorageService
{
    private const long MaxPdfSizeInBytes = 10 * 1024 * 1024; // 10MB
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _serviceRoleKey;
    private readonly string _bucketName;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_supabaseUrl) && !string.IsNullOrWhiteSpace(_serviceRoleKey);

    public SupabaseStorageService(IConfiguration configuration)
    {
        _httpClient = new HttpClient();
        
        _supabaseUrl = (configuration["SUPABASE_URL"]
            ?? configuration["Supabase:Url"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_URL")
            ?? string.Empty).TrimEnd('/');

        _serviceRoleKey = (configuration["SUPABASE_SERVICE_ROLE_KEY"]
            ?? configuration["Supabase:ServiceRoleKey"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
            ?? string.Empty).Trim();

        _bucketName = (configuration["SUPABASE_STORAGE_BUCKET"]
            ?? configuration["Supabase:StorageBucket"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_STORAGE_BUCKET")
            ?? "documents").Trim();
    }

    public async Task<string> UploadPdfAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "documents",
        CancellationToken cancellationToken = default)
    {
        if (fileStream == null || fileStream.Length == 0)
        {
            throw new ArgumentException("Dokumen PDF tidak boleh kosong.");
        }

        if (fileStream.Length > MaxPdfSizeInBytes)
        {
            throw new ArgumentException("Ukuran file melebihi batas maksimum 10 MB.");
        }

        var extension = Path.GetExtension(fileName);
        if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(contentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("File harus berupa PDF.");
        }

        if (!IsConfigured)
        {
            throw new InvalidOperationException("Supabase Storage belum dikonfigurasi pada server.");
        }

        var cleanFolder = string.IsNullOrWhiteSpace(folder) ? "documents" : folder.Trim('/').ToLowerInvariant();
        var uniqueFileName = $"{Guid.NewGuid()}{extension.ToLowerInvariant()}";
        var storagePath = $"{cleanFolder}/{uniqueFileName}";

        var uploadUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{storagePath}";

        using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
        request.Headers.Add("Authorization", $"Bearer {_serviceRoleKey}");
        request.Headers.Add("apikey", _serviceRoleKey);
        request.Headers.Add("x-upsert", "true");

        if (fileStream.CanSeek)
        {
            fileStream.Position = 0;
        }

        request.Content = new StreamContent(fileStream);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new Exception($"Gagal mengunggah dokumen: {response.StatusCode} - {errorBody}");
        }

        return storagePath;
    }

    public async Task<string> CreateSignedUrlAsync(
        string? filePathOrUrl,
        TimeSpan? expiresIn = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(filePathOrUrl))
        {
            return string.Empty;
        }

        var path = filePathOrUrl.Trim();

        // Backward compatibility: If it is already a full HTTP/HTTPS URL (Cloudinary or local legacy URL), return as-is
        if (path.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return path;
        }

        if (!IsConfigured)
        {
            return path;
        }

        // Clean bucket name prefix if included
        if (path.StartsWith($"{_bucketName}/", StringComparison.OrdinalIgnoreCase))
        {
            path = path.Substring(_bucketName.Length + 1);
        }

        path = path.TrimStart('/');

        try
        {
            var seconds = (int)(expiresIn?.TotalSeconds ?? 3600); // Default 60 minutes
            var signUrl = $"{_supabaseUrl}/storage/v1/object/sign/{_bucketName}/{path}";

            using var request = new HttpRequestMessage(HttpMethod.Post, signUrl);
            request.Headers.Add("Authorization", $"Bearer {_serviceRoleKey}");
            request.Headers.Add("apikey", _serviceRoleKey);

            var payload = JsonSerializer.Serialize(new { expiresIn = seconds });
            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return path;
            }

            var jsonStr = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(jsonStr);

            if (doc.RootElement.TryGetProperty("signedURL", out var signedUrlProp))
            {
                var signedPath = signedUrlProp.GetString();
                if (!string.IsNullOrEmpty(signedPath))
                {
                    if (signedPath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                        signedPath.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        return signedPath;
                    }

                    if (signedPath.StartsWith("/object/", StringComparison.OrdinalIgnoreCase))
                    {
                        signedPath = "/storage/v1" + signedPath;
                    }
                    else if (!signedPath.StartsWith("/storage/v1", StringComparison.OrdinalIgnoreCase))
                    {
                        signedPath = "/storage/v1/" + signedPath.TrimStart('/');
                    }

                    return $"{_supabaseUrl}{signedPath}";
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Supabase CreateSignedUrl Error] {ex.Message}");
        }

        return path;
    }

    public async Task DeleteAsync(
        string? filePathOrUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(filePathOrUrl) || !IsConfigured)
        {
            return;
        }

        var path = filePathOrUrl.Trim();

        // Skip legacy full HTTP URLs
        if (path.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (path.StartsWith($"{_bucketName}/", StringComparison.OrdinalIgnoreCase))
        {
            path = path.Substring(_bucketName.Length + 1);
        }

        path = path.TrimStart('/');

        var deleteUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{path}";

        using var request = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
        request.Headers.Add("Authorization", $"Bearer {_serviceRoleKey}");
        request.Headers.Add("apikey", _serviceRoleKey);

        try
        {
            await _httpClient.SendAsync(request, cancellationToken);
        }
        catch
        {
            // Ignore deletion errors to avoid breaking DB operations
        }
    }
}
