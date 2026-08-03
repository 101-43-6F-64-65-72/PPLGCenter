using System.Net;
using System.Text.Json;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);

            if (context.Response.StatusCode == (int)HttpStatusCode.NotFound)
            {
                await HandleNotFoundAsync(context);
            }
            else if (context.Response.StatusCode == (int)HttpStatusCode.Forbidden)
            {
                await HandleForbiddenAsync(context);
            }
            else if (context.Response.StatusCode == (int)HttpStatusCode.Unauthorized)
            {
                await HandleUnauthorizedAsync(context);
            }
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            await HandleValidationExceptionAsync(context, ex);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt.");
            await HandleExceptionAsync(context, (int)HttpStatusCode.Unauthorized, "Access denied.");
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument provided.");
            await HandleExceptionAsync(context, (int)HttpStatusCode.BadRequest, "Invalid request data.");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation.");
            await HandleExceptionAsync(context, (int)HttpStatusCode.Conflict, "Operation conflict.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred during the request.");
            await HandleExceptionAsync(context, (int)HttpStatusCode.InternalServerError, "An unexpected server error occurred.");
        }
    }

    private static async Task HandleValidationExceptionAsync(HttpContext context, System.ComponentModel.DataAnnotations.ValidationException ex)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

        var response = ApiResponse<object>.Fail(ex.Message);
        await WriteResponseAsync(context, response);
    }

    private static async Task HandleNotFoundAsync(HttpContext context)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.ContentType = "application/json";
            var response = ApiResponse<object>.Fail("Resource not found.");
            await WriteResponseAsync(context, response);
        }
    }

    private static async Task HandleUnauthorizedAsync(HttpContext context)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.ContentType = "application/json";
            var response = ApiResponse<object>.Fail("Unauthorized. Please provide valid authentication credentials.");
            await WriteResponseAsync(context, response);
        }
    }

    private static async Task HandleForbiddenAsync(HttpContext context)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.ContentType = "application/json";
            var response = ApiResponse<object>.Fail("Forbidden. You do not have permission to access this resource.");
            await WriteResponseAsync(context, response);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, int statusCode, string message)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var response = statusCode switch
            {
                (int)HttpStatusCode.BadRequest => ApiResponse<object>.Fail("Bad request. " + message),
                (int)HttpStatusCode.Unauthorized => ApiResponse<object>.Fail("Unauthorized. " + message),
                (int)HttpStatusCode.Forbidden => ApiResponse<object>.Fail("Forbidden. " + message),
                (int)HttpStatusCode.NotFound => ApiResponse<object>.Fail("Not found. " + message),
                (int)HttpStatusCode.Conflict => ApiResponse<object>.Fail("Conflict. " + message),
                (int)HttpStatusCode.UnprocessableEntity => ApiResponse<object>.Fail("Unprocessable entity. " + message),
                (int)HttpStatusCode.InternalServerError => ApiResponse<object>.Fail("Internal server error. " + message),
                _ => ApiResponse<object>.Fail(message)
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
