using Microsoft.AspNetCore.Mvc;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Api.Controllers;

/// <summary>
/// Health check controller for VPS and container monitoring.
/// </summary>
[ApiController]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;

    public HealthController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Health check endpoint returning API, Database connection, Version, and Server Time.
    /// </summary>
    [HttpGet("health")]
    [HttpGet("api/health")]
    [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetHealth()
    {
        bool isDbHealthy = false;
        try
        {
            isDbHealthy = await _context.Database.CanConnectAsync();
        }
        catch
        {
            isDbHealthy = false;
        }

        var response = new HealthCheckResponse
        {
            ApiStatus = "Healthy",
            DatabaseStatus = isDbHealthy ? "Healthy" : "Unhealthy",
            Version = "1.0.0",
            ServerTime = DateTime.UtcNow
        };

        if (!isDbHealthy)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Readiness check endpoint verifying Database, Upload directory, Database configuration, and JWT configuration.
    /// </summary>
    [HttpGet("health/ready")]
    [HttpGet("api/health/ready")]
    [ProducesResponseType(typeof(ReadinessCheckResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ReadinessCheckResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetReadiness([FromServices] IConfiguration configuration, [FromServices] IWebHostEnvironment environment)
    {
        bool isDbHealthy = false;
        try
        {
            isDbHealthy = await _context.Database.CanConnectAsync();
        }
        catch
        {
            isDbHealthy = false;
        }

        bool isUploadDirWritable = false;
        try
        {
            var uploadPathEnv = configuration["UPLOAD_PATH"] ?? Environment.GetEnvironmentVariable("UPLOAD_PATH");
            var uploadsFolder = !string.IsNullOrWhiteSpace(uploadPathEnv)
                ? (Path.IsPathRooted(uploadPathEnv) ? uploadPathEnv : Path.Combine(environment.ContentRootPath, uploadPathEnv))
                : Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var testFile = Path.Combine(uploadsFolder, $"_health_test_{Guid.NewGuid()}.tmp");
            System.IO.File.WriteAllText(testFile, "probe");
            System.IO.File.Delete(testFile);
            isUploadDirWritable = true;
        }
        catch
        {
            isUploadDirWritable = false;
        }

        var hasDbConfig = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DATABASE_URL")) ||
                          !string.IsNullOrWhiteSpace(configuration.GetConnectionString("DefaultConnection"));

        var secretKeyFile = Environment.GetEnvironmentVariable("JWT_SECRET__FILE");
        var hasJwtConfig = (!string.IsNullOrWhiteSpace(secretKeyFile) && System.IO.File.Exists(secretKeyFile)) ||
                           !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("JWT_SECRET")) ||
                           !string.IsNullOrWhiteSpace(configuration["Jwt:SecretKey"]);

        bool isReady = isDbHealthy && isUploadDirWritable && hasDbConfig && hasJwtConfig;

        var response = new ReadinessCheckResponse
        {
            Ready = isReady,
            DatabaseStatus = isDbHealthy ? "Healthy" : "Unhealthy",
            UploadDirectoryStatus = isUploadDirWritable ? "Writable" : "NotWritable",
            DatabaseConfigured = hasDbConfig,
            JwtConfigured = hasJwtConfig,
            ServerTime = DateTime.UtcNow
        };

        if (!isReady)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
        }

        return Ok(response);
    }
}

public class HealthCheckResponse
{
    public string ApiStatus { get; set; } = "Healthy";
    public string DatabaseStatus { get; set; } = "Healthy";
    public string Version { get; set; } = "1.0.0";
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
}

public class ReadinessCheckResponse
{
    public bool Ready { get; set; }
    public string DatabaseStatus { get; set; } = "Healthy";
    public string UploadDirectoryStatus { get; set; } = "Writable";
    public bool DatabaseConfigured { get; set; }
    public bool JwtConfigured { get; set; }
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
}
