namespace StudentCenter.Application.DTOs;

public class DashboardSummaryResponse
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int TotalAnnouncements { get; set; }
    public int PinnedAnnouncements { get; set; }
    public List<AnnouncementResponse> LatestAnnouncements { get; set; } = new();
}
