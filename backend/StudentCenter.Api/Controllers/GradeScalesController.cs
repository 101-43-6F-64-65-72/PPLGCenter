using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/grade-scales")]
public class GradeScalesController : ControllerBase
{
    private readonly AppDbContext _context;

    public GradeScalesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.GradeScales
            .AsNoTracking()
            .OrderByDescending(s => s.Minimum)
            .Select(s => new GradeScaleResponse
            {
                Id = s.Id,
                Minimum = s.Minimum,
                Maximum = s.Maximum,
                Letter = s.Letter,
                Predicate = s.Predicate,
                Description = s.Description,
                IsActive = s.IsActive
            })
            .ToListAsync();

        return Ok(ApiResponse<List<GradeScaleResponse>>.Ok("Grade scales retrieved successfully", list));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGradeScaleRequest request)
    {
        var entity = new GradeScale
        {
            Id = Guid.NewGuid(),
            Minimum = request.Minimum,
            Maximum = request.Maximum,
            Letter = request.Letter.Trim(),
            Predicate = request.Predicate.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.GradeScales.Add(entity);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<GradeScaleResponse>.Ok("Grade scale created successfully", new GradeScaleResponse
        {
            Id = entity.Id,
            Minimum = entity.Minimum,
            Maximum = entity.Maximum,
            Letter = entity.Letter,
            Predicate = entity.Predicate,
            Description = entity.Description,
            IsActive = entity.IsActive
        }));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGradeScaleRequest request)
    {
        var entity = await _context.GradeScales.FindAsync(id);
        if (entity == null) return NotFound(ApiResponse<object>.Fail("Grade scale not found."));

        entity.Minimum = request.Minimum;
        entity.Maximum = request.Maximum;
        entity.Letter = request.Letter.Trim();
        entity.Predicate = request.Predicate.Trim();
        entity.Description = request.Description?.Trim();
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<GradeScaleResponse>.Ok("Grade scale updated successfully", new GradeScaleResponse
        {
            Id = entity.Id,
            Minimum = entity.Minimum,
            Maximum = entity.Maximum,
            Letter = entity.Letter,
            Predicate = entity.Predicate,
            Description = entity.Description,
            IsActive = entity.IsActive
        }));
    }
}
