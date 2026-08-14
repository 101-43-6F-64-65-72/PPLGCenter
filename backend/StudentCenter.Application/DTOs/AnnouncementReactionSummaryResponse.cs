namespace StudentCenter.Application.DTOs;

public class AnnouncementReactionSummaryResponse
{
    public Guid AnnouncementId { get; set; }
    public int TotalReactions { get; set; }
    public Dictionary<string, int> Counts { get; set; } = new();
    public string? UserReaction { get; set; }
}
