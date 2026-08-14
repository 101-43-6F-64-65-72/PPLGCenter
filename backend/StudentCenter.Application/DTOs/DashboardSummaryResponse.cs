namespace StudentCenter.Application.DTOs;

public class DashboardSummaryResponse
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalClasses { get; set; }
    public int TotalDepartments { get; set; }
    public int TotalExtracurriculars { get; set; }
    public int TotalActiveMembers { get; set; }
    public int TotalAnnouncements { get; set; }
    public int PinnedAnnouncements { get; set; }
    public int TotalSubjects { get; set; }
    public int TotalSchedules { get; set; }
    public int TotalAcademicEvents { get; set; }
    public List<AnnouncementResponse> LatestAnnouncements { get; set; } = new();
}
