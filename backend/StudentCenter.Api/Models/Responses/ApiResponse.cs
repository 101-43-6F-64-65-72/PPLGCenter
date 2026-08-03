namespace StudentCenter.Api.Models.Responses;

/// <summary>
/// Standardized API response wrapper for all endpoints.
/// </summary>
/// <typeparam name="T">The type of data being returned.</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Indicates whether the request was successful.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// A descriptive message about the response.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// The response data payload.
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Creates a successful API response.
    /// </summary>
    /// <param name="message">The success message.</param>
    /// <param name="data">The response data.</param>
    /// <returns>A successful ApiResponse instance.</returns>
    public static ApiResponse<T> Ok(string message, T? data = default)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    /// <summary>
    /// Creates a failed API response.
    /// </summary>
    /// <param name="message">The error message.</param>
    /// <returns>A failed ApiResponse instance.</returns>
    public static ApiResponse<T> Fail(string message)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Data = default
        };
    }
}
