using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ISearchService
{
    Task<SearchResponse> SearchAsync(string keyword, int page, int pageSize, Guid? userId = null, string? userRole = null);
}
