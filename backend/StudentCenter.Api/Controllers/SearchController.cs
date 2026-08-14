using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ICurrentUserService _currentUserService;

    public SearchController(ISearchService searchService, ICurrentUserService currentUserService)
    {
        _searchService = searchService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string keyword = "",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return BadRequest(ApiResponse<object>.Fail("Keyword is required and cannot be empty."));

        var userId = _currentUserService.UserId;
        var userRole = _currentUserService.Role;

        var result = await _searchService.SearchAsync(keyword, page, pageSize, userId, userRole);
        return Ok(ApiResponse<SearchResponse>.Ok("Search results retrieved successfully", result));
    }
}
