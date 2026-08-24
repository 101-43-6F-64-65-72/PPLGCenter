namespace StudentCenter.Application.DTOs;

public class ToggleShowcaseRequest
{
    public bool IsShowcase { get; set; }
    public int ShowcaseOrder { get; set; }
    public string? CustomCtaText { get; set; }
    public string? CustomCtaUrl { get; set; }
}
