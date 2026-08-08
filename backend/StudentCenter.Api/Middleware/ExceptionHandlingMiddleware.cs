using System.Net;
using System.Text.Json;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            _logger.LogInformation("HTTP {Method} {Path}", context.Request.Method, context.Request.Path);
            await _next(context);

            if (context.Response.StatusCode == (int)HttpStatusCode.NotFound)
            {
                await HandleNotFoundAsync(context);
            }
            else if (context.Response.StatusCode == (int)HttpStatusCode.Forbidden)
            {
                _logger.LogWarning("Forbidden access attempt to {Path}", context.Request.Path);
                await HandleForbiddenAsync(context);
            }
            else if (context.Response.StatusCode == (int)HttpStatusCode.Unauthorized)
            {
                _logger.LogInformation("Unauthorized request to {Path}", context.Request.Path);
                await HandleUnauthorizedAsync(context);
            }
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error at {Path}", context.Request.Path);
            await HandleValidationExceptionAsync(context, ex);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt at {Path}", context.Request.Path);
            await HandleExceptionAsync(context, (int)HttpStatusCode.Unauthorized, "Access denied.", "ERR_UNAUTHORIZED");
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument provided at {Path}", context.Request.Path);
            await HandleExceptionAsync(context, (int)HttpStatusCode.BadRequest, "Invalid request data.", "ERR_BAD_REQUEST");
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found at {Path}", context.Request.Path);
            await HandleExceptionAsync(context, (int)HttpStatusCode.NotFound, ex.Message, "ERR_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation at {Path}", context.Request.Path);
            await HandleExceptionAsync(context, (int)HttpStatusCode.BadRequest, ex.Message, "ERR_BAD_REQUEST");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred at {Path}", context.Request.Path);
            await HandleExceptionAsync(context, (int)HttpStatusCode.InternalServerError, "An unexpected server error occurred.", "ERR_INTERNAL_SERVER_ERROR");
        }
    }

    private async Task HandleValidationExceptionAsync(HttpContext context, System.ComponentModel.DataAnnotations.ValidationException ex)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

        var traceId = _environment.IsDevelopment() ? context.TraceIdentifier : null;
        var response = ApiResponse<object>.Fail(ex.Message, "ERR_VALIDATION", traceId);
        await WriteResponseAsync(context, response);
    }

    private async Task HandleNotFoundAsync(HttpContext context)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.ContentType = "application/json";
            var traceId = _environment.IsDevelopment() ? context.TraceIdentifier : null;
            var response = ApiResponse<object>.Fail("Resource not found.", "ERR_NOT_FOUND", traceId);
            await WriteResponseAsync(context, response);
        }
    }

    private async Task HandleUnauthorizedAsync(HttpContext context)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.ContentType = "application/json";
            var traceId = _environment.IsDevelopment() ? context.TraceIdentifier : null;
            var response = ApiResponse<object>.Fail("Unauthorized. Please provide valid authentication credentials.", "ERR_UNAUTHORIZED", traceId);
            await WriteResponseAsync(context, response);
        }
    }

    private async Task HandleForbiddenAsync(HttpContext context)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.ContentType = "application/json";
            var traceId = _environment.IsDevelopment() ? context.TraceIdentifier : null;
            var response = ApiResponse<object>.Fail("Forbidden. You do not have permission to access this resource.", "ERR_FORBIDDEN", traceId);
            await WriteResponseAsync(context, response);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, int statusCode, string message, string errorCode)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var traceId = _environment.IsDevelopment() ? context.TraceIdentifier : null;
            var response = statusCode switch
            {
                (int)HttpStatusCode.BadRequest => ApiResponse<object>.Fail("Bad request. " + message, errorCode, traceId),
                (int)HttpStatusCode.Unauthorized => ApiResponse<object>.Fail("Unauthorized. " + message, errorCode, traceId),
                (int)HttpStatusCode.Forbidden => ApiResponse<object>.Fail("Forbidden. " + message, errorCode, traceId),
                (int)HttpStatusCode.NotFound => ApiResponse<object>.Fail("Not found. " + message, errorCode, traceId),
                (int)HttpStatusCode.Conflict => ApiResponse<object>.Fail("Conflict. " + message, errorCode, traceId),
                (int)HttpStatusCode.UnprocessableEntity => ApiResponse<object>.Fail("Unprocessable entity. " + message, errorCode, traceId),
                (int)HttpStatusCode.InternalServerError => ApiResponse<object>.Fail("Internal server error. " + message, errorCode, traceId),
                _ => ApiResponse<object>.Fail(message, errorCode, traceId)
            };

            await WriteResponseAsync(context, response);
        }
    }

    private static async Task WriteResponseAsync(HttpContext context, ApiResponse<object> response)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(response, options);
        await context.Response.WriteAsync(json);
    }
}
