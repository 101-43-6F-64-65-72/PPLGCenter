namespace StudentCenter.Application.DTOs;

public class ImportSummaryResponse
{
    public int TotalRead { get; set; }
    public int SuccessCount { get; set; }
    public int SkippedCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
