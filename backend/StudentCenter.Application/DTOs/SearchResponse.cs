namespace StudentCenter.Application.DTOs;

public class SearchResult
{
    public string Type { get; set; } = string.Empty;
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SearchResponse
{
    public List<SearchResult> Announcements { get; set; } = new();
    public List<SearchResult> Materials { get; set; } = new();
    public List<SearchResult> Assignments { get; set; } = new();
    public List<SearchResult> CalendarEvents { get; set; } = new();
    public List<SearchResult> Facilities { get; set; } = new();
    public List<SearchResult> Extracurriculars { get; set; } = new();
    public List<SearchResult> Proposals { get; set; } = new();
    public List<SearchResult> Discussions { get; set; } = new();
    public List<SearchResult> Messages { get; set; } = new();
    public List<SearchResult> Elections { get; set; } = new();
    public List<SearchResult> Candidates { get; set; } = new();
    public int TotalCount => Announcements.Count + Materials.Count + Assignments.Count + CalendarEvents.Count + Facilities.Count + Extracurriculars.Count + Proposals.Count + Discussions.Count + Messages.Count + Elections.Count + Candidates.Count;
}
