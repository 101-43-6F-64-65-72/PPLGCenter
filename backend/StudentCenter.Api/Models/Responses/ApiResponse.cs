namespace StudentCenter.Api.Models.Responses;

/// <summary>
/// Standardized API response wrapper for all endpoints.
/// </summary>
/// <typeparam name="T">The type of data being returned.</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? TraceId { get; set; }
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(string message, T? data = default)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Timestamp = DateTime.UtcNow,
            Data = data
        };
    }

    public static ApiResponse<T> Fail(string message, string? errorCode = null, string? traceId = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            ErrorCode = errorCode,
            TraceId = traceId,
            Timestamp = DateTime.UtcNow,
            Data = default
        };
    }

    public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
    {
        return Ok(message, data);
    }

    public static ApiResponse<T> ErrorResponse(string message, string? errorCode = null)
    {
        return Fail(message, errorCode);
    }
}
