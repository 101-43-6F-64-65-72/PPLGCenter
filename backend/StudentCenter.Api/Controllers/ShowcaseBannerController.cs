using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/showcase-banners")]
public class ShowcaseBannerController : ControllerBase
{
    private readonly IShowcaseBannerService _showcaseBannerService;

    public ShowcaseBannerController(IShowcaseBannerService showcaseBannerService)
    {
        _showcaseBannerService = showcaseBannerService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveBanners()
    {
        var banners = await _showcaseBannerService.GetActiveBannersAsync();
        return Ok(new { success = true, data = banners });
    }

    [HttpGet("all")]
    [Authorize]
    public async Task<IActionResult> GetAllBanners()
    {
        var banners = await _showcaseBannerService.GetAllBannersAsync();
        return Ok(new { success = true, data = banners });
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBannerById(Guid id)
    {
        var banner = await _showcaseBannerService.GetBannerByIdAsync(id);
        if (banner == null)
            return NotFound(new { success = false, message = "Banner showcase tidak ditemukan." });

        return Ok(new { success = true, data = banner });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateBanner([FromBody] CreateShowcaseBannerRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Data banner tidak valid.", errors = ModelState });

        var created = await _showcaseBannerService.CreateBannerAsync(request);
        return CreatedAtAction(nameof(GetBannerById), new { id = created.Id }, new { success = true, data = created, message = "Banner showcase berhasil dibuat." });
    }

    [HttpPost("from-announcement/{announcementId:guid}")]
    [Authorize]
    public async Task<IActionResult> AddFromAnnouncement(Guid announcementId)
    {
        try
        {
            var created = await _showcaseBannerService.AddFromAnnouncementAsync(announcementId);
            return Ok(new { success = true, data = created, message = "Pengumuman berhasil ditambahkan ke showcase." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateBanner(Guid id, [FromBody] UpdateShowcaseBannerRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Data banner tidak valid.", errors = ModelState });

        try
        {
            var updated = await _showcaseBannerService.UpdateBannerAsync(id, request);
            return Ok(new { success = true, data = updated, message = "Banner showcase berhasil diperbarui." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteBanner(Guid id, [FromQuery] bool permanent = false)
    {
        var deleted = await _showcaseBannerService.DeleteBannerAsync(id, permanent);
        if (!deleted)
            return NotFound(new { success = false, message = "Banner showcase tidak ditemukan." });

        var msg = permanent 
            ? "Banner showcase berhasil dihapus secara permanen." 
            : "Banner showcase berhasil dinonaktifkan / diarsipkan.";

        return Ok(new { success = true, message = msg });
    }

    [HttpPost("{id:guid}/restore")]
    [Authorize]
    public async Task<IActionResult> RestoreBanner(Guid id)
    {
        try
        {
            var restored = await _showcaseBannerService.RestoreBannerAsync(id);
            return Ok(new { success = true, data = restored, message = "Banner showcase berhasil diaktifkan kembali." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("reorder")]
    [Authorize]
    public async Task<IActionResult> ReorderBanners([FromBody] ReorderShowcaseBannersRequest request)
    {
        var success = await _showcaseBannerService.ReorderBannersAsync(request);
        return Ok(new { success, message = "Urutan banner showcase berhasil diperbarui." });
    }
}
