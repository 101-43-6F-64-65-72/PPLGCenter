using System.Text.RegularExpressions;

namespace StudentCenter.Application.Helpers;

public static class FileUrlHelper
{
    /// <summary>
    /// Normalizes image and file URLs for API responses.
    /// Converts legacy localhost URLs (e.g., http://localhost:5051/uploads/...) and relative /uploads/... paths
    /// to valid absolute URLs matching the active environment base URL.
    /// </summary>
    public static string? ResolveUrl(string? rawUrl, string? configuredBaseUrl = null)
    {
        if (string.IsNullOrWhiteSpace(rawUrl) || rawUrl.Contains("dummypic", StringComparison.OrdinalIgnoreCase))
            return rawUrl;

        var clean = rawUrl.Trim();

        // Data URLs and Blob URLs remain untouched
        if (clean.StartsWith("data:", StringComparison.OrdinalIgnoreCase) ||
            clean.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
        {
            return clean;
        }

        var baseUrl = (configuredBaseUrl
            ?? Environment.GetEnvironmentVariable("PUBLIC_BASE_URL")
            ?? Environment.GetEnvironmentVariable("APP_BASE_URL"))?.TrimEnd('/');

        // 1. Replace legacy localhost URLs (e.g. http://localhost:5051/uploads/file.png)
        if (Regex.IsMatch(clean, @"^https?://(localhost|127\.0\.0\.1)(:\d+)?", RegexOptions.IgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(baseUrl) && !baseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase) && !baseUrl.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase))
            {
                return Regex.Replace(clean, @"^https?://(localhost|127\.0\.0\.1)(:\d+)?", baseUrl, RegexOptions.IgnoreCase);
            }
            return clean;
        }

        // 2. Relative paths starting with /
        if (clean.StartsWith("/"))
        {
            if (!string.IsNullOrWhiteSpace(baseUrl))
            {
                return $"{baseUrl}{clean}";
            }
            return clean;
        }

        // 3. Absolute HTTP URLs in HTTPS environment -> Upgrade to HTTPS if needed
        if (clean.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(baseUrl) && baseUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                return "https://" + clean.Substring(7);
            }
        }

        return clean;
    }
}
