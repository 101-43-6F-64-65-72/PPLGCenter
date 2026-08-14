using Microsoft.Extensions.Primitives;

namespace StudentCenter.Api.Middleware;

/// <summary>
/// Adds security-related HTTP response headers to every response.
/// HSTS is only emitted outside the Development environment.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _environment;

    public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment environment)
    {
        _next = next;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["Referrer-Policy"] = "no-referrer";

        // Skip the strict content/policy headers for the Swagger UI (dev-only tool)
        // so its browser-rendered HTML keeps working.
        var isSwaggerUi = context.Request.Path.StartsWithSegments("/swagger")
            || context.Request.Path == "/";

        if (!isSwaggerUi)
        {
            headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        }

        if (!_environment.IsDevelopment())
        {
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }

        await _next(context);
    }
}
